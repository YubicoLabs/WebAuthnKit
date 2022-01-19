import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Label, Spinner } from 'react-bootstrap';

import { Auth } from 'aws-amplify';
import { get, supported } from '@github/webauthn-json';

import { userActions, alertActions } from '../_actions';
import { history } from '../_helpers';

const styles = require("../_components/component.module.css");

const LogInTrustedDeviceStep = ({ navigation }) => {
    const [continueSubmitted, setContinueSubmitted] = useState(false);

    const webAuthnStartResponse = useSelector(state => state.authentication.webAuthnStartResponse);
    const defaultInvalidPIN = -1;
    const dispatch = useDispatch();

    useEffect(() => { 
        if(webAuthnStartResponse) {
            signIn();
        }
    }, [webAuthnStartResponse]);

    const LogInStep = () => {
        navigation.go('LogInStep');
    }

    const continueStep = () => {
        dispatch(userActions.webAuthnStart());
    }

    async function signIn() {
        try {
            setContinueSubmitted(true);
            await signInWithoutUsername();
            //setContinueSubmitted(false);
        } catch {
            setContinueSubmitted(false);
        }
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
                        console.log("someUser Stuff", user);
                        navigation.go("InitUserStep");

                    })
                    .catch(err => {
                        console.error("sendCustomChallengeAnswer error: ", err);
                        dispatch(alertActions.error(err.message));
                    });
            } else {
                dispatch(alertActions.error("Invalid server response"));
            }
        })
        .catch(error => {
            console.error("signIn error");
            console.error(error);
            dispatch(alertActions.error(error.message));
            setContinueSubmitted(false);
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
                    <Button
                        type="submit"
                        onClick={continueStep}
                        value="continue"
                        variant="primary"
                        block
                        disabled={continueSubmitted}>
                        {continueSubmitted && (
                            <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                            <span className={styles.default["loaderSpan"]}>
                                Fetching your profile
                            </span>
                            </>
                        )}
                        {!continueSubmitted && <span>Continue with Trusted Device or Security Key</span>}
                    </Button>
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