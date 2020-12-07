import config from 'config';
import { authHeader } from '../_helpers';

import { Auth } from 'aws-amplify';
import axios from 'axios';
import aws_exports from '../aws-exports';

axios.defaults.baseURL = aws_exports.apiEndpoint;

export const userService = {
    webAuthnStart,
    logout,
    exists,
    delete: _delete
};

async function webAuthnStart() {
    try {
        const response = await axios.get('/users/credentials/fido2/authenticate');
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

async function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
    try {
        await Auth.signOut();
      } catch (error) {
        console.log('Error while signing out', error);
      }
}

async function exists(username) {
    const _username = username.toLowerCase();
    try {
        let cognitoUser = await Auth.signIn(_username);
        if (cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.get') {
            return cognitoUser;
        } else {
            // user exists but no credentials, registration may have been interrupted
            return _error(cognitoUser);
        }
    } catch (error) {
        return _error(error);
    }
}

// prefixed function name with underscore because delete is a reserved word in javascript
async function _delete(jwt) {

    axios.defaults.headers.common['Authorization'] = jwt;
    try {
        const response = await axios.delete('/users');
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

function _error(response) {
    return Promise.reject(JSON.stringify(response));
}
