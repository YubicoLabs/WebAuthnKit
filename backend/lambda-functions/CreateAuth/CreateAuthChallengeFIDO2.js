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
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const lambdaClient = new LambdaClient({ region: process.env.Region });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.Region });
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
const data = require('./db-client')({
    secretArn: process.env.DBSecretsStoreArn,
    resourceArn: process.env.DBAuroraClusterArn,
    database: process.env.DatabaseName
});


// Main async handler - Only called by Cognito User Pools for Custom Auth Flow
exports.handler = async (event = {}) => {

    const result = validate({username: event.userName}, constraints)
    if(result){
        return;
    }

    // Get known credentials for user. Always set username to lowerCase
    let creds = await getAllowedCredentialsForUser(event.userName, event.request.userAttributes.sub);
    
    // IF credentials exist, authenticate...else register and return pinCode
    if (creds.userCredentials === undefined || creds.userCredentials.length === 0) {
        // Registration params
        var publicKeyCredentialCreationOptions = await getCreateCredentialsOptions(event, creds);
        event.response.privateChallengeParameters = { "type": "webauthn.create" };
        event.response.publicChallengeParameters = { "type": "webauthn.create", publicKeyCredentialCreationOptions, "pinCode": creds.pinCode };
        
    } else  {
        // Authentication params
        var publicKeyCredentialRequestOptions = await getCredentialsOptions(event.request.userAttributes.name);
        event.response.privateChallengeParameters = { "type": "webauthn.get" };
        event.response.publicChallengeParameters = { "type": "webauthn.get", publicKeyCredentialRequestOptions };
    }

    return event;
};

// REGISTRATION
async function getCreateCredentialsOptions(event, creds) {

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

    const payload = JSON.stringify({
        "type": "startRegistration",
        "username": event.request.userAttributes.name,
        "displayName": event.request.userAttributes.name,
        "credentialNickname": "Security Key",
        "residentKey": "preferred",
        "uid": event.request.userAttributes.sub
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

        let startRegisterPayload = JSON.parse(JSON.parse(payloadString));
        
        const coseLookup = {"ES256": -7, "EdDSA": -8, "RS256": -257, "ES384": -35, "ES512": -36, "Ed448": -9, "RS384": -258, "RS512": -259};

        startRegisterPayload.requestId = startRegisterPayload.requestId.base64url || startRegisterPayload.requestId.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.user.id = startRegisterPayload.publicKeyCredentialCreationOptions.user.id.base64url || startRegisterPayload.publicKeyCredentialCreationOptions.user.id.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.challenge = startRegisterPayload.publicKeyCredentialCreationOptions.challenge.base64url || startRegisterPayload.publicKeyCredentialCreationOptions.challenge.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.attestation = startRegisterPayload.publicKeyCredentialCreationOptions.attestation.toLowerCase();
        if (startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification) {
            startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification = startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification.toLowerCase();
        }
        if (startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.residentKey) {
            startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.residentKey = startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.residentKey.toLowerCase();
        }
        startRegisterPayload.publicKeyCredentialCreationOptions.pubKeyCredParams = startRegisterPayload.publicKeyCredentialCreationOptions.pubKeyCredParams.map( (cred) => {
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.alg = coseLookup[cred.alg];
            return cred;
        }).filter(cred => cred.alg !== undefined);
        
        return JSON.stringify(startRegisterPayload);
    } catch (err) {
        console.error('Failed to create registration options:', err);
        throw new Error('Failed to create registration options: ' + err.message);
    }
}

// AUTHENTICATION
async function getCredentialsOptions(username) {

   const payload = JSON.stringify({
        "type": "startAuthentication",
        "username": username
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

        let startAuthPayload = JSON.parse(JSON.parse(payloadString));

        startAuthPayload.requestId = startAuthPayload.requestId.base64url || startAuthPayload.requestId.base64;
        if (startAuthPayload.publicKeyCredentialRequestOptions.userVerification) {
            startAuthPayload.publicKeyCredentialRequestOptions.userVerification = startAuthPayload.publicKeyCredentialRequestOptions.userVerification.toLowerCase();
        }
        startAuthPayload.publicKeyCredentialRequestOptions.challenge = startAuthPayload.publicKeyCredentialRequestOptions.challenge.base64url || startAuthPayload.publicKeyCredentialRequestOptions.challenge.base64;
        startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials = startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials.map( (cred) => {
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.id = cred.id.base64url || cred.id.base64;
            return cred
        });
        
        return JSON.stringify(startAuthPayload);
    } catch (err) {
        console.error('Failed to create authentication options:', err);
        throw new Error('Failed to create authentication options: ' + err.message);
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
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    try {
        let response = await lambdaClient.send(new InvokeCommand(params));

        const payloadString = new TextDecoder().decode(response.Payload);
        let payload = JSON.parse(JSON.parse(payloadString));
        userCreds.records = payload;
    } catch (err) {
        console.error('Failed to get credentials for user:', err);
        throw new Error('Failed to get credentials for user: ' + err.message);
    }
    
    
    // Return empty credentials if none defined in db
    if (userCreds.records === undefined || userCreds.records.length === 0) {
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
        userCredentials: (userCreds.records)
    };

    return userCredentialObject;
}
