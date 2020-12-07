// ### Last Updated ##
// Nov 11, 2020
// Updated networkPin to serverVerifiedPin

'use strict';

const bcrypt = require('bcryptjs');

const saltRounds = 5;
const windowPeriod = 20*60000; // 20 minutes in milliseconds
const maxAttempts = 8;

module.exports = { saveCredentials, getUserIdFromUserName, updateCredentials, getUserChallenge, updateUser, insertPin, validateRecoveryCode, verifyServerPinCode };

// Using npmjs.com/package/data-api-client package for accessing an Aurora Serverless Database with Data API enabled
const dbConfig = require('data-api-client')({
    secretArn: process.env.DBSecretsStoreArn,
    resourceArn: process.env.DBAuroraClusterArn,
    database: process.env.DatabaseName
});

// Get database user 'id' from username
async function getUserIdFromUserName(userName) {
     // Get id from [user] table based on userName
    let userId = await dbConfig.query('SELECT id FROM user WHERE userName = :userName', { userName: userName });
    return userId.records[0].id;
}

// Update the [credential] table with the new credential
async function saveCredentials(webAuthnResponse, credPublicKeyPWK, userName, signatureCounter){
    
    console.log('Entered saveCredentials. Inserting new credentialId: ' + webAuthnResponse.id  + ' for username: ' + userName);
    
    // Get id from [user] table based on userName
    let userId = await getUserIdFromUserName(userName);

    // Insert new credential into [credential] table
    let insert = await dbConfig.query('INSERT IGNORE INTO credential (user_id, publicKey, credentialId, attestation, signatureCount) VALUES(:user_id, :publicKey, :credentialId, :attestation, :counter)',
        { user_id: userId, publicKey: credPublicKeyPWK, credentialId: webAuthnResponse.id, attestation: webAuthnResponse.response.attestationObject, counter: signatureCounter }
    );
    
    console.log('Inserted new credential id: [' + insert.insertId + '] for user [' + userName  + '] id: [' + userId + ']');
    
    return true;
}

// Update signatureCount, lastUsedDate for currently authenticated credential
async function updateCredentials(credentialId, signatureCounter){
    console.log('Entered updateCredentials. Updating credentialId: ' + credentialId);
    let currentUTC = getCurrentTimeStampUTC();
    await dbConfig.query('UPDATE credential SET signatureCount = :signatureCount, lastUsedDate = :currentUTC WHERE credentialId = :credentialId', { credentialId: credentialId, signatureCount: signatureCounter, currentUTC: currentUTC  });
}

// Get current user 'challenge' from [user] table in database 
async function getUserChallenge(userName) {
    let storedChallenge = await dbConfig.query('SELECT challenge FROM user WHERE userName = :userName', { userName: userName });
    return storedChallenge.records[0].challenge;
}

// Update user table with last successful login timestamp
async function updateUser(userName) {
    let userId = await getUserIdFromUserName(userName);
    let currentUTC = getCurrentTimeStampUTC();
    return await dbConfig.query('UPDATE user SET lastLoginDate = :lastSuccessfulLoginDate WHERE id = :userId', { userId: userId, lastSuccessfulLoginDate: currentUTC  });
}

// Setting the UTC format to match MySQL TIMESTAMP format of YYYY-MM-DD HH:MM:SS
// Expecting js toISOString of YYYY-MM-DDTHH:MM:SS.MMMZ
function getCurrentTimeStampUTC() {
    let currentUTC = new Date().toISOString().replace('T', ' ',).replace('Z', '');
    return currentUTC.substring(0, currentUTC.length-4);
}

async function insertPin(userName, pinCode) {
    let userId = await getUserIdFromUserName(userName);
    let hash = await bcrypt.hash(pinCode, saltRounds);
    return await dbConfig.query('INSERT IGNORE INTO serverVerifiedPin (user_id, pinCode) VALUES(:userId, :newPinCode)', { userId: userId, newPinCode: hash });
}

async function verifyServerPinCode(userName, pinCodeAnswer){
    let userId = await getUserIdFromUserName(userName);
    let result = false;

    if(await maxPinAttemptsReached(userId)){
        console.log("PIN attempts maxed out...");
        return false;  // Consider throwing an error and informing the user to try again after windowPeriod minutes
    }

    let pinCode = await dbConfig.query('SELECT pinCode FROM serverVerifiedPin WHERE user_id = :userId', { userId: userId });
    if (pinCode.records && pinCode.records.length > 0) {
        console.log('verifyServerPinCode: pinCode results:' + pinCode.records[0].pinCode);
        return await bcrypt.compare(pinCodeAnswer, pinCode.records[0].pinCode );
    }else{
       return false;
    }
}

async function maxPinAttemptsReached(userId) {
    let maxedOut = true;
    let codes = await dbConfig.query('SELECT * FROM serverVerifiedPin WHERE user_id = :userId', { userId: userId});
    if (codes.records && codes.records.length > 0) {
        const resetTime = codes.records[0].counterResetTime;
        if(resetTime) {
            const counter = codes.records[0].counter - 1;
            const delta = Date.now() - resetTime;
            console.log("pin code reset time: ", resetTime);
            console.log("pin code counter: ", counter);
            console.log("pin code delta: ", delta);
            if ( delta <= windowPeriod ) {
                if ( counter > 0 ) {
                    console.log("decrementing counter ");
                    await dbConfig.query('UPDATE serverVerifiedPin SET counter = :counter WHERE user_id = :userId', { counter: counter, userId: userId});
                    maxedOut = false;
                } else {
                    console.log("Now: ", new Date(Date.now()).toLocaleTimeString());
                    console.log("Maxed out until ", new Date(resetTime + windowPeriod).toLocaleTimeString());
                    maxedOut = true;
                }
            } else {
                // we are in a new period, reset the counter
                let resetTime = Date.now();
                console.log("Reset the pin code counter and reset time to: ", resetTime);
                await dbConfig.query('UPDATE serverVerifiedPin SET counter = :counter, counterResetTime = :counterResetTime WHERE user_id = :userId', { counter: maxAttempts, counterResetTime: resetTime, userId: userId});
                maxedOut = false;
            }
        } else {
            // first recovery code attempt
            let resetTime = Date.now();
            console.log("Set the pin code counter and reset time to: ", resetTime);
            await dbConfig.query('UPDATE serverVerifiedPin SET counter = :counter, counterResetTime = :counterResetTime WHERE user_id = :userId', { counter: maxAttempts, counterResetTime: resetTime, userId: userId});
            maxedOut = false;
        }
    }
    console.log("pin code maxed out? ", maxedOut);
    return maxedOut;
}

async function validateRecoveryCode(userName, code) {
    let userId = await getUserIdFromUserName(userName);
    let result = false;

    if(await maxCodeAttemptsReached(userId)){
        console.log("Recovery Codes Maxed Out...");
        return false;  // Consider throwing an error and informing the user to try again after windowPeriod minutes
    }

    let codes = await dbConfig.query('SELECT * FROM recoveryCodes WHERE user_id = :userId', { userId: userId});
    if (codes.records && codes.records.length > 0) {
        if ( (codes.records[0].code1Used === false) && await bcrypt.compare(code, codes.records[0].code1 )) {
            await dbConfig.query('UPDATE recoveryCodes SET code1Used = true WHERE user_id = :userId', { userId: userId});
            return true;
        }
        if ( (codes.records[0].code2Used === false) && await bcrypt.compare(code, codes.records[0].code2 )) {
            await dbConfig.query('UPDATE recoveryCodes SET code2Used = true WHERE user_id = :userId', { userId: userId});
            return true;
        }
        if ( (codes.records[0].code3Used === false) && await bcrypt.compare(code, codes.records[0].code3 )) {
            await dbConfig.query('UPDATE recoveryCodes SET code3Used = true WHERE user_id = :userId', { userId: userId});
            return true;
        }
        if ( (codes.records[0].code4Used === false) && await bcrypt.compare(code, codes.records[0].code4 )) {
            await dbConfig.query('UPDATE recoveryCodes SET code4Used = true WHERE user_id = :userId', { userId: userId});
            return true;
        }
        if ( (codes.records[0].code5Used === false) && await bcrypt.compare(code, codes.records[0].code5 )) {
            await dbConfig.query('UPDATE recoveryCodes SET code5Used = true WHERE user_id = :userId', { userId: userId});
            return true;
        }
    }

    return result;
}

async function maxCodeAttemptsReached(userId) {
    let maxedOut = true;
    let codes = await dbConfig.query('SELECT * FROM recoveryCodes WHERE user_id = :userId', { userId: userId});
    if (codes.records && codes.records.length > 0) {
        const resetTime = codes.records[0].counterResetTime;
        if(resetTime) {
            const counter = codes.records[0].counter - 1;
            const delta = Date.now() - resetTime;
            console.log("recovery code reset time: ", resetTime);
            console.log("recovery code counter: ", counter);
            console.log("recovery code delta: ", delta);
            if ( delta <= windowPeriod ) {
                if ( counter > 0 ) {
                    console.log("decrementing counter ");
                    await dbConfig.query('UPDATE recoveryCodes SET counter = :counter WHERE user_id = :userId', { counter: counter, userId: userId});
                    maxedOut = false;
                } else {
                    console.log("Now: ", new Date(Date.now()).toLocaleTimeString());
                    console.log("Maxed out until ", new Date(resetTime + windowPeriod).toLocaleTimeString());
                    maxedOut = true;
                }
            } else {
                // we are in a new period, reset the counter
                let resetTime = Date.now();
                console.log("Reset the recovery code counter and reset time to: ", resetTime);
                await dbConfig.query('UPDATE recoveryCodes SET counter = :counter, counterResetTime = :counterResetTime WHERE user_id = :userId', { counter: maxAttempts, counterResetTime: resetTime, userId: userId});
                maxedOut = false;
            }
        } else {
            // first recovery code attempt
            let resetTime = Date.now();
            console.log("Set the recovery code counter and reset time to: ", resetTime);
            await dbConfig.query('UPDATE recoveryCodes SET counter = :counter, counterResetTime = :counterResetTime WHERE user_id = :userId', { counter: maxAttempts, counterResetTime: resetTime, userId: userId});
            maxedOut = false;
        }
    }
    console.log("recovery code maxed out? ", maxedOut);
    return maxedOut;
}
