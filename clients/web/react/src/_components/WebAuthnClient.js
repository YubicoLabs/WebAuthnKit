import { get, supported } from '@github/webauthn-json';
import base64url from 'base64url';
import { Auth } from 'aws-amplify';
import axios from 'axios';

import aws_exports from '../aws-exports';

axios.defaults.baseURL = aws_exports.apiEndpoint;

export const WebAuthnClient = {
    getAuthChallegeResponse,
    getPublicKeyRequestOptions,
    getUsernamelessAuthChallegeResponse,
    getUVFromAssertion,
    sendChallengeAnswer,
    signIn,
    signUp
};

const defaultInvalidPIN = -1;
const webAuthnClientExceptionName = 'WebAuthnClientException';
const ERROR_CODE = "ERROR_CODE";
const INVALID_CHALLENGE_TYPE = "INVALID_CHALLENGE_TYPE";

function WebAuthnClientException(message, code = ERROR_CODE) {
    const error = new Error(message);
    error.code = code;
    error.name = webAuthnClientExceptionName;
    return error;
}

async function getPublicKeyRequestOptions() {
    try {
        const response = await axios.get('/users/credentials/fido2/authenticate');
        console.log("WebAuthnClient getPublicKeyRequestOptions() response: ", response);
        return response.data;
    } catch (error) {
        console.error("WebAuthnClient getPublicKeyRequestOptions() error: ", error);
        throw error;
    }
}

async function getUsernamelessAuthChallegeResponse() {
    try {
        const requestOptions = getPublicKeyRequestOptions();

        const publicKey = { "publicKey": requestOptions.publicKeyCredentialRequestOptions };
        console.log("WebAuthnClient getUsernamelessAuthChallegeResponse() publicKey: ", publicKey);

        let assertionResponse = await get(publicKey);
        console.log("WebAuthnClient getUsernamelessAuthChallegeResponse() assertionResponse: ", assertionResponse);

        const userhandle = assertionResponse.response.userHandle;   //Sign in to Amazon Cognito with userhandle as the `username`
        console.log("WebAuthnClient getUsernamelessAuthChallegeResponse() userhandle: ", userhandle);

        let challengeResponse = {
            credential: assertionResponse,
            requestId: requestOptions.requestId,
            pinCode: defaultInvalidPIN
        };
        console.log("WebAuthnClient getUsernamelessAuthChallegeResponse() challengeResponse: ", challengeResponse);

        return (challengeResponse, userhandle);

    } catch (error) {
        console.error("WebAuthnClient getUsernamelessAuthChallegeResponse() error: ", error);
        throw error;
    }
}

async function getAuthChallegeResponse(cognitoChallenge) {
    try {
        console.log("WebAuthnClient getAuthChallegeResponse() cognitoChallenge response: " + JSON.stringify(cognitoChallenge, null, 2));

        const request = JSON.parse(cognitoChallenge.publicKeyCredentialRequestOptions);
        console.log("WebAuthnClient getAuthChallegeResponse() request: ", request);

        const publicKey = { "publicKey": request.publicKeyCredentialRequestOptions };
        console.log("WebAuthnClient getAuthChallegeResponse() publicKey: ", publicKey);

        let assertionResponse = await get(publicKey);
        console.log("WebAuthnClient getAuthChallegeResponse() assertion response: " + JSON.stringify(assertionResponse));

        let challengeResponse = {
            credential: assertionResponse,
            requestId: request.requestId,
            pinCode: defaultInvalidPIN
        };
        console.log("WebAuthnClient getAuthChallegeResponse() challengeResponse: ", challengeResponse);

        return challengeResponse;

    } catch (error) {
        console.error("WebAuthnClient getAuthChallegeResponse() error: ", error);
        throw error;
    }
}

async function getCreateCredentialChallegeResponse(cognitoChallenge) {
    try {
        console.log("WebAuthnClient getCreateCredentialChallegeResponse() cognitoChallenge response: " + JSON.stringify(cognitoChallenge, null, 2));

        const request = JSON.parse(cognitoChallenge.publicKeyCredentialCreationOptions);
        console.log("WebAuthnClient getCreateCredentialChallegeResponse() request: ", request);

        const publicKey = { "publicKey": request.publicKeyCredentialCreationOptions };
        console.log("WebAuthnClient getCreateCredentialChallegeResponse() publicKey: ", publicKey);

        let attestationResponse = await create(publicKey);
        console.log("WebAuthnClient getCreateCredentialChallegeResponse() attestationResponse: " + JSON.stringify(attestationResponse));

        let challengeResponse = {
            credential: attestationResponse,
            requestId: request.requestId,
            pinCode: defaultInvalidPIN
        };
        console.log("WebAuthnClient getCreateCredentialChallegeResponse() challengeResponse: ", challengeResponse);

        return challengeResponse;

    } catch (error) {
        console.error("WebAuthnClient getCreateCredentialChallegeResponse() error: ", error);
        throw error;
    }
}

function getUVFromAssertion(authenticatorData) {
    let buffer = base64url.toBuffer(authenticatorData);

    return getUV(buffer);
}

function getUVFromAttestation(attestationObject) {
    let attestationBuffer = base64url.toBuffer(attestationObject);
    let attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
    let buffer = attestationStruct.authData;
    
    return getUV(buffer);
}

function getUV(buffer){
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

async function signIn(name, options, requestUV) {
    console.log("WebAuthnClient signIn() name=", name);

    try {

        let username = undefined;
        let challengeResponse = undefined;

        if (name === undefined) {
            console.log("WebAuthnClient signIn() usernameless flow");
            challengeResponse, username = await getUsernamelessAuthChallegeResponse();
        } else {
            console.log("WebAuthnClient signIn() username flow");
            username = name.toLocaleLowerCase();
            localStorage.setItem('username', username);
        }

        let cognitoUser = await Auth.signIn(username);
        console.log("WebAuthnClient signIn() CognitoUser: ", cognitoUser);

        if (cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.create') {

            throw new WebAuthnClientException("User not found. Please Sign Up.", INVALID_CHALLENGE_TYPE);

        } else if (cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.get') {

            if (challengeResponse === undefined) {
                console.log("WebAuthnClient signIn() get challenge response for username flow");
                challengeResponse = await getAuthChallegeResponse(cognitoUser.challengeParam);
            }
            console.log("WebAuthnClient signIn() challengeResponse: ", challengeResponse);

            let isUserVerified = getUVFromAssertion(challengeResponse.credential.response.authenticatorData);
            console.log("WebAuthnClient signIn() isUserVerified: ", isUserVerified);

            let pin = defaultInvalidPIN;
            if (isUserVerified == false) {
                console.log("WebAuthnClient signIn() requesting UV: ");
                pin = requestUV();
            }

            console.log("WebAuthnClient signIn() sending challenge answer");
            let userData = await sendChallengeAnswer(cognitoUser, challengeResponse, pin);

            return userData;

        } else {
            //TODO move dispatch to UI logic
            //dispatch(alertActions.error("Invalid server response"));
            console.error("WebAuthnClient signIn() error: throw WebAuthnClientException");
            throw new WebAuthnClientException("Invalid server response");
        }
    } catch (error) {
        console.error("WebAuthnClient signIn() error: ", error);
        //TODO move dispatch to UI logic
        //dispatch(alertActions.error(err.message));
        throw error;
    }
}

async function sendChallengeAnswer(cognitoUser, challengeResponse, pin = defaultInvalidPIN) {
    challengeResponse.pinCode = parseInt(pin);
    console.log("WebAuthnClient sendChallengeAnswer(): ", challengeResponse);

    Auth.sendCustomChallengeAnswer(cognitoUser, JSON.stringify(challengeResponse))
        .then(user => {
            console.log(user);

            Auth.currentSession()
                .then(data => {
                    //TODO move dispatch to UI logic
                    //dispatch(alertActions.success('Authentication successful'));
                    let userData = {
                        id: 1,
                        username: user.attributes.name,
                        token: data.getAccessToken().getJwtToken()
                    }
                    localStorage.setItem('user', JSON.stringify(userData));
                    console.log("userData ", localStorage.getItem('user'));

                    return userData;
                })
                .catch(err => {
                    console.error("WebAuthnClient sendChallengeAnswer currentSession() error: ", err);
                    //TODO move dispatch to UI logic
                    //dispatch(alertActions.error("Something went wrong. ", err.message));
                    throw err;
                });

        })
        .catch(error => {
            console.error("WebAuthnClient sendCustomChallengeAnswer() error: ", error);
            //TODO move dispatch to UI logic
            //dispatch(alertActions.error(err.message));
            throw error;
        });
}


async function signUp(name, requestUV) {
    console.log("WebAuthnClient signUp() name=", name);

    // Start Registration
    // First, Cognito needs to make an account for the user
    const randomString = (length) => [...Array(length)].map(() => (Math.floor(Math.random() * 36)).toString(36)).join('');
    const password = randomString(14);
    const username = name.toLocaleLowerCase();
    localStorage.setItem('username', username);
    const attributes = { "name": username };

    try {
        const { user } = await Auth.signUp({
            username,
            password,
            attributes
        });
        console.log("SignUp: ", user);
    } catch (error) {
        // A user can get here if they come back to register after the initial registration was interrupted
        console.log(error);
    }

    // Second, register a webauthn credential associated with the user account
    try {
        let cognitoUser = await Auth.signIn(username);
        console.log("WebAuthnClient signUp() CognitoUser: ", cognitoUser);

        if (cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.get') {

            throw new WebAuthnClientException("User already exists. Please Sign In.", INVALID_CHALLENGE_TYPE);

        } else if (cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.create') {

            let challengeResponse = await getCreateCredentialChallegeResponse(cognitoUser.challengeParam);
            console.log("WebAuthnClient signUp() challengeResponse: ", challengeResponse);

            let isUserVerified = getUVFromAttestation(challengeResponse.credential.response.attestationObject);
            console.log("WebAuthnClient signUp() isUserVerified: ", isUserVerified);

            let pin = defaultInvalidPIN;
            if (isUserVerified == false) {
                console.log("WebAuthnClient signUp() requesting UV: ");
                pin = requestUV();
            }

            console.log("WebAuthnClient signUp() sending challenge answer");
            let userData = await sendChallengeAnswer(cognitoUser, challengeResponse, pin);
            console.log("WebAuthnClient signUp() userData: ",userData);

            return userData;

        } else {
            console.error("WebAuthnClient signUp() error: throw WebAuthnClientException");
            throw new WebAuthnClientException("Invalid server response");
        }
    } catch (error) {
        console.error("WebAuthnClient signUp() error: ", error);
        throw error;
    }

}