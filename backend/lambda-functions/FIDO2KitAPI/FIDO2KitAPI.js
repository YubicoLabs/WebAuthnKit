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
var AWS         = require('aws-sdk');
var bcrypt      = require('bcryptjs');
AWS.config.region = process.env.Region;
var lambda = new AWS.Lambda();
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

const authSelectorResolve = {
    "PLATFORM": "platform",
    "CROSS_PLATFORM": "cross-platform"
};


exports.handler = async (event, context) => {
    
    console.log('RECEIVED Event: ', JSON.stringify(event, null, 2));
    
    try {
        var sub = (event.requestContext.authorizer) ? event.requestContext.authorizer.claims.sub : undefined;
        console.log("sub: ",sub);
        let profile = undefined;
        if(sub) {
            profile = await dbUtil.getUserProfile(sub);
            console.log(profile);
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
    console.log(err);
        return {
            statusCode: 500,
            headers: {'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify(err),
        };
}

function ok(data) {
    console.log("Return data: ", data);
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
    console.log("getRegistrationsByUsername request payload: "+payload);
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    let credentialsPayload = {};
    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();

        credentialsPayload.fido = JSON.parse(JSON.parse(response.Payload));
        console.log("response payload: ", credentialsPayload);
    } catch (err) {
        console.log("error"+ err);
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
    console.log('recoveryCodes:', recoveryCodes);
    console.log('recoveryCodesViewed:', credentialsPayload.recoveryCodesViewed);
    console.log('allRecoveryCodesUsed:', credentialsPayload.allRecoveryCodesUsed);
    
    console.log("response payload: ", credentialsPayload);
    
    return ok(credentialsPayload);
}

async function updateFIDO2CredentialNickname(username, body) {
    let data = JSON.parse(body);
    console.log("updateFIDO2CredentialNickname data: ", data);

    let invalidResult = validate({nickname: data.credentialNickname.value}, constraints);
    console.log("invalidResult: ", invalidResult);
    if(invalidResult && invalidResult.nickname) {
        return error(invalidResult.nickname.join(". "));
    }
    
    const payload = JSON.stringify({
        "type": "updateCredentialNickname",
        "username": username,
        "credentialId": data.credential.credentialId.base64,
        "nickname": data.credentialNickname.value,
    });
    console.log("updateCredentialNickname request payload: "+payload);
    
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

        let payload = JSON.parse(JSON.parse(response.Payload));

        console.log("response payload: ", payload);
        
        return ok(payload);
    } catch (err) {
        console.log("error"+ err);
        return error(err);
    }
}

async function deleteFIDO2Credential(username, credentialId) {
    
    const payload = JSON.stringify({
        "type": "removeRegistrationByUsername",
        "username": username,
        "credentialId": credentialId,
    });
    console.log("removeRegistrationByUsername request payload: "+payload);
    
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
        
        return ok(payload);
    } catch (err) {
        //context.fail(err);
        console.log("error"+ err);
        return error(err);
    }
}

async function startUsernamelessAuthentication() {
    const payload = JSON.stringify({
        "type": "startAuthentication",
        //"username": username
    });
    console.log("getCredentialsOptions request payload: ", payload);

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
        console.log("response payload: " + response.Payload);
        console.log("response payload jsonparse: ", JSON.parse(response.Payload));

        let startAuthPayload = JSON.parse(JSON.parse(response.Payload));
        console.log("startAuthPayload: ", startAuthPayload);

        startAuthPayload.requestId = startAuthPayload.requestId.base64;
        console.log("requestId: ", startAuthPayload.requestId);
        startAuthPayload.publicKeyCredentialRequestOptions.userVerification = startAuthPayload.publicKeyCredentialRequestOptions.userVerification.toLowerCase();
        startAuthPayload.publicKeyCredentialRequestOptions.challenge = startAuthPayload.publicKeyCredentialRequestOptions.challenge.base64;
        console.log("challenge: ", startAuthPayload.publicKeyCredentialRequestOptions.challenge);
        if(startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials){
            startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials = startAuthPayload.publicKeyCredentialRequestOptions.allowCredentials.map( (cred) => { 
                cred.type = cred.type.toLowerCase().replace('_','-');
                cred.id = cred.id.base64;
                return cred
            });
        }
        
        console.log("response payload: ", startAuthPayload);
        
        return ok(startAuthPayload);
    } catch (err) {
        console.log("error: "+ err);
        return error(err);
    }
}

async function startRegisterFIDO2Credential(profile, body, uid) {
    console.log("startRegisterFIDO2Credential userId: "+profile.id+" body:",body);
    const jsonBody = JSON.parse(body);

    let invalidResult = validate({nickname: jsonBody.nickname}, constraints);
    console.log("nickname invalidResult: ", invalidResult);
    if(invalidResult && invalidResult.nickname) {
        return error(invalidResult.nickname.join(". "));
    }
    
    const payload = JSON.stringify({
        "type": "startRegistration",
        "username": profile.username,
        "displayName": profile.username,
        "credentialNickname": jsonBody.nickname,
        "requireResidentKey": jsonBody.requireResidentKey,
        "requireAuthenticatorAttachment": jsonBody.requireAuthenticatorAttachment,
        "uid": uid
    });
    console.log("startRegistration request payload: "+payload);
    
    var params = {
        FunctionName: process.env.WebAuthnLibFunction, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    
    try {
        console.log("invoking java-webauthn-server");
        let response = await lambda.invoke(params).promise();

        let startRegisterPayload = JSON.parse(JSON.parse(response.Payload));

        const coseLookup = {"ES256": -7, "EdDSA": -8, "RS256": -257};
        
        startRegisterPayload.requestId = startRegisterPayload.requestId.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.user.id = startRegisterPayload.publicKeyCredentialCreationOptions.user.id.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.challenge = startRegisterPayload.publicKeyCredentialCreationOptions.challenge.base64;
        startRegisterPayload.publicKeyCredentialCreationOptions.attestation = startRegisterPayload.publicKeyCredentialCreationOptions.attestation.toLowerCase();
        startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification = startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.userVerification.toLowerCase();
        startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.residentKey = startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.residentKey.toLowerCase();
        startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.requireResidentKey = false;
        if(startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.residentKey === "required") {
            startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.requireResidentKey = true;
        }
        startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.authenticatorAttachment = authSelectorResolve[startRegisterPayload.publicKeyCredentialCreationOptions.authenticatorSelection.authenticatorAttachment];
        startRegisterPayload.publicKeyCredentialCreationOptions.pubKeyCredParams = startRegisterPayload.publicKeyCredentialCreationOptions.pubKeyCredParams.map( (cred) => { 
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.alg = coseLookup[cred.alg];
            console.log("cred: "+ JSON.stringify(cred));
            return cred;
        });
        startRegisterPayload.publicKeyCredentialCreationOptions.excludeCredentials = startRegisterPayload.publicKeyCredentialCreationOptions.excludeCredentials.map( (cred) => { 
            cred.type = cred.type.toLowerCase().replace('_','-');
            cred.id = cred.id.base64;
            console.log("cred: "+ JSON.stringify(cred));
            return cred;
        });
        
        let pinCodeHash = await dbUtil.getServerVerifiedPin(profile.username);
        if(pinCodeHash) {
            startRegisterPayload.pinSet = true;
        } else {
            startRegisterPayload.pinSet = false;
        }
        
        console.log("response payload: ", startRegisterPayload);
        
        return ok(startRegisterPayload);
    } catch (err) {
        //context.fail(err);
        console.log("error"+ err);
        return error(err);
    }
}

async function finishRegisterFIDO2Credential(userName, body) {
    console.log("finishRegisterFIDO2Credential userName: "+userName+" body:",body);
    const jsonBody = JSON.parse(body);

    //Verify pin if UV = false
    if(!getUV(jsonBody.credential.response.attestationObject)) {
        console.log("uv=false");
        let pinCodeHash = await dbUtil.getServerVerifiedPin(userName);
        if(pinCodeHash) {
            // SV-PIN exists, we need to verify it
            // First check event.request.challengeAnswer.pinCode to see if it was already provided.
            var isPinVerified = false;
            
            // Check to see if client provided the pinCode along with assertionResponse
            let pinCodeAnswer = parseInt(jsonBody.pinCode) || defaultInvalidPIN;
            
            const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
            console.log("pinResult: ", pinResult);
            if(!pinResult){
                console.log("verifying pin code");
                isPinVerified = await verifyServerPinCode(userName, pinCodeAnswer.toString());
            }
            console.log("isPinVerified: ", isPinVerified);
            
            if(!isPinVerified){ 
                let err = "Incorrect pin.";
                console.log("error"+ err);
                return error(err);
            }

            console.log("pin is valid");
            
        } else {
            let pinCodeAnswer = parseInt(jsonBody.pinCode) || defaultInvalidPIN;

            const pinResult = validate({pin: pinCodeAnswer.toString()}, constraints);
            console.log("pinResult: ", pinResult);
            if(pinResult){
                let err = "Pin does not meet validation requirements. ";
                console.log("Invalid PIN: ", pinResult.pin.join(". "));
                return error(err);
            }
            
            let userId = await dbUtil.getUserIdFromUserName(userName);
            let hash = await bcrypt.hash(pinCodeAnswer.toString(), saltRounds);
            let result = await dbUtil.insertPin(userId, hash);
            console.log("insert pin result: ", result);

        }
        
    }
    
    const payload = JSON.stringify({
        "type": "finishRegistration",
        "requestId": jsonBody.requestId,
        "credential": jsonBody.credential
    });
    console.log("finishRegistration request payload: "+payload);
    
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

         // exceptions will have a message property
        if(payload.message !== undefined) {
            console.log("error: "+ payload.message);
            return error(new Error(payload.message));
        }
        
        return ok(payload);
    } catch (err) {
        console.log("error"+ err);
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
    console.log("codes: ", codes);

    let hashedCodes = [];
    for(i=0; i<5; i++) {
        let hash = await bcrypt.hash(codes[i], saltRounds);
        hashedCodes.push(hash);
    }
    console.log("hasedCodes: ", hashedCodes);

    let createCodes = await dbUtil.createRecoveryCodes(id, hashedCodes[0], hashedCodes[1], hashedCodes[2], hashedCodes[3], hashedCodes[4]);
    console.log("createRecoveryCodes: ", createCodes);
    
    return ok(codes);
}

// Called from /users/codes/ GET API call
async function listRecoveryCodes(id) {
    console.log("listRecoveryCodes userId: "+id);
    let recoveryCodes = await dbUtil.listRecoveryCodes(id);
    console.log("listRecoveryCodes: ", recoveryCodes);

    let count = 0;
    if (recoveryCodes.records && recoveryCodes.records.length > 0) {
        if(recoveryCodes.records[0].code1Used == false) {
            count++;
        }
        if(recoveryCodes.records[0].code2Used == false) {
            count++;
        }
        if(recoveryCodes.records[0].code3Used == false) {
            count++;
        }
        if(recoveryCodes.records[0].code4Used == false) {
            count++;
        }
        if(recoveryCodes.records[0].code5Used == false) {
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
    console.log("resetRecoveryCodes userId: "+id);
    let deleteResults = await dbUtil.deleteRecoveryCodes(id);
    console.log("resetRecoveryCodes (delete): ", deleteResults);
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
    console.log("updatePin data");
    
    try {
        
        let pinCodeHash = await dbUtil.getPin(userId);
        if(pinCodeHash) {
            
            const pinResult = validate({pin: data.pin.toString(), confirmPin: data.confirmPin.toString()}, constraints);
            console.log("pinResult: ", pinResult);
            if(pinResult){
                const err = "Invalid PIN: " + pinResult.pin.join(". ");
                console.log(err);
                return error(err);
            }
       
            console.log("updating pin code");
            let newPinCodeHash = await bcrypt.hash(data.pin.toString(), saltRounds);
            return ok(await dbUtil.updatePin(userId, newPinCodeHash));

        } else {

            //SV-PIN does not exist, we need to set it
            const pinResult = validate({pin: data.pin.toString(), confirmPin: data.confirmPin.toString()}, constraints);
            console.log("pinResult: ", pinResult);
            if(pinResult){
                const err = "Invalid PIN: " + pinResult.pin.join(". ");
                console.log(err);
                return error(err);
            }
            
            let hash = await bcrypt.hash(data.pin.toString(), saltRounds);
            let result = await dbUtil.insertPin(userId, hash);
            console.log("insert pin result: ", result);

            return ok(result);

        }
        
    } catch(err) {
        console.log("updatePin error: ", err);
        return error(err);
    }

}

async function deleteUser(username, userId, token) {
    console.log("deleteUser: ", username);

    // 1. Remove all WebAuthn Registrations
    let allRegistrationsRemoved = false;
    
    const payload = JSON.stringify({
        "type": "removeAllRegistrations",
        "username": username
    });
    console.log("removeAllRegistrations request payload: "+payload);
    
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
        
        allRegistrationsRemoved = true;
    } catch (err) {
        console.log("error"+ err);
    }

    // 2. Remove user's data from database
    console.log("Calling delete user"); 
    let userDataRemoved = await dbUtil.deleteUser(userId);

    if (allRegistrationsRemoved && userDataRemoved) {
        let msg = "user successfully deleted";
        console.log(msg);
        return ok(msg);
    } else {
        let msg = "error deleting user";
        console.log(msg);
        return error(msg);
    }
}

