// Updated: Nov 11, 2020

'use strict';

module.exports = { getUserIdFromUserName, getUserProfile, getUserCredentials, updateFIDO2CredentialNickname, deleteFIDO2Credential, getPin, createRecoveryCodes, listRecoveryCodes, disableRecoveryCode, deleteRecoveryCodes, updatePin, getServerVerifiedPin, insertPin, deleteUser };

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

// Get current user profile details from [user] table in database 
async function getUserProfile(userId) {
    let userProfile = await dbConfig.query('SELECT id, username, lastLoginDate, challenge FROM user WHERE cognito_id = :userId', { userId: userId });
    let id = userProfile.records[0].id;
    let un = userProfile.records[0].username;
    let logdate = userProfile.records[0].lastLoginDate;
    let challenge = userProfile.records[0].challenge;
    return { "id": id, "username": un,  "lastLoginDate": logdate, "challenge": challenge};
}

// Get user credentials 
async function getUserCredentials(userId) {
    return await dbConfig.query('SELECT nickname, credentialId FROM credential WHERE user_id = :userId', { userId: userId });
}

async function updateFIDO2CredentialNickname(userId, credentialId, nickname) {
    return await dbConfig.query('UPDATE credential SET nickName =:nickname WHERE credentialId = :credentialId AND user_id = :userId', { credentialId: credentialId, nickname: nickname, userId: userId });
}

async function deleteFIDO2Credential(userId, credentialId) {
    return await dbConfig.query('DELETE FROM credential WHERE credentialId = :credentialId AND user_id = :userId', { credentialId: credentialId, userId: userId });
}

// Setting the UTC format to match MySQL TIMESTAMP format of YYYY-MM-DD HH:MM:SS
// Expecting js toISOString of YYYY-MM-DDTHH:MM:SS.MMMZ
function getCurrentTimeStampUTC() {
    let currentUTC = new Date().toISOString().replace('T', ' ',).replace('Z', '');
    return currentUTC.substring(0, currentUTC.length-4);
}

// # Beg Recovery Codes Region

// Create user recovery codes
async function createRecoveryCodes(userId, code1, code2, code3, code4, code5) {
    return await dbConfig.query('INSERT INTO recoveryCodes (user_id, code1, code2, code3, code4, code5) value(:userId, :code1, :code2, :code3, :code4, :code5)', { userId: userId, code1: code1, code2: code2, code3: code3, code4: code4, code5: code5 });
}

// List all recovery codes for a given user
async function listRecoveryCodes(userId) {
    //return await dbConfig.query('SELECT (SELECT IFNULL( (SELECT code1 FROM recoveryCodes WHERE user_id = :userId AND code1Used is false LIMIT 1),"USED")) as "1",(SELECT IFNULL( (SELECT code2 FROM recoveryCodes WHERE user_id = :userId AND code2Used is false LIMIT 1),"USED")) as "2",(SELECT IFNULL( (SELECT code3 FROM recoveryCodes WHERE user_id = :userId AND code3Used is false LIMIT 1),"USED")) as "3",(SELECT IFNULL( (SELECT code4 FROM recoveryCodes WHERE user_id = :userId AND code4Used is false LIMIT 1),"USED")) as "4",(SELECT IFNULL( (SELECT code5 FROM recoveryCodes WHERE user_id = :userId AND code5Used is false LIMIT 1),"USED")) as "5"', { userId: userId });
    return await dbConfig.query('SELECT * FROM recoveryCodes WHERE user_id = :userId', { userId: userId });
}

// Disable a single recovery code in the database so it can't be reused 
async function disableRecoveryCode(userId, data) {
    return await dbConfig.query('SELECT code1, code2, code3, code4, code5 from recoveryCodes WHERE user_id = :userId & WHERE code1Used, code2Used, code3Used, code4Used, code5sed not in (true)', { userId: userId });
}

// Delete all existing recovery codes for a given user
// To reset all recover codes for a give user, call delteRecoveryCodes(userId) then createRecoveryCodes(userId) to regenerate all new codes for a given user
async function deleteRecoveryCodes(userId) {
    return await dbConfig.query('DELETE FROM recoveryCodes where user_id = :userId', { userId: userId });
}

// # End Recovery Codes Region

async function updatePin(userId, pin) {
    return await dbConfig.query('UPDATE serverVerifiedPin SET pinCode =:pin WHERE user_id = :userId', { pin: pin, userId: userId });
}

async function insertPin(userId, pin) {
    return await dbConfig.query('INSERT INTO serverVerifiedPin (pinCode, user_id) VALUES (:pin, :userId)', { pin: pin, userId: userId });
}

async function getPin(userId) {
    let pinCode = await dbConfig.query('SELECT pinCode FROM serverVerifiedPin WHERE user_id = :userId', { userId: userId });
    
    // Verify result is an array and has length, else return 0
    if (pinCode.records && pinCode.records.length > 0) {
        console.log('getServerVerifiedPin: pinCode results:' + pinCode.records[0].pinCode);
        return pinCode.records[0].pinCode;
    }else{
       return undefined;
    }
}

// Get current server verified pin from [serverVerifiedPin] table for given user
async function getServerVerifiedPin(userName) {
    // Get id from [user] table based on userName
    let userId = await this.getUserIdFromUserName(userName);
    return await getPin(userId);
}

async function deleteUser(userId) {
    console.log("deleteUser: ", userId);
    let result = await dbConfig.query('DELETE FROM user WHERE id = :userId', { userId: userId });
    console.log("deleteUser result: ", result);
    if (result.numberOfRecordsUpdated === 1) {
        console.log("deleteUser = true");
        return true;
    }else{
        console.log("deleteUser = false");
        return false;
    }
}
