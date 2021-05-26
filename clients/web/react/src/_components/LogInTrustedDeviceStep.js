import React from "react";
import { Button, Label } from 'react-bootstrap';

import styles from "./component.module.css";

const LogInTrustedDeviceStep = ({ setForm, formData, navigation }) => {

    const LogInStep = () => {
        navigation.go('LogInStep');
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
                        <center><label>{localStorage.getItem('username')}</label></center>
                    </div>
                    <div>
                        <Button variant="primary btn-block mt-3">Continue with Trusted Device or Security Key</Button>
                    </div>
                    <div className="mt-5">
                        <hr></hr>
                    </div>
                    <div>
                        <center><span onClick={LogInStep} className="btn-link">Try Another Method</span></center>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogInTrustedDeviceStep;