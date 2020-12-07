//
// This file is deprecated and out of date. Leaving here as a basis for a future mock server if needed.
//

import base64url from 'base64url';
import cbor from 'cbor';

// arrays in local storage for registered users, credetials, & server-verified pins
let users = JSON.parse(localStorage.getItem('users')) || [];
let credentials = JSON.parse(localStorage.getItem('credentials')) || [];

    
export function configureFakeBackend() {
    let realFetch = window.fetch;
    window.fetch = function (url, opts) {
        const { method, headers } = opts;
        const body = opts.body && JSON.parse(opts.body);

        return new Promise((resolve, reject) => {
            // wrap in timeout to simulate server api call
            setTimeout(handleRoute, 500);

            function handleRoute() {
                switch (true) {
                    case url.endsWith('/users/exists') && method === 'POST':
                        return exists();
                    case url.endsWith('/users/authenticate/start') && method === 'POST':
                        return webAuthnStart();
                    case url.endsWith('/users/authenticate/finish') && method === 'POST':
                        return webAuthnFinish();
                    case url.endsWith('/users/authenticate') && method === 'POST':
                        return authenticate();
                    case url.endsWith('/users/register/start') && method === 'POST':
                        return registerUserStart();
                    case url.endsWith('/users/register/finish') && method === 'POST':
                        return registerUserFinish();
                    case url.endsWith('/users') && method === 'GET':
                        return getUsers();
                    case url.match(/\/users\/\d+$/) && method === 'PUT':
                        return updateUser();
                    case url.match(/\/users\/\d+$/) && method === 'DELETE':
                        return deleteUser();
                    case url.endsWith('/credentials/register') && method === 'POST':
                        return registerCredentialStart();
                    case url.endsWith('/credentials/register/finish') && method === 'POST':
                        return registerCredentialFinish();
                    case url.match(/\/credentials\/byuser\/\d+$/) && method === 'GET':
                        return getCredentialsByUser();
                    case url.match(/\/credentials/) && method === 'PUT':
                        return updateCredential();
                    case url.match(/\/credentials\/.*?$/) && method === 'DELETE':
                        return deleteCredential();
                    default:
                        // pass through any requests not handled above
                        return realFetch(url, opts)
                            .then(response => resolve(response))
                            .catch(error => reject(error));
                }
            }

            // route functions

            function webAuthnStart() {
                const request = body;

                const registrations = getRegistrations(request.inputs.username);
                
                // TODO generate random challenge

                const responseBody = {
                    publicKey: {
                      challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
                      allowCredentials: registrations,
                      userVerification: "preferred"
                    }
                };

                return ok(responseBody);
            }

            function getRegistrations(username) {
                const registeredCredentials = credentials.filter(x => x.request.publicKey.user.name === username);
                return registeredCredentials.map((x) => ({
                    id: x.rawId,
                    type: x.type
                }));
            }

            function webAuthnFinish() {
                const request = body;

                // TODO Validate assertion

                const authDataBuffer = base64url.toBuffer(request.assertion.webAuthnFinishRequest.response.authenticatorData);
                const isUV = getUV(authDataBuffer);
                if (isUV === false && !request.assertion.networkPin){
                    return error('PIN required');
                }
                
                const user = users.find(x => x.username === request.assertion.username);
                if (!user) return error('Username incorrect');

                if (isUV === false && (user.networkPin !== request.assertion.networkPin)){
                    return error('PIN incorrect');
                }

                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    token: 'fake-jwt-token'
                });
            }

            function authenticate() {
                const { username, networkPin } = body;
                const user = users.find(x => x.username === username && x.networkPin === networkPin);
                if (!user) return error('Username or Network PIN is incorrect');
                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    token: 'fake-jwt-token'
                });
            }

            function exists() {
                const username = body;
                if (users.find(x => x.username === username)) {
                    return ok();
                }
                return error(`Username  ${username} does not exist`);
            }

            function registerUserStart() {
                const request = body;

                const userId = users.length ? Math.max(...users.map(x => x.id)) + 1 : 1;
    
                //TODO generate challenge, set excludeCredentials
                const responseBody = {
                    publicKey: {
                        challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
                        rp: { name: "Localhost, Inc." },
                        user: { id: intToBase64(userId), name: request.username, displayName: request.username },
                        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                        excludeCredentials: [],
                        authenticatorSelection: { userVerification: "preferred", }
                    }
                };

                return ok(responseBody);
            }

            function registerUserFinish() {
                let request = body;

                if (users.find(x => x.username === request.username)) {
                    return error(`Username  ${request.username} is already taken`);
                }

                //TODO verify registration

                if (credentials.find(x => x.id === request.registerFinishRequest.id)) {
                    return error(`Credential ${request.id} is already taken`);
                }

                
                let attestationBuffer = base64url.toBuffer(request.registerFinishRequest.response.attestationObject);
                let attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
                const isUV = getUV(attestationStruct.authData);

                if (request.networkPin === '' && isUV === false){
                    return error('The Network PIN cannot be empty');
                }
    
                credentials.push(request.registerFinishRequest);
                localStorage.setItem('credentials', JSON.stringify(credentials));

                //save user
                users.push(request);
                localStorage.setItem('users', JSON.stringify(users));

                return ok();
            }
    
            function getUsers() {
                if (!isLoggedIn()) return unauthorized();

                return ok(users);
            }

            function updateUser() {
                if (!isLoggedIn()) return unauthorized();
    
                const user = body;
                
                users = users.map(obj => [user].find(o => o.id === obj.id) || obj);
                localStorage.setItem('users', JSON.stringify(users));

                return ok();
            }
    
            function deleteUser() {
                if (!isLoggedIn()) return unauthorized();
    
                users = users.filter(x => x.id !== idFromUrl());
                localStorage.setItem('users', JSON.stringify(users));

                credentials = credentials.filter(x => x.request.publicKey.user.id !== intToBase64(idFromUrl()));
                localStorage.setItem('credentials', JSON.stringify(credentials));

                return ok();
            }

            function registerCredentialStart() {
                const request = body;

                const registrations = getRegistrations(request.username);
    
                //TODO generate challenge, set excludeCredentials
                const responseBody = {
                    publicKey: {
                        challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
                        rp: { name: "Localhost, Inc." },
                        user: { id: intToBase64(request.id), name: request.username, displayName: request.username },
                        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                        excludeCredentials: registrations,
                        authenticatorSelection: { userVerification: "preferred", }
                    }
                };

                return ok(responseBody);
            }

            function registerCredentialFinish() {
                let request = body;
    
                if (credentials.find(x => x.id === request.registerFinishRequest.id)) {
                    return error(`Credential ${request.registerFinishRequest.id} is already taken`);
                }

                //TODO verify registration
    
                credentials.push(request.registerFinishRequest);
                localStorage.setItem('credentials', JSON.stringify(credentials));

                return ok();
            }
    
            function getCredentialsByUser() {
                if (!isLoggedIn()) return unauthorized();

                const userCredentials = credentials.filter(x => x.request.publicKey.user.id === intToBase64(idFromUrl()));

                return ok(userCredentials);
            }

            function updateCredential() {
                if (!isLoggedIn()) return unauthorized();

                const request = body;
                console.log(request.credential.nickname);
                console.log(request.credential.id);
                credentials = credentials.map(obj => [request.credential].find(o => o.id === obj.id) || obj);
                console.log(JSON.stringify(credentials));
                localStorage.setItem('credentials', JSON.stringify(credentials));

                return ok();
            }
    
            function deleteCredential() {
                if (!isLoggedIn()) return unauthorized();

                const urlParts = url.split('/');
                const id = urlParts[urlParts.length - 1];
    
                // TODO constrain delete operation to only the logged in user credentials
                credentials = credentials.filter(x => x.id !== id);
                localStorage.setItem('credentials', JSON.stringify(credentials));
                return ok();
            }

            // helper functions

            function ok(body) {
                resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) });
            }

            function unauthorized() {
                resolve({ status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })) });
            }

            function error(message) {
                resolve({ status: 400, text: () => Promise.resolve(JSON.stringify({ message })) });
            }

            function isLoggedIn() {
                return headers['Authorization'] === 'Bearer fake-jwt-token';
            }
    
            function idFromUrl() {
                const urlParts = url.split('/');
                return parseInt(urlParts[urlParts.length - 1]);
            }

            function intToBase64(id) {
                const binary  = (id >>> 0).toString(2);
                return btoa(binary);
            }

            function getUV(buffer) {            
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
        });
    }
}