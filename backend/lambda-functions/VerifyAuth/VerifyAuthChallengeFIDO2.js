// ### About this Flow ###
// Using Custom Auth Flow through Amazon Cognito User Pools with Lambda Triggers to complete a 'CUSTOM_CHALLENGE'. 
// This custom challenge is performing verification as a Web Authentication Relying Party (RP) server
// during a WebAuthn flow. 

'use strict';

var AWS = require('aws-sdk');
AWS.config.region = process.env.Region;
var lambda = new AWS.Lambda();
const base64url = require('base64url');
const cbor      = require('cbor');
const dbUtil    = require('./DatabaseController.js');
const validate  = require('validate.js');
const defaultInvalidPIN = -1;
const constraints = {
    pin: {
        presence: true,
        numericality: {
            onlyInteger: true,
            greaterThan: -1,
        },
        length: {
            minimum: 4,
            maximum: 16
        }
    },
    confirmPin: {
        equality: "pin"
    }
};


// Main entry function
exports.handler = async (event) => {
    console.log('RECEIVED Event: ', JSON.stringify(event, null, 2));

    // Parsing the create() or get() response from client
    let keyResponse = JSON.parse(event.request.challengeAnswer) || null;
    console.log('Key Response: ', JSON.stringify(keyResponse, null, 2));
    
    let userName = event.userName;
    let authType = event.request.privateChallengeParameters || null;
    
    // REGISTRATION
    if(authType.type === 'webauthn.create'){
        console.log('processing webauthn.create() REGISTRATION response');
        
        //Verify pin if UV = false
        let attestationBuffer = base64url.toBuffer(keyResponse.credential.response.attestationObject);
        let attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
        let uv = await getUV(attestationStruct.authData);
        if(uv === false) {
            let pinCodeAnswer = parseInt(keyResponse.pinCode) || defaultInvalidPIN;
            
            // If there's a pinCode zero or less then fail registration
            const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
            console.log("pinResult: ", pinResult);
            if(pinResult){
                console.log('FAILED pinCode: UV=false and user did not provide pinCode');
                event.response.answerCorrect = false;
                
                // Assrtion passed but pinCode failed. Set current challenge to PINCODE
                event.response.challengeName = 'PINCODE';
                
                console.log('RETURNED Event: ', JSON.stringify(event, null, 2));
                return event;
            }
            
            dbUtil.insertPin(userName, pinCodeAnswer.toString());

        }
    
        if(await verifyMakeCredentialResponse(keyResponse, event)) {
            console.log('verifyMakeCredentialResponse(attestationResponse) returned TRUE');
            event.response.answerCorrect = true;
        } else { // If Attestation fails validation
            console.log('verifyMakeCredentialResponse(attestationResponse) returned FALSE');
            event.response.answerCorrect = false;
        }

        const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
            apiVersion: '2016-04-18'
          });
        cognitoidentityserviceprovider.adminUpdateUserAttributes(
          {
            UserAttributes: [
              {
                Name: 'preferred_username',
                Value: event.request.userAttributes.sub
              }
            ],
            UserPoolId: event.userPoolId,
            Username: event.userName
          },
          function(err, data) {
            console.log("err: ", err);
            console.log("data: ", data);
          }
        );
    
    // AUTHENTICATION
    } else if (authType.type === 'webauthn.get') {
        console.log('processing webauthn.get() AUTHENTICATION response');
        
        if (keyResponse.recoveryCode) {
            if(await dbUtil.validateRecoveryCode(userName, keyResponse.recoveryCode)) {
                event.response.answerCorrect = true;
                return event;
            } else {
                console.log('FAILED invalid recovery code');
                event.response.answerCorrect = false;
                
                // Assrtion passed but pinCode failed. Set current challenge to PINCODE
                event.response.challengeName = 'RECOVERYCODE';
                return event;
            }
        }
        
        if(await verifyAssertionResponse(keyResponse, event)) {
            console.log('verifyAssertion(keyResponse) returned TRUE. Checking UV...');
            
            let buffer = base64url.toBuffer(keyResponse.credential.response.authenticatorData);
            let uv = await getUV(buffer);
            if (uv === true) { // If UV=true, continue and succeed
                console.log('UserVerification (UV) = true');
                event.response.answerCorrect = true;
            
            } else { // If assertion passed and UV=false, we need to look for pin or prompt for pin as an additional challenge/response
                // First check event.request.challengeAnswer.pinCode to see if it was already provided.
                var isPinVerified = false;
                
                // Check to see if client provided the pinCode along with assertionResponse
                let pinCodeAnswer = keyResponse.pinCode || defaultInvalidPIN;
                
                // If it is a valid pin, verify given pinCode with expected pinCode
                const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
                console.log("pinResult: ", pinResult);
                if(!pinResult){
                    isPinVerified = await dbUtil.verifyServerPinCode(userName, pinCodeAnswer.toString());
                }
                
                if(isPinVerified){ 
                    console.log('SUCCESSFUL pinCode: UV=false but provided pinCode matches expected user network pinCode');
                    event.response.answerCorrect = true;
                } else { // If the pin code was NOT provided OR doesn't match, return with challenge looking for pin code
                    console.log('FAILED pinCode: UV=false and user did not provide pinCode or code did not match expected network pinCode');
                    event.response.answerCorrect = false;
                    
                    // Assrtion passed but pinCode failed. Set current challenge to PINCODE
                    event.response.challengeName = 'PINCODE';
                }
            }
        } else {
            console.log('verifyAssertion(assertionResponse) returned FALSE');
            event.response.answerCorrect = false;
        }
    } else {
        console.log('Failed to determine if this was a webauthn.create or webauthn.get');
    }
    
    console.log('RETURNED Event: ', JSON.stringify(event, null, 2));
    
    return event;
};

// Verify ATTESTATION during registration
async function verifyMakeCredentialResponse(attestationResponse, event) {
    
    const payload = JSON.stringify({
        "type": "finishRegistration",
        "requestId": attestationResponse.requestId,
        "credential": attestationResponse.credential
    });
    console.log("request payload: "+payload);
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();

        console.log("response: ", response);
        let payload = JSON.parse(response.Payload);
        console.log("response payload: ", payload);
        console.log("response payload.credential: ", payload.credential);
        
        if(payload.credential) {
            console.log("register success");
            return true;
        } else {
            console.log("register fail");
            return false;
        }
    } catch (err) {
        console.log("error"+ err);
        return false;
    }
}

// Verify ASSERTION during authentication
// Need to verify challenge mathes RP challenge, expected origin matches, and confirm this was a webauthn.get()
async function verifyAssertionResponse (assertionResponse, event) {

    const payload = JSON.stringify({
        "type": "finishAuthentication",
        "requestId": assertionResponse.requestId,
        "credential": assertionResponse.credential
    });
    console.log("request payload: "+payload);

    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };

    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();

        console.log("response: ", response);
        let payload = JSON.parse(response.Payload);
        console.log("response payload: ", payload);
        
        return (payload.success === true);
    } catch (err) {
        console.log("error"+ err);
        return false;
    }
}

async function getUV(buffer) {

    let flagsBuf = buffer.slice(32, 33);
    let flagsInt      = flagsBuf[0];
    let flags = {
        up: !!(flagsInt & 0x01),
        uv: !!(flagsInt & 0x04),
        at: !!(flagsInt & 0x40),
        ed: !!(flagsInt & 0x80),
        flagsInt
    };
    return flags.uv;
}
