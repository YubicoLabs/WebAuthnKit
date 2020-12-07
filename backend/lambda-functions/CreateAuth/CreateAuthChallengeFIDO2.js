// ### About this Flow ###
// Using Custom Auth Flow through Amazon Cognito User Pools with Lambda Triggers to complete a 'CUSTOM_CHALLENGE'. 
//
// ### About this function ###
// This CreateAuthChallengeFIDO2 function (2nd of 4 triggers) creates a 'CUSTOM_CHALLENGE'
// for REGISTRATION and AUTHENTICATION acting as a Web Authentication Relying Party (RP) in a WebAuthn flow.
// If a user does not exist or exists but has no credentials, this function will make this a registration. If user exists, get credentials and start authentication flow.

// ### Last Updated ###
// Updated: Nov 11, 2020
// Renamed networkPin to serverVerifiedPin

'use strict';

var crypto = require('crypto');
var AWS = require('aws-sdk');
AWS.config.region = process.env.Region;
var lambda = new AWS.Lambda();
const validate  = require('validate.js');
var constraints = {
    username: {
        presence: true,
        format: {
            pattern: "[a-z0-9_\-]+",
            flags: "i",
            message: "can only contain a-z, 0-9, or _-"
        },
        length: {
            minimum: 3,
            maximum: 20
        }
    }
};

// Using npmjs.com/package/data-api-client package for accessing an Aurora Serverless Database with Data API enabled
const data = require('data-api-client')({
    secretArn: process.env.DBSecretsStoreArn,
    resourceArn: process.env.DBAuroraClusterArn,
    database: process.env.DatabaseName
});


// Main async handler - Only called by Cognito User Pools for Custom Auth Flow
exports.handler = async (event = {}) => {
    console.log('RECEIVED Event: ', JSON.stringify(event, null, 2));

    const result = validate({username: event.userName}, constraints)
    if(result){
        console.error("invalid username: ", result);
        return;
    }

    // Get known credentials for user. Always set username to lowerCase
    let creds = await getAllowedCredentialsForUser(event.userName, event.request.userAttributes.sub);
    console.log('User creds found: ' + creds.length);
    console.log('User creds: ', + creds);
    
    // IF credentials exist, authenticate...else register and return pinCode
    if (creds.userCredentials === undefined || creds.userCredentials.length == 0) {
        // Registration params
        console.log('Entered registration ceremony');
        var publicKeyCredentialCreationOptions = await getCreateCredentialsOptions(event, creds);
        event.response.privateChallengeParameters = { "type": "webauthn.create" };
        event.response.publicChallengeParameters = { "type": "webauthn.create", publicKeyCredentialCreationOptions, "pinCode": creds.pinCode };
        
    } else  {
        // Authentication params
        console.log('Entered authentication ceremony');
        var publicKeyCredentialRequestOptions = await getCredentialsOptions(event.request.userAttributes.name);
        event.response.privateChallengeParameters = { "type": "webauthn.get" };
        event.response.publicChallengeParameters = { "type": "webauthn.get", publicKeyCredentialRequestOptions };
    }

    console.log('Returned event: ', JSON.stringify(event, null, 2));
    return event;
};

// REGISTRATION
async function getCreateCredentialsOptions(event, creds) {
    
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

    const payload = JSON.stringify({
        "type": "startRegistration",
        "username": event.request.userAttributes.name,
        "displayName": event.request.userAttributes.name,
        "credentialNickname": "Security Key",
        "requireResidentKey": false,
        "uid": event.request.userAttributes.sub
    });
    console.log("getCreateCredentialsOptions request payload: "+payload);

    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };

    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();
        console.log("response: "+response);
        console.log("response payload: "+response.Payload);
        console.log("response payload jsonparse: "+JSON.parse(response.Payload));

        let startRegisterPayload = JSON.parse(JSON.parse(response.Payload));
        console.log("response payload jsonparse2: "+startRegisterPayload);
        
        const coseLookup = {"ES256": -7, "EdDSA": -8, "RS256": -257};
        
        startRegisterPayload.requestId = startRegisterPayload.requestId.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.user.id = startRegisterPayload.publicKeyCredentialCreationOptions.user.id.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.challenge = startRegisterPayload.publicKeyCredentialCreationOptions.challenge.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.attestation = startRegisterPayload.publicKeyCredentialCreationOptions.attestation.toLowerCase();
        startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification = startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification.toLowerCase();
        startRegisterPayload.publicKeyCredentialCreationOptions.pubKeyCredParams = startRegisterPayload.publicKeyCredentialCreationOptions.pubKeyCredParams.map( (cred) => { 
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.alg = coseLookup[cred.alg];
            console.log("cred: "+ JSON.stringify(cred));
            return cred;
        });
        console.log("response payload: ", startRegisterPayload);
        
        return JSON.stringify(startRegisterPayload);
    } catch (err) {
        //context.fail(err);
        console.log("error"+ err);
        return "error";
    }
}

// AUTHENTICATION
async function getCredentialsOptions(username) {

   const payload = JSON.stringify({
        "type": "startAuthentication",
        "username": username
    });
    console.log("getCredentialsOptions request payload: "+payload);

    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };

    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();
        console.log("response: "+response);
        console.log("response payload: "+response.Payload);
        console.log("response payload jsonparse: "+JSON.parse(response.Payload));

        let startAuthPayload = JSON.parse(JSON.parse(response.Payload));
        console.log("startAuthPayload: ", startAuthPayload);

        startAuthPayload.requestId = startAuthPayload.requestId.base64;
        console.log("requestId: ", startAuthPayload.requestId);
        startAuthPayload.publicKeyCredentialRequestOptions.userVerification = startAuthPayload.publicKeyCredentialRequestOptions.userVerification.toLowerCase();
        startAuthPayload.publicKeyCredentialRequestOptions.challenge = startAuthPayload.publicKeyCredentialRequestOptions.challenge.base64;
        console.log("challenge: ", startAuthPayload.publicKeyCredentialRequestOptions.challenge);
        startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials = startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials.map( (cred) => { 
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.id = cred.id.base64;
            return cred
        });
        console.log("response payload: ", startAuthPayload);
        
        return JSON.stringify(startAuthPayload);
    } catch (err) {
        //context.fail(err);
        console.log("error"+ err);
        return "error";
    }
}

// Get all WebAuthn credentials from DB for given user
// Returns: { "id:" <credentilaId>, "type:" "public-key" } as allowedCredentials
async function getAllowedCredentialsForUser(userName, cognitoId){
    
    // Get credentials associated with a user
    var userCredentials = [];
    let userCreds = {};

    const payload = JSON.stringify({
        "type": "getCredentialIdsForUsername",
        "username": userName,
    });
    console.log("getCredentialIdsForUsername payload: "+payload);
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();

        let payload = JSON.parse(JSON.parse(response.Payload));
        console.log("response payload: ", payload);
        userCreds.records = payload;
    } catch (err) {
        console.log("error"+ err);
        return "error";
    }
    
    console.log('userCreds: ', userCreds.records);
    
    // Return empty credentials if none defined in db
    if (userCreds.records === undefined || userCreds.records == 0) {
        // Create new user with empty credentials
        await data.query('INSERT IGNORE INTO user (userName, cognito_id) VALUES(:userName, :cognito_id)', { userName: userName, cognito_id: cognitoId });
        
        let userCredentialObject = {
            userName: userName,
            cognitoId: cognitoId,
            userCredentials: (userCredentials)
        };
        
        return userCredentialObject;
    }
    
    let userCredentialObject = {
        userName: userName,
        cognitoId: cognitoId,
        userCredentials: (payload)
    };

    return userCredentialObject;
}
