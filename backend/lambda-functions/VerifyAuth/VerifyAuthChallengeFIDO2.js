// ### About this Flow ###
// Using Custom Auth Flow through Amazon Cognito User Pools with Lambda Triggers to complete a 'CUSTOM_CHALLENGE'. 
// This custom challenge is performing verification as a Web Authentication Relying Party (RP) server
// during a WebAuthn flow. 

'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const lambdaClient = new LambdaClient({ region: process.env.Region });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.Region });
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

    // Parsing the create() or get() response from client
    let keyResponse = JSON.parse(event.request.challengeAnswer) || null;
    
    let userName = event.userName;
    let authType = event.request.privateChallengeParameters || null;
    
    // REGISTRATION
    if(authType.type === 'webauthn.create'){
        
        //Verify pin if UV = false
        let attestationBuffer = base64url.toBuffer(keyResponse.credential.response.attestationObject);
        let attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
        let uv = await getUV(attestationStruct.authData);
        if(uv === false) {
            let pinCodeAnswer = parseInt(keyResponse.pinCode) || defaultInvalidPIN;
            
            // If there's a pinCode zero or less then fail registration
            const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
            if(pinResult){
                event.response.answerCorrect = false;
                
                // Assrtion passed but pinCode failed. Set current challenge to PINCODE
                event.response.challengeName = 'PINCODE';
                
                return event;
            }
            
            dbUtil.insertPin(userName, pinCodeAnswer.toString());

        }
    
        if(await verifyMakeCredentialResponse(keyResponse, event)) {
            event.response.answerCorrect = true;
        } else { // If Attestation fails validation
            event.response.answerCorrect = false;
        }

        try {
            await cognitoClient.send(new AdminUpdateUserAttributesCommand({
                UserAttributes: [
                    {
                        Name: 'preferred_username',
                        Value: event.request.userAttributes.sub
                    }
                ],
                UserPoolId: event.userPoolId,
                Username: event.userName
            }));
        } catch (err) {
            console.error('Failed to update user attributes:', err);
        }
    
    // AUTHENTICATION
    } else if (authType.type === 'webauthn.get') {
        
        if (keyResponse.recoveryCode) {
            if(await dbUtil.validateRecoveryCode(userName, keyResponse.recoveryCode)) {
                event.response.answerCorrect = true;
                return event;
            } else {
                event.response.answerCorrect = false;
                
                // Assrtion passed but pinCode failed. Set current challenge to PINCODE
                event.response.challengeName = 'RECOVERYCODE';
                return event;
            }
        }
        
        if(await verifyAssertionResponse(keyResponse, event)) {
            
            let buffer = base64url.toBuffer(keyResponse.credential.response.authenticatorData);
            let uv = await getUV(buffer);
            if (uv === true) { // If UV=true, continue and succeed
                event.response.answerCorrect = true;
            
            } else { // If assertion passed and UV=false, we need to look for pin or prompt for pin as an additional challenge/response
                // First check event.request.challengeAnswer.pinCode to see if it was already provided.
                var isPinVerified = false;
                
                // Check to see if client provided the pinCode along with assertionResponse
                let pinCodeAnswer = keyResponse.pinCode || defaultInvalidPIN;
                
                // If it is a valid pin, verify given pinCode with expected pinCode
                const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
                if(!pinResult){
                    isPinVerified = await dbUtil.verifyServerPinCode(userName, pinCodeAnswer.toString());
                }
                
                if(isPinVerified){ 
                    event.response.answerCorrect = true;
                } else { // If the pin code was NOT provided OR doesn't match, return with challenge looking for pin code
                    event.response.answerCorrect = false;
                    
                    // Assrtion passed but pinCode failed. Set current challenge to PINCODE
                    event.response.challengeName = 'PINCODE';
                }
            }
        } else {
            event.response.answerCorrect = false;
        }
    } else {
    }
    
    
    return event;
};

// Verify ATTESTATION during registration
async function verifyMakeCredentialResponse(attestationResponse, event) {
    
    const payload = JSON.stringify({
        "type": "finishRegistration",
        "requestId": attestationResponse.requestId,
        "credential": attestationResponse.credential
    });
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    try {
        let response = await lambdaClient.send(new InvokeCommand(params));

        // Decode tail logs from JavaWebAuthnLib to surface the actual error
        if (response.LogResult) {
            const javaLogs = Buffer.from(response.LogResult, 'base64').toString('utf-8');
            console.log('[JavaWebAuthnLib LOGS]:', javaLogs);
        }

        const payloadString = new TextDecoder().decode(response.Payload);
        let payload = JSON.parse(payloadString);

        console.log('[VerifyAuth] finishRegistration response (first 600 chars):', payloadString.slice(0, 600));

        // If the Java Lambda returned a Gson-serialized string, double-parse it
        if (typeof payload === 'string') {
            payload = JSON.parse(payload);
        }

        if(payload.credential) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error('Failed to verify attestation:', err);
        throw new Error('Failed to verify attestation: ' + err.message);
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

    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };

    try {
        let response = await lambdaClient.send(new InvokeCommand(params));

        const payloadString = new TextDecoder().decode(response.Payload);
        let payload = JSON.parse(payloadString);

        // If the Java Lambda returned a Gson-serialized string, double-parse it
        if (typeof payload === 'string') {
            payload = JSON.parse(payload);
        }

        return (payload.success === true);
    } catch (err) {
        console.error('Failed to verify assertion:', err);
        throw new Error('Failed to verify assertion: ' + err.message);
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
