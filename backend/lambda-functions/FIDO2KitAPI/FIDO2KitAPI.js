// ### About this function ###
// This FID2KitAPI function handles the backend business logic for the WebAuthn Starter Kit backend API 
// connected directly to API Gateway endpoint. This function will handle the user profile and credential management.

// ### What Does this Function Do? ###
// Get all FIDO credentials for given user
// Updates FIDO credential nicknames
// Deletes FIDO credentials
// Update server verified pin associated with user
// Handles backup code creation, code used, and code reset for account recovery

// ### Next steps ###

// Updated: Nov 11, 2020
// Renamed networkPin -> serverVerifiedPin

const dbUtil    = require('./DatabaseController.js');
const base64url = require('base64url');
const cbor      = require('cbor');
var crypto      = require('crypto');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
var bcrypt      = require('bcryptjs');
const lambdaClient = new LambdaClient({ region: process.env.Region });
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
    },
    nickname: {
        length: {
            maximum: 20
        }
    }
};
const saltRounds = 5;


exports.handler = async (event, context) => {
    
    
    try {
        var sub = (event.requestContext.authorizer) ? event.requestContext.authorizer.claims.sub : undefined;
        let profile = undefined;
        if(sub) {
            profile = await dbUtil.getUserProfile(sub);
        }

        const resource = event.resource;
        const method = event.httpMethod;
        
        // hande routes
        switch(true) {
            case resource.endsWith('/users/credentials') && method === 'GET':
                return getAll(profile.username, profile.id);
            case resource.endsWith('/users/credentials/fido2') && method === 'PUT':
                return updateFIDO2CredentialNickname(profile.username, event.body);
            case resource.endsWith('/users/credentials/fido2') && method === 'DELETE':
                return deleteFIDO2Credential(profile.username, event.queryStringParameters.id);
            case resource.endsWith('/users/credentials/fido2/authenticate') && method === 'GET':
                return startUsernamelessAuthentication();
            case resource.endsWith('/users/credentials/fido2/register') && method === 'POST':
                return startRegisterFIDO2Credential(profile, event.body, sub);
            case resource.endsWith('/users/credentials/fido2/register/finish') && method === 'POST':
                return finishRegisterFIDO2Credential(profile.username, event.body);
            case resource.endsWith('/users/credentials/pin') && method === 'POST':
                return updatePin(profile.id, event.body);
            case resource.endsWith('/users/credentials/codes') && method === 'GET':
                return listRecoveryCodes(profile.id);
            case resource.endsWith('/users/credentials/codes') && method === 'DELETE':
                return resetRecoveryCodes(profile.id);
            case resource.endsWith('/users') && method === 'DELETE':
                return deleteUser(profile.username, profile.id, event.headers.Authorization);
            default:
                let err = "error";
                return error(err);
        }
        
    } catch (err) { 
        return error(err);
    }
};

function error(err) {
        return {
            statusCode: 500,
            headers: {'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify(err),
        };
}

function ok(data) {
    return {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin': '*'},
        body: JSON.stringify(data),
    };
}

async function getAll(username, id) {
    
    const payload = JSON.stringify({
        "type": "getRegistrationsByUsername",
        "username": username
    });
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    let credentialsPayload = {};
    try {
        let response = await lambdaClient.send(new InvokeCommand(params));

        const payloadString = new TextDecoder().decode(response.Payload);
        credentialsPayload.fido = JSON.parse(JSON.parse(payloadString));
    } catch (err) {
        return error(err);
    }
    
    let recoveryCodes = await dbUtil.listRecoveryCodes(id);
    if (recoveryCodes.records && recoveryCodes.records.length > 0) {
        credentialsPayload.recoveryCodesViewed = true;
        if (recoveryCodes.records[0].code1Used && recoveryCodes.records[0].code2Used && recoveryCodes.records[0].code3Used && recoveryCodes.records[0].code4Used && recoveryCodes.records[0].code5Used) {
            credentialsPayload.allRecoveryCodesUsed = true;
        } else {
            credentialsPayload.allRecoveryCodesUsed = false;
        }
    } else {
        credentialsPayload.recoveryCodesViewed = false;
        credentialsPayload.allRecoveryCodesUsed = false;
    }
    
    
    return ok(credentialsPayload);
}

async function updateFIDO2CredentialNickname(username, body) {
    let data = JSON.parse(body);

    let invalidResult = validate({nickname: data.credentialNickname.value}, constraints);
    if(invalidResult && invalidResult.nickname) {
        return error(invalidResult.nickname.join(". "));
    }
    
    const payload = JSON.stringify({
        "type": "updateCredentialNickname",
        "username": username,
        "credentialId": data.credential.credentialId.base64url,
        "nickname": data.credentialNickname.value,
    });
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    try {
        let response = await lambdaClient.send(new InvokeCommand(params));

        let payload = JSON.parse(JSON.parse(new TextDecoder().decode(response.Payload)));

        
        return ok(payload);
    } catch (err) {
        return error(err);
    }
}

async function deleteFIDO2Credential(username, credentialId) {
    
    const payload = JSON.stringify({
        "type": "removeRegistrationByUsername",
        "username": username,
        "credentialId": credentialId,
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

        
        return ok(payload);
    } catch (err) {
        return error(err);
    }
}

async function startUsernamelessAuthentication() {
    const payload = JSON.stringify({
        "type": "startAuthentication",
        //"username": username
    });

    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };

    try {
        let response = await lambdaClient.send(new InvokeCommand(params));

        let startAuthPayload = JSON.parse(JSON.parse(new TextDecoder().decode(response.Payload)));

        startAuthPayload.requestId = startAuthPayload.requestId.base64url || startAuthPayload.requestId.base64;
        if (startAuthPayload.publicKeyCredentialRequestOptions.userVerification) {
            startAuthPayload.publicKeyCredentialRequestOptions.userVerification = startAuthPayload.publicKeyCredentialRequestOptions.userVerification.toLowerCase();
        }
        startAuthPayload.publicKeyCredentialRequestOptions.challenge = startAuthPayload.publicKeyCredentialRequestOptions.challenge.base64url || startAuthPayload.publicKeyCredentialRequestOptions.challenge.base64;
        if(startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials){
            startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials = startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials.map( (cred) => {
                cred.type = cred.type.toLowerCase().replace('_','-');
                cred.id = cred.id.base64url || cred.id.base64;
                return cred
            });
        }
        
        
        return ok(startAuthPayload);
    } catch (err) {
        return error(err);
    }
}

async function startRegisterFIDO2Credential(profile, body, uid) {
    const jsonBody = JSON.parse(body);

    let invalidResult = validate({nickname: jsonBody.nickname}, constraints);
    if(invalidResult && invalidResult.nickname) {
        return error(invalidResult.nickname.join(". "));
    }
    
    const payload = JSON.stringify({
        "type": "startRegistration",
        "username": profile.username,
        "displayName": profile.username,
        "credentialNickname": jsonBody.nickname || (jsonBody.requireAuthenticatorAttachment === "PLATFORM" ? "Trusted Device" : "Security Key"),
        "residentKey": jsonBody.residentKey || (jsonBody.requireResidentKey ? "required" : "preferred"),
        "requireAuthenticatorAttachment": jsonBody.requireAuthenticatorAttachment || null,
        "uid": uid
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
        startRegisterPayload.publicKeyCredentialCreationOptions.excludeCredentials = startRegisterPayload.publicKeyCredentialCreationOptions.excludeCredentials.map( (cred) => {
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.id = cred.id.base64url || cred.id.base64;
            return cred;
        });
        
        let pinCodeHash = await dbUtil.getServerVerifiedPin(profile.username);
        if(pinCodeHash) {
            startRegisterPayload.pinSet = true;
        } else {
            startRegisterPayload.pinSet = false;
        }
        
        
        return ok(startRegisterPayload);
    } catch (err) {
        return error(err);
    }
}

async function finishRegisterFIDO2Credential(userName, body) {
    const jsonBody = JSON.parse(body);

    //Verify pin if UV = false
    if(!getUV(jsonBody.credential.response.attestationObject)) {
        let pinCodeHash = await dbUtil.getServerVerifiedPin(userName);
        if(pinCodeHash) {
            // SV-PIN exists, we need to verify it
            // First check event.request.challengeAnswer.pinCode to see if it was already provided.
            var isPinVerified = false;
            
            // Check to see if client provided the pinCode along with assertionResponse
            let pinCodeAnswer = parseInt(jsonBody.pinCode) || defaultInvalidPIN;
            
            const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
            if(!pinResult){
                isPinVerified = await verifyServerPinCode(userName, pinCodeAnswer.toString());
            }
            
            if(!isPinVerified){ 
                let err = "Incorrect pin.";
                return error(err);
            }

            
        } else {
            let pinCodeAnswer = parseInt(jsonBody.pinCode) || defaultInvalidPIN;

            const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
            if(pinResult){
                let err = "Pin does not meet validation requirements. ";
                return error(err);
            }
            
            let userId = await dbUtil.getUserIdFromUserName(userName);
            let hash = await bcrypt.hash(pinCodeAnswer.toString(), saltRounds);
            let result = await dbUtil.insertPin(userId, hash);

        }
        
    }
    
    const payload = JSON.stringify({
        "type": "finishRegistration",
        "requestId": jsonBody.requestId,
        "credential": jsonBody.credential
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

        return ok(payload);
    } catch (err) {
        return error(err);
    }
}

function getUV(attestationObject) {
    let attestationBuffer = base64url.toBuffer(attestationObject);
    let attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
    let buffer = attestationStruct.authData;
    
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

async function verifyServerPinCode(userName, pinCodeAnswer){
    let pinCodeHash = await dbUtil.getServerVerifiedPin(userName);
    if(!pinCodeHash) { 
        return false 
    }
    return await bcrypt.compare(pinCodeAnswer, pinCodeHash );
}

// ### Beg Region Recovery Codes

// Not called by user API Gateway directly
// This is called when user is first created
async function createRecoveryCodes(id) {
    let codes = [];
    for(i=0; i<5; i++) {
        codes.push(randomValueBase64(10));
    }

    let hashedCodes = [];
    for(i=0; i<5; i++) {
        let hash = await bcrypt.hash(codes[i], saltRounds);
        hashedCodes.push(hash);
    }

    let createCodes = await dbUtil.createRecoveryCodes(id, hashedCodes[0], hashedCodes[1], hashedCodes[2], hashedCodes[3], hashedCodes[4]);
    
    return ok(codes);
}

// Called from /users/codes/ GET API call
async function listRecoveryCodes(id) {
    let recoveryCodes = await dbUtil.listRecoveryCodes(id);

    let count = 0;
    if (recoveryCodes.records && recoveryCodes.records.length > 0) {
        if(recoveryCodes.records[0].code1Used === false) {
            count++;
        }
        if(recoveryCodes.records[0].code2Used === false) {
            count++;
        }
        if(recoveryCodes.records[0].code3Used === false) {
            count++;
        }
        if(recoveryCodes.records[0].code4Used === false) {
            count++;
        }
        if(recoveryCodes.records[0].code5Used === false) {
            count++;
        }
    }
    
    
    // return number of codes left
    return ok(count);
}

// Called from /users/codes/ DELETE API call 
// This function deletes all the users recover codes from the database and recreates them.
// It then returns the newly generated codes from the listRecoveryCodes() functions
async function resetRecoveryCodes(id) {
    let deleteResults = await dbUtil.deleteRecoveryCodes(id);
    return await createRecoveryCodes(id);

}

function randomValueBase64(len) {
    return crypto
        .randomBytes(Math.ceil((len * 3) / 4))
        .toString('base64') // convert to base64 format
        .slice(0, len) // return required number of characters
        .replace(/\+/g, '0') // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
} 

// ### End Region Recovery Codes

async function updatePin(userId, body) {
    let data = JSON.parse(body);
    
    try {
        
        let pinCodeHash = await dbUtil.getPin(userId);
        if(pinCodeHash) {
            
            const pinResult = validate({pin: data.pin.toString(), confirmPin: data.confirmPin.toString()}, constraints);
            if(pinResult){
                const err = "Invalid PIN: " + pinResult.pin.join(". ");
                return error(err);
            }
       
            let newPinCodeHash = await bcrypt.hash(data.pin.toString(), saltRounds);
            return ok(await dbUtil.updatePin(userId, newPinCodeHash));

        } else {

            //SV-PIN does not exist, we need to set it
            const pinResult = validate({pin: data.pin.toString(), confirmPin: data.confirmPin.toString()}, constraints);
            if(pinResult){
                const err = "Invalid PIN: " + pinResult.pin.join(". ");
                return error(err);
            }
            
            let hash = await bcrypt.hash(data.pin.toString(), saltRounds);
            let result = await dbUtil.insertPin(userId, hash);

            return ok(result);

        }
        
    } catch(err) {
        return error(err);
    }

}

async function deleteUser(username, userId, token) {

    // 1. Remove all WebAuthn Registrations
    let allRegistrationsRemoved = false;
    
    const payload = JSON.stringify({
        "type": "removeAllRegistrations",
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

        let payload = JSON.parse(JSON.parse(payloadString));


        allRegistrationsRemoved = true;
    } catch (err) {
        console.error('Failed to remove FIDO2 registrations for user:', err);
        allRegistrationsRemoved = false;
    }

    // 2. Remove user's data from database
    let userDataRemoved = await dbUtil.deleteUser(userId);

    if (allRegistrationsRemoved && userDataRemoved) {
        let msg = "user successfully deleted";
        return ok(msg);
    } else {
        let msg = "error deleting user";
        return error(msg);
    }
}

