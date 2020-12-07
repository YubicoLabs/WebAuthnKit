// Using npmjs.com/package/data-api-client package for accessing an Aurora Serverless Database with Data API enabled
const dbConfig = require('data-api-client')({
    secretArn: process.env.DBSecretsStoreArn,
    resourceArn: process.env.DBAuroraClusterArn,
    database: process.env.DatabaseName
});

exports.handler = async (event) => { 
    
    console.log('RECEIVED event: ', JSON.stringify(event, null, 2));
    const response = {
        statusCode: 200,
        body: JSON.stringify('Successfully created database resources'),
    };
    
    var userTableSql = 'CREATE TABLE user (id INT NOT NULL AUTO_INCREMENT, cognito_id NVARCHAR(50) NOT NULL UNIQUE, userName NVARCHAR(50) NOT NULL UNIQUE, email NVARCHAR(50), phoneNumber NVARCHAR(25), displayName NVARCHAR(25), registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP, lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, lastLoginDate DATETIME, challenge TEXT, PRIMARY KEY (id));';
    var registrationRequestsTableSql = 'CREATE TABLE registrationRequests (_key TEXT, _value TEXT, creationDate DATETIME DEFAULT CURRENT_TIMESTAMP, lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);';
    var credentialRegistrationsTableSql = 'CREATE TABLE credentialRegistrations (username TEXT, userHandle TEXT, credentialId TEXT, registration TEXT, creationDate DATETIME DEFAULT CURRENT_TIMESTAMP, lastUsedDate DATETIME, lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, active BOOL DEFAULT TRUE);';
    var assertionRequestsTableSql = 'CREATE TABLE assertionRequests (_key TEXT, _value TEXT, creationDate DATETIME DEFAULT CURRENT_TIMESTAMP, lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);';
    var serverVerifiedPinTableSql = 'CREATE TABLE serverVerifiedPin (pinId INT NOT NULL AUTO_INCREMENT, pinCode TEXT NOT NULL, user_id INT NOT NULL UNIQUE, creationDate DATETIME DEFAULT CURRENT_TIMESTAMP, lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, counter INT, counterResetTime BIGINT, PRIMARY KEY (pinId));';
    // Add foreign key and CASCADE DELETE to the serverVerifiedPin table
    var addServerVerifiedPinFK = 'ALTER TABLE serverVerifiedPin ADD FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;';
    var recoveryCodesTableSql = 'CREATE TABLE recoveryCodes (code1 TEXT NOT NULL, code1Used BOOL DEFAULT FALSE, code2 TEXT NOT NULL, code2Used BOOL DEFAULT FALSE, code3 TEXT NOT NULL, code3Used BOOL DEFAULT FALSE, code4 TEXT NOT NULL, code4Used BOOL DEFAULT FALSE, code5 TEXT NOT NULL, code5Used BOOL DEFAULT FALSE, viewed BOOL DEFAULT FALSE, user_id INT NOT NULL UNIQUE, creationDate DATETIME DEFAULT CURRENT_TIMESTAMP, lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, counter INT, counterResetTime BIGINT);';
    // Add foreign key and CASCADE DELETE to the recoveryCodes table
    var addRecoveryCodesFK = 'ALTER TABLE recoveryCodes ADD FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;';
    var showTablesSql = 'show tables;';
    
    if(await createTables(userTableSql)){
        console.log('Created [user] table successfully');
        if(await createTables(registrationRequestsTableSql)){
            console.log('Created [registrationRequests] table successfully');
            if(await createTables(credentialRegistrationsTableSql)){
                console.log('Created [credentialRegistrations] table successfully');
                if(await createTables(assertionRequestsTableSql)){
                    console.log('Created [assertionRequests] table successfully');
                    if(await createTables(serverVerifiedPinTableSql)){
                        console.log('Created [serverVerifiedPin] table successfully');
                        if(await createTables(addServerVerifiedPinFK)){
                            console.log('Added foreign key to serverVerifiedPin table successfully');
                            if(await createTables(recoveryCodesTableSql)){
                                console.log('Created [recoveryCodes] table successfully');
                                if(await createTables(addRecoveryCodesFK)){
                                    console.log('Added foreign key to recoveryCodes table successfully');
                                        if(await createTables(showTablesSql)){
                                            console.log('Completed database schema creation');
                                            return response;
                                        } else {console.log('Failed to execute show tables');}
                                } else {console.log('Failed to create FK on recoveryCodes table');}
                            } else {console.log('Failed to create recoveryCodes table');}
                        } else {console.log('Failed to execute serverVerifiedPin FK');}
                    } else {console.log('Failed to create [serverVerifiedPin] table');}
                } else {console.log('Failed to create [assertionRequests] table');}
            } else {console.log('Failed to create [credentialRegistrations] table');}
        } else {console.log('Failed to create [registrationRequests] table');}
    } else {console.log('Failed to create [user] table');}
    
    response = {
        statusCode: 500,
        body: JSON.stringify('Failed to create database resources'),
    };
    
    return response;
};

// Create database assets
async function createTables(sqlStatement) {
    console.log('Creating db asset: ' + sqlStatement);
   let result = await dbConfig.query(sqlStatement);
   console.log('Sql results: ' + result);
   return true;
}