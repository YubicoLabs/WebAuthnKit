import React, { useState, useEffect, useRef, Profiler } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { userActions, credentialActions, alertActions } from '../_actions';
import { history } from '../_helpers';
import { ServerVerifiedPin } from '../_components';

import { create, supported } from '@github/webauthn-json';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import base64url from 'base64url';
import cbor from 'cbor';
import { Auth } from 'aws-amplify';
import axios from 'axios';
import aws_exports from '../aws-exports';
import validate from 'validate.js';

axios.defaults.baseURL = aws_exports.apiEndpoint;

function HomePage() {

    const [userInfo, setUserInfo] = useState({
        attributes: {},
        id: "",
        username: ""
    });
    const credentials = useSelector(state => state.credentials);
    const alert = useSelector(state => state.alert);
    const [jwt, setJwt] = useState(undefined);
    const svpinChangeProps = {type: "change", saveCallback: updatePin};
    const dispatch = useDispatch();

    function updatePin(fields) {
        dispatch(credentialActions.updatePin(fields));
    }

    useEffect(() => {
        currentAuthenticatedUser();
    }, []);

    useEffect(() => {
        if(jwt) {
            dispatch(credentialActions.getAll(jwt));
        }
    }, [alert]);

    function currentAuthenticatedUser() {
        Auth.currentAuthenticatedUser()
        .then(info => {
            console.log("currentAuthUser", info);
            setUserInfo(info);
        })
            .catch(err => {
                console.log(err);
                dispatch(alertActions.error(err.message));
            });

        Auth.currentSession().then(res => {
            let idToken = res.getIdToken();
            let idJwt = idToken.getJwtToken();
            setJwt(idJwt);
            console.log(`myJwt: ${idJwt}`);
            dispatch(credentialActions.getAll(idJwt));
        })
    }

    function getUV(attestationObject) {
        let attestationBuffer = base64url.toBuffer(attestationObject);
        let attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
        let buffer = attestationStruct.authData;
        
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

    function Credentials() {
        // Edit Credential
        const [show, setShow] = useState(false);
        const [nickname, setNickname] = useState('');
        const [credential, setCredential] = useState('');
        const [invalidNickname, setInvalidNickname] = useState(undefined);
        const [submitted, setSubmitted] = useState(false);
        const defaultInvalidPIN = -1;
        var constraints = {
            nickname: {
                length: {
                    maximum: 20
                }
            }
          };

        const handleClose = () => setShow(false);
        const handleCancel = () => setShow(false);
        const handleDelete = () => {
            setShow(false);
            dispatch(credentialActions.delete(credential.credential.credentialId.base64));
        }
        const handleSave = () => {
            setSubmitted(true);
            let result = validate({nickname: nickname}, constraints);
            if(result) {
                setInvalidNickname(result.nickname.join(". "));
                return result;
            } else {
                setInvalidNickname(undefined);
            }
            
            setShow(false);
            credential.credentialNickname.value = nickname;
            dispatch(credentialActions.update(credential));
        }
        const handleShow = (credential) => {
            setNickname(credential.credentialNickname.value);
            setCredential(credential);
            setShow(true);
        }
        const handleChange = (e) => {
            const { name, value } = e.target;
            setNickname(value);
        }

        // Add Credential
        const [showAdd, setShowAdd] = useState(false);
        const [isResidentKey, setIsResidentKey] = useState(false);
        const handleCloseAdd = () => setShowAdd(false);
        const handleCancelAdd = () => setShowAdd(false);
        const handleSaveAdd = () => {
            setShowAdd(false);
            register();
        }
        const handleShowAdd = () => {
            setNickname('');
            setShowAdd(true);
        }
        const handleCheckboxChange = (e) => {
            const target = e.target;
            const value = target.type === 'checkbox' ? target.checked : target.value;
            setIsResidentKey(value);
        }
        const register = () => {
            console.log("register");
            setSubmitted(true);
            console.log("nickname: ", nickname);

            axios.post('/users/credentials/fido2/register', {"nickname": nickname, "requireResidentKey": isResidentKey})
            .then( startRegistrationResponse => {
                console.log(startRegistrationResponse);
    
                const requestId = startRegistrationResponse.data.requestId;
    
                let publicKey = { "publicKey": startRegistrationResponse.data.publicKeyCredentialCreationOptions };
                console.log("pubKey: ", publicKey);
    
                create(publicKey)
                .then(makeCredentialResponse => {
                    console.log("make credential response: " + JSON.stringify(makeCredentialResponse));
    
                    let uv = getUV(makeCredentialResponse.response.attestationObject);
                    console.log("uv: " + uv);

                    let challengeResponse = {
                        credential: makeCredentialResponse,
                        requestId: requestId,
                        pinSet: startRegistrationResponse.data.pinSet,
                        pinCode: defaultInvalidPIN,
                        nickname: nickname
                    };
                    console.log("challengeResponse: ", challengeResponse);
        
                    if(uv === true) {
                        console.log("finishRegistration: ", challengeResponse);
                        dispatch(credentialActions.registerFinish(challengeResponse));
                    } else {
                        dispatch(credentialActions.getUV(challengeResponse));
                    }
                    
                })
                .catch(error => {
                    console.error(error);
                    dispatch(alertActions.error(error.message));
                });
            })
            .catch(error => {
                console.error(error);
                dispatch(alertActions.error(error.message));
            });
        }

        const inputRef = useRef(null);

        useEffect(() => {
            if(show || showAdd) {
                inputRef.current.focus();
            }
        }, [show, showAdd]);

        if(!supported()) {
            return(
                <div>This browser is not compatible with WebAuthn</div>
            );
        }

        return (
            <>
                <h3>Security Keys</h3>
                {credentials.loading && <em>Loading security keys...</em>}
                {credentials.error && <span className="text-danger">ERROR: {credentials.error}</span>}
                {credentials.items &&
                    <ul>
                        {credentials.items.map((credential, index) =>
                            <li key={credential.credential.credentialId.base64}>
                                {credential.credentialNickname.value}
                                {
                                    credential.deleting ? <em> - Deleting...</em>
                                        : credential.deleteError ? <span className="text-danger"> - ERROR: {credential.deleteError}</span>
                                            : <span> - <a onClick={() => handleShow(credential)} className="text-primary">Edit</a></span>
                                }
                            </li>
                        )}
                    </ul>
                }
                <p></p>
                        <Button variant="primary" onClick={handleShowAdd}>
                            Add a new security key
                        </Button>
                <p></p>
                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit your security key</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <label>Nickname  <input type="text" name="nickname" autoFocus value={nickname} ref={inputRef} onChange={handleChange} className={'form-control' + (submitted && invalidNickname ? ' is-invalid' : '')} onKeyPress={(ev) => {
                            if (ev.key === 'Enter') {
                                handleSave();
                                ev.preventDefault();
                            }
                        }}/></label>
                        { invalidNickname ? <Alert variant="danger">{invalidNickname}</Alert> : null }
                        <label><em>Usernameless a.k.a. Client-Side Discoverable Credential:</em> {credential.registrationRequest ? credential.registrationRequest.requireResidentKey.toString() : ''}</label><br/>
                        <label><em>Last Used Time:</em> {credential.lastUsedTime ? new Date(credential.lastUsedTime.seconds*1000).toLocaleString() : ''}</label><br/>
                        <label><em>Last Updated Time:</em> {credential.lastUpdatedTime ? new Date(credential.lastUpdatedTime.seconds*1000).toLocaleString() : ''}</label><br/>
                        <label><em>Registration Time:</em> {credential.registrationTime ? new Date(credential.registrationTime.seconds*1000).toLocaleString() : ''}</label><br/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={showAdd} onHide={handleCloseAdd}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add a new security key</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <label>Nickname</label>
                        <input type="text" name="nickname" autoFocus value={nickname} ref={inputRef} onChange={handleChange} className={'form-control' + (submitted && invalidNickname ? ' is-invalid' : '')} onKeyPress={(ev) => {
                            if (ev.key === 'Enter') {
                                handleSaveAdd();
                                ev.preventDefault();
                            }
                        }}/>
                        { invalidNickname ? <Alert variant="danger">{invalidNickname}</Alert> : null }
                        <br/>
                        <label><input name="isResidentKey" type="checkbox" checked={isResidentKey} onChange={handleCheckboxChange}/> Enable usernameless login with this key
                        <br/>
                        <em><small>Note: Passwordless requires a FIDO2 device and a browser that supports it.</small></em></label>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCancelAdd}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveAdd}>
                            Register security key
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }

    function UV() {
        const finishUVRequest = useSelector(state => state.credentials.finishUVRequest);
        const svpinChangeeProps = {type: "change", saveCallback: finishUVResponse, showSelector: finishUVRequest};
        const svpinDispatchProps = {type: "dispatch", saveCallback: finishUVResponse, showSelector: finishUVRequest};


        function finishUVResponse(fields) {
            let challengeResponse = finishUVRequest;
            console.log("sending authenticator response with sv-pin: ", challengeResponse);
            challengeResponse.pinCode = parseInt(fields.pin); 
            dispatch(credentialActions.registerFinish(challengeResponse));
            dispatch(credentialActions.completeUV());
        }

        if (finishUVRequest !== undefined && finishUVRequest.pinSet === false) {
            return (
                <>
                    <ServerVerifiedPin {...svpinChangeeProps}/>
                </>
            );
        }

        return (
            <>
                <ServerVerifiedPin {...svpinDispatchProps}/>
            </>
        );

    }

    function RecoveryCodes() {
        let recoveryCodesViewed = credentials.recoveryCodesViewed;
        let allRecoveryCodesUsed = credentials.allRecoveryCodesUsed;
        const recoveryCodes = useSelector(state => state.recoveryCodes);
        const [showCodes, setShowCodes] = useState(false);
        const handleClose = () => {
            setShowCodes(false);
        }
        const handleGenerate = () => {
            setShowCodes(true);
            dispatch(credentialActions.generateRecoveryCodes());
        }
        const handleShow = (e) => {
            setShowCodes(true);
            dispatch(credentialActions.listRecoveryCodes());
        }
        useEffect(() => {
            if(recoveryCodesViewed === false || allRecoveryCodesUsed) {
                handleShow();
            }
        }, [recoveryCodesViewed,allRecoveryCodesUsed]);

        return (
            <>
                <h3>Recovery Codes</h3>
                        <Button variant="primary" onClick={handleShow}>
                            Show Recovery Codes
                        </Button>
                <p></p>
                <Modal show={showCodes} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Recovery Codes</Modal.Title>
                    </Modal.Header>
                    <Form>
                    <Modal.Body>
                        <label>Protect your recovery codes as you would a password. We recommend saving them in a safe spot, such as password manager.</label> 
                        <Alert variant="warning">If you lose you all your authenticators and don't have the recovery codes you will lose access to your account.</Alert>
                        {recoveryCodes.loading && <em>Loading recovery codes...</em>}
                        {recoveryCodes.generating && <em>Generating recovery codes...</em>}
                        {recoveryCodes.error && <span className="text-danger">ERROR: {recoveryCodes.error}</span>}
                        {recoveryCodes.codesRemaining && (recoveryCodes.codesRemaining === 0) ? <em>Please generate new recovery codes now.</em> : ''}
                        {recoveryCodes.codes && 
                            <ul>
                                <li>{recoveryCodes.codes[0]}</li>
                                <li>{recoveryCodes.codes[1]}</li>
                                <li>{recoveryCodes.codes[2]}</li>
                                <li>{recoveryCodes.codes[3]}</li>
                                <li>{recoveryCodes.codes[4]}</li>
                            </ul>
                        }   
                        {recoveryCodes.codes && <Alert variant="warning">Save your recovery codes now. They will not be shown again.</Alert>}        
                        {recoveryCodes.codesRemaining && (recoveryCodes.codesRemaining > 0) ? <em>{recoveryCodes.codesRemaining} recovery codes remaining.</em> : ''}
                        {allRecoveryCodesUsed && (!recoveryCodes.generating || !recoveryCodes.codes) && <em className="text-danger">All recovery codes have been used. Please generate new recovery codes now.</em>}
                        <p></p>
                        <h6>Generate new recovery codes</h6> 
                        <label>When you generate new recovery codes, you must copy them to a safe spot. Your old codes will not work anymore.</label> 
                        <Button variant="secondary" onClick={handleGenerate}>Generate</Button>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={handleClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                    </Form>
                </Modal>
            </>
        );
    }

    function DeleteUser() {
        const [show, setShow] = useState(false);
        const handleClose = () => {
            setShow(false);
        }
        const handleDelete = () => {
            setShow(false);
            Auth
            .currentAuthenticatedUser()
            .then((user) => new Promise((resolve, reject) => {
                user.deleteUser(error => {
                    if (error) {
                        return reject(error);
                    }
                    dispatch(userActions.delete(jwt));
                    history.push('/login');
                    
                    resolve();
                });
            }))
            .catch(error => {
                console.error(error);
                dispatch(alertActions.error(error.message));
            });
        }
        const handleShow = () => {
            setShow(true);
        }

        return (
            <>
                <h3>Delete Account</h3>
                        <Button variant="danger" onClick={handleShow}>
                            Delete your account
                        </Button>
                <p></p>
                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Account</Modal.Title>
                    </Modal.Header>
                    <Form>
                    <Modal.Body> 
                        <label>Once you delete your account, there is no going back. Please be certain.</label> 
                        <Button variant="danger" onClick={handleDelete}>Delete</Button>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={handleClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                    </Form>
                </Modal>
            </>
        );
    }

    return (
        <>
            <h1>Hi {userInfo.attributes.name}!</h1>
            <p>Welcome to the WebAuthn Starter Kit!</p>
            <Credentials/>
            <UV/>
            <ServerVerifiedPin {...svpinChangeProps}/>
            <RecoveryCodes />
            <DeleteUser />
            <Link to="/login">Logout</Link>
        </>
    );
}

export { HomePage };