import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Label } from 'react-bootstrap';

import { Auth } from 'aws-amplify';
import { get, supported } from '@github/webauthn-json';

import { userActions, alertActions } from '../_actions';
import { history } from '../_helpers';


const LogInTrustedDeviceStep = ({ setForm, formData, navigation }) => {

    const webAuthnStartResponse = useSelector(state => state.authentication.webAuthnStartResponse);
    const defaultInvalidPIN = -1;
    const dispatch = useDispatch();

    useEffect(() => { 
        if(webAuthnStartResponse) {
            signInWithoutUsername();
        }
    }, [webAuthnStartResponse]);

    const LogInStep = () => {
        navigation.go('LogInStep');
    }

    const continueStep = () => {
        dispatch(userActions.webAuthnStart());
    }

    async function signInWithoutUsername() {
        console.log("signInWithoutUsername");

        // get usernameless auth request
        console.log("webAuthnStartResponse: ", webAuthnStartResponse);
                
        const publicKey = {"publicKey": webAuthnStartResponse.publicKeyCredentialRequestOptions};
        console.log("publicKey: ", publicKey);

        let assertionResponse = await get(publicKey);
        console.log("assertionResponse: ", assertionResponse);

        // get username from assertionResponse
        const username = assertionResponse.response.userHandle;
        console.log("userhandle: ", username);

        let challengeResponse = {
            credential: assertionResponse,
            requestId: webAuthnStartResponse.requestId,
            pinCode: defaultInvalidPIN
        };


        Auth.signIn(username)
        .then(user => {
            if(user.challengeName === 'CUSTOM_CHALLENGE' && user.challengeParam.type === 'webauthn.create'){
                dispatch(alertActions.error("Please register an account"));
                history.push('/register');
                return;
            } else if (user.challengeName === 'CUSTOM_CHALLENGE'  && user.challengeParam.type === 'webauthn.get') {
                // to send the answer of the custom challenge
                console.log("uv sending Custom Challenge Answer");
                Auth.sendCustomChallengeAnswer(user, JSON.stringify(challengeResponse))
                    .then(user => {
                        console.log(user);

                        Auth.currentSession()
                            .then(data => {
                                dispatch(alertActions.success('Authentication successful'));
                                // TODO: Investigate why user.attributes is not present
                                //let userData = {
                                //    id: 1,
                                //    username: user.attributes.name,
                                //    token: data.getAccessToken().getJwtToken()
                                //}
                                let userData = {
                                    id: 1,
                                    token: data.getAccessToken().getJwtToken()
                                }
                                localStorage.setItem('user', JSON.stringify(userData));
                                console.log("userData ", localStorage.getItem('user'));
                                history.push('/');
                            })
                            .catch(err => {
                                console.log("currentSession error: ", err);
                                dispatch(alertActions.error("Something went wrong. ", err.message));
                            });

                    })
                    .catch(err => {
                        console.error("sendCustomChallengeAnswer error: ", err);
                        dispatch(alertActions.error(err.message));
                    });
            } else {
                setSubmitted(false);
                dispatch(alertActions.error("Invalid server response"));
            }
        })
        .catch(error => {
            console.error("signIn error");
            console.error(error);
            dispatch(alertActions.error(error.message));
        });
    }
    

    return (
        <>
                <center>
                    <h2>Welcome</h2>
                    <label>Log in to the WebAuthn Starter Kit to continue</label>
                </center>
                <div className="form mt-2">
                    <div>
                        <center><label>{localStorage.getItem('username')}</label></center>
                    </div>
                    <div>
                        <Button onClick={continueStep} variant="primary btn-block mt-3">Continue with Trusted Device or Security Key</Button>
                    </div>
                    <div className="mt-5">
                        <hr></hr>
                    </div>
                    <div>
                        <center><span onClick={LogInStep} className="btn-link">Try Another Method</span></center>
                    </div>
                </div>
        </>
    );
};

export default LogInTrustedDeviceStep;