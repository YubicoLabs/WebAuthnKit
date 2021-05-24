import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const LogInStep = ({ setForm, formData, navigation }) => {

    const promptSvPinStep = () => {
        navigation.go('PromptSvPinStep');
    }
    const signUpStep = () => {
        navigation.go('SignUpStep');
    }
    const forgotStep = () => {
        navigation.go('ForgotStep');
    }
    const logInTrustedDeviceStep = () => {
        navigation.go('LogInTrustedDeviceStep');
    }

    return (
        <>
            <div style={styles['rcourners']}>
                <img src="https://avatars.githubusercontent.com/u/25739468?s=100&v=4" alt="YubicoLabs" className="rounded mx-auto d-block" />
                <center>
                    <h2>Welcome</h2>
                    <label>Log in to the WebAuthn Starter Kit to continue</label>
                </center>
                <div className="form mt-2">
                    <div>
                        <InputGroup className="mb-3">
                            <InputGroup.Prepend>
                                <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                            </InputGroup.Prepend>
                            <FormControl
                                placeholder="Username"
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                            />
                        </InputGroup>
                    </div>
                    <div onClick={forgotStep} className="btn-link mt-2">Forgot Your Security Key?</div>
                    <div>
                        <Button onClick={promptSvPinStep} variant="primary btn-block mt-3">Continue</Button>
                    </div>
                    <div className="mt-3">
                        <span className={styles['text-divider']}>OR</span>
                    </div>
                    <div>
                        <Button onClick={logInTrustedDeviceStep} variant="light btn-block mt-3">Continue with Trusted Device or Security Key</Button>
                    </div>
                    <div className="mt-5">
                        <hr></hr>
                    </div>
                    <div>
                        <center>Don't have an account? <span onClick={signUpStep} className="btn-link">Sign Up</span></center>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogInStep;