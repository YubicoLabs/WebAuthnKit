import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
import aws_exports from '../aws-exports';

axios.defaults.baseURL = aws_exports.apiEndpoint;

export const credentialService = {
    generateRecoveryCodes,
    listRecoveryCodes,
    update,
    updatePin,
    registerStart,
    registerFinish,
    getAll,
    getById,
    delete: _delete
};

async function generateRecoveryCodes() {
    try {
        const response = await axios.delete('/users/credentials/codes');
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

async function listRecoveryCodes() {
    try {
        const response = await axios.get('/users/credentials/codes');
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

async function update(credential) {
    /*const requestOptions = {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ credential })
    };

    return fetch(`${config.apiUrl}/credentials`, requestOptions).then(handleResponse);*/

    try {
        const response = await axios.put('/users/credentials/fido2', credential);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

async function updatePin(fields) {
    /*const requestOptions = {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ credential })
    };

    return fetch(`${config.apiUrl}/credentials`, requestOptions).then(handleResponse);*/

    try {
        const response = await axios.post('/users/credentials/pin', fields);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

async function getAll(jwt) {
    /*
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/credentials/byuser/${id}`, requestOptions).then(handleResponse);
    */
   axios.defaults.headers.common['Authorization'] = jwt;
   try {
        const response = await axios.get('/users/credentials');
        console.log("getAll response: ", response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/credentials/${id}`, requestOptions).then(handleResponse);
}

async function registerStart(registration) {
    /*const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
    };

    return fetch(`${config.apiUrl}/credentials/register`, requestOptions).then(handleResponse);*/
    console.log("registraiton: ",registration)
    try {
        const response = await axios.post('/users/credentials/fido2/register', registration);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

async function registerFinish(registration) {
    /*const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
    };

    return fetch(`${config.apiUrl}/credentials/register/finish`, requestOptions).then(handleResponse);*/
    try {
        const response = await axios.post('/users/credentials/fido2/register/finish', registration);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

// prefixed function name with underscore because delete is a reserved word in javascript
async function _delete(id) {
    /*const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/credentials/${id}`, requestOptions).then(handleResponse);*/

    try {
        const response = await axios.delete('/users/credentials/fido2?id='+id);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
    }
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}