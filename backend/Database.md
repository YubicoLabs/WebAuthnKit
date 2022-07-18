### SQL table create statements

### The WebAuthn Starter Kit creates six tables in the Amazon Aurora (MySQL-compatible) Serverless Database. These tables are created as part of the backend deployment.

`drop table IF EXISTS serverVerifiedPin, recoveryCodes, registrationRequests, assertionRequests, credentialRegistrations, user;`

```
CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT,
    cognito_id NVARCHAR(50) NOT NULL UNIQUE,
    userName NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(50),
    phoneNumber NVARCHAR(25),
    displayName NVARCHAR(25),
    registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLoginDate DATETIME,
    challenge TEXT,
    PRIMARY KEY (id)
);
```

```
CREATE TABLE serverVerifiedPin (
    pinId INT NOT NULL AUTO_INCREMENT,
    pinCode TEXT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    counter INT,
    counterResetTime BIGINT,
    PRIMARY KEY (pinId),
    FOREIGN KEY (user_id)
        REFERENCES user(id)
        ON DELETE CASCADE
);
```

```
CREATE TABLE assertionRequests (
    _key TEXT,
    _value TEXT,
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

```
CREATE TABLE registrationRequests (
    _key TEXT,
    _value TEXT,
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

```
CREATE TABLE credentialRegistrations (
    username TEXT,
    userHandle TEXT,
    credentialId NVARCHAR(1023),
    registration TEXT,
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastUsedDate DATETIME,
    lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active BOOL DEFAULT TRUE
);
```

### One-Time Use Codes for Account Recovery:

```
CREATE TABLE recoveryCodes (
    code1 TEXT NOT NULL,
    code1Used BOOL DEFAULT FALSE,
    code2 TEXT NOT NULL,
    code2Used BOOL DEFAULT FALSE,
    code3 TEXT NOT NULL,
    code3Used BOOL DEFAULT FALSE,
    code4 TEXT NOT NULL,
    code4Used BOOL DEFAULT FALSE,
    code5 TEXT NOT NULL,
    code5Used BOOL DEFAULT FALSE,
    viewed BOOL DEFAULT FALSE,
    user_id INT NOT NULL UNIQUE,
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    counter INT,
    counterResetTime BIGINT,
    FOREIGN KEY (user_id)
        REFERENCES user(id)
        ON DELETE CASCADE
);
```
