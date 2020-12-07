import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { userActions, credentialActions, alertActions } from '../_actions';
import { history } from '../_helpers';
import { ServerVerifiedPin } from '../_components';

import { get, supported } from '@github/webauthn-json';
import base64url from 'base64url';
import { Auth } from 'aws-amplify';
import { Button, Modal } from 'react-bootstrap';


function LoginWithSecurityKeyPage() {
    const username = localStorage.getItem('username');
    const [submitted, setSubmitted] = useState(false);
    const [cognitoUser, setCognitoUser] = useState({});
    const webAuthnStartResponse = useSelector(state => state.authentication.webAuthnStartResponse);
    const defaultInvalidPIN = -1;
    const dispatch = useDispatch();

    // reset login status
    useEffect(() => { 
        dispatch(userActions.logout()); 
        
        if(username) {
            signInWithUsername();
        } else {
            setSubmitted(true);
            dispatch(userActions.webAuthnStart());
        }
        
    }, []);

    useEffect(() => { 
        if(webAuthnStartResponse) {
            signInWithoutUsername();
        }
    }, [webAuthnStartResponse]);

    function getUV(authenticatorData) {
        let buffer = base64url.toBuffer(authenticatorData);
        
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

    function handleWebAuthn(e) {
        e.preventDefault();

        if(username) {
            signInWithUsername();
        } else {
            dispatch(userActions.webAuthnStart());
        }
    }

    async function signInWithUsername() {
        console.log("signInWithUsername");
        setSubmitted(true);

        try {
            let cognitoUser = await Auth.signIn(username);
            setCognitoUser(cognitoUser);
            console.log("SignIn CognitoUser: ", cognitoUser);

            if(cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.create'){
                dispatch(alertActions.error("Please register an account"));
                history.push('/login');
                return;
            } else if (cognitoUser.challengeName === 'CUSTOM_CHALLENGE' && cognitoUser.challengeParam.type === 'webauthn.get') {

                console.log("assertion request: " + JSON.stringify(cognitoUser.challengeParam, null, 2));

                const request = JSON.parse(cognitoUser.challengeParam.publicKeyCredentialRequestOptions);
                console.log("request: ", request);
                
                const publicKey = {"publicKey": request.publicKeyCredentialRequestOptions};
                console.log("publicKey: ", publicKey);

                let assertionResponse = await get(publicKey);

                console.log("assertion response: " + JSON.stringify(assertionResponse));

                let uv = getUV(assertionResponse.response.authenticatorData);
                console.log("uv: " + uv);

                let challengeResponse = {
                    credential: assertionResponse,
                    requestId: request.requestId,
                    inCode: defaultInvalidPIN
                };
                console.log("challengeResponse: ", challengeResponse);

                if(uv == false) {
                    dispatch(credentialActions.getUV(challengeResponse));
                } else {
                    console.log("sending Custom Challenge Answer");
                    // to send the answer of the custom challenge
                    Auth.sendCustomChallengeAnswer(cognitoUser, JSON.stringify(challengeResponse))
                    .then(user => {
                        console.log(user);

                        Auth.currentSession()
                            .then(data => {
                                dispatch(alertActions.success('Authentication successful'));
                                let userData = {
                                    id: 1,
                                    username: user.attributes.name,
                                    token: data.getAccessToken().getJwtToken()
                                }
                                localStorage.setItem('user', JSON.stringify(userData));
                                console.log("userData ", localStorage.getItem('user'));
                                history.push('/');
                            })
                            .catch(err => {
                                console.error("currentSession error: ", err);
                                dispatch(alertActions.error("Something went wrong. ", err.message));
                                setSubmitted(false);
                            });
                            
                    })
                    .catch(err => {
                        console.error("sendCustomChallengeAnswer error: ", err);
                        dispatch(alertActions.error(err.message));
                    });
                }
            } else {
                setSubmitted(false);
                dispatch(alertActions.error("Invalid server response"));
            }
        } catch (err) {
            console.error("signIn error");
            console.error(err);
            setSubmitted(false);
            dispatch(alertActions.error(err.message));
        }
    }

    async function signInWithoutUsername() {
        console.log("signInWithoutUsername");
        setSubmitted(true);

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
                history.push('/login');
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
                                let userData = {
                                    id: 1,
                                    username: user.attributes.name,
                                    token: data.getAccessToken().getJwtToken()
                                }
                                localStorage.setItem('user', JSON.stringify(userData));
                                console.log("userData ", localStorage.getItem('user'));
                                history.push('/');
                            })
                            .catch(err => {
                                console.log("currentSession error: ", err);
                                dispatch(alertActions.error("Something went wrong. ", err.message));
                                setSubmitted(false);
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
            setSubmitted(false);
            dispatch(alertActions.error(error.message));
        });
    }

    function WebAuthn(props) {
        if(!supported()) {
            return(
                <div>This browser is not compatible with WebAuthn</div>
            );
        }

        return(
            <div>
                <form name="form" onSubmit={handleWebAuthn}>
                    <div className="form-group">
                                <button className="btn btn-primary">
                                    {submitted && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    Login with Security Key
                                </button>
                    </div>
                </form>
            </div>
        );
    }

    function UV(props) {
        const cognitoUser = props.cognitoUser;
        const finishUVRequest = useSelector(state => state.credentials.finishUVRequest);
        const svpinDispatchProps = {type: "dispatch", saveCallback: finishUVResponse, showSelector: finishUVRequest};


        function finishUVResponse(fields) {
            let challengeResponse = finishUVRequest;
            console.log("sending authenticator response with sv-pin: ", challengeResponse);
            challengeResponse.pinCode = parseInt(fields.pin); 
            
            Auth.sendCustomChallengeAnswer(cognitoUser, JSON.stringify(challengeResponse))
            .then(user => {
                console.log("uv sendCustomChallengeAnswer: ", user);

                Auth.currentSession()
                .then(data => {
                    dispatch(alertActions.success('Authentication successful'));
                    let userData = {
                        id: 1,
                        username: user.attributes.name,
                        token: data.getAccessToken().getJwtToken()
                    }
                    localStorage.setItem('user', JSON.stringify(userData));
                    console.log("userData ", localStorage.getItem('user'));
                    history.push('/');
                })
                .catch(err => {
                    console.log("currentSession error: ", err);
                    dispatch(alertActions.error("Something went wrong. ", err.message));
                    setSubmitted(false);
                });

            })
            .catch(err => {
                console.log("sendCustomChallengeAnswer error: ", err);
                let message = "Invalid PIN";
                dispatch(alertActions.error(message));
                setSubmitted(false);
            });
            dispatch(credentialActions.completeUV());
        }

        return (
            <>
                <ServerVerifiedPin {...svpinDispatchProps}/>
            </>
        );
    }

    async function handleRecoveryCode(code) {
        setSubmitted(true);
        try {
            let cognitoUser = await Auth.signIn(username);
            setCognitoUser(cognitoUser);
            console.log("CognitoUser: ", cognitoUser);

            Auth.sendCustomChallengeAnswer(cognitoUser, JSON.stringify({recoveryCode: code}))
                .then(user => {
                    console.log(user);
                    
                    Auth.currentSession()
                    .then(data => {
                        dispatch(alertActions.success('Authentication successful'));
                        let userData = {
                            id: 1,
                            username: user.attributes.name,
                            token: data.getAccessToken().getJwtToken()
                        }
                        localStorage.setItem('user', JSON.stringify(userData));
                        console.log("userData ", localStorage.getItem('user'));
                        history.push('/');
                    })
                    .catch(err => {
                        console.log("currentSession error: ", err);
                        dispatch(alertActions.error("Something went wrong. ", err.message));
                        setSubmitted(false);
                    });
                })
                .catch(err => {
                    setSubmitted(false);
                    console.log("sendCustomChallengeAnswer error: ", err);
                    let msg = "Invalid recovery code";
                    dispatch(alertActions.error(msg));
                });

        } catch (error) {
            console.error("recovery code error");
            console.error(error);
            setSubmitted(false);
            dispatch(alertActions.error(error.message));
        }
    }

    function RecoveryCodes() {

        const [show, setShow] = useState(false);
        const [code, setCode] = useState(undefined);
        const inputRef = useRef(null);
        
        useEffect(() => {
            if(show) {
                inputRef.current.focus();
            }
        }, [show]);

        const handleClose = () => {
            setShow(false);
            setSubmitted(false);
        }
        const handleCancel = () => {
            setShow(false);
            setSubmitted(false);
        }
        const handleLogin = () => {
            setShow(false);

            handleRecoveryCode(code);
            
            setCode(undefined);
        }
        const handleShow = () => {
            setCode(undefined);
            setShow(true);
        }
        const handleChangeCode = (e) => {
            const { name, value } = e.target;
            setCode(value);
        }

        return (
            <>
                <label onClick={handleShow} className="btn btn-link">Login another way     </label> <label className="btn btn-link"><a href="/login">Cancel</a></label>
                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Enter RecoveryCode</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <label>Recovery Code </label>
                        <input type="password" name="code" autoFocus value={code} onChange={handleChangeCode} ref={inputRef} onKeyPress={(ev) => {
                                if (ev.key === 'Enter') {
                                    handleLogin();
                                    ev.preventDefault();
                                }
                            }}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleLogin}>
                            Login
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }

    return (
        <>
            <h2>Login</h2>
            <h2>{username}</h2>
            <WebAuthn />
            <UV cognitoUser={cognitoUser} />
            <RecoveryCodes /> 
        </>
    );
}

export { LoginWithSecurityKeyPage };