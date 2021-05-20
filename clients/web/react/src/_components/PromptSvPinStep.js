import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const PromptSvPinStep = ({ setForm, formData, navigation }) => {
  const LoginStep = () => {
    navigation.go('LoginStep');
  }
  const registerTrustedDeviceStep = () => {
    navigation.go('RegisterTrustedDeviceStep');
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
                <InputGroup.Text id="basic-addon1">Server Verified PIN</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="PIN"
                aria-label="PIN"
                aria-describedby="basic-addon1"
              />
              </InputGroup>
          </div>
          <div>
            <Button onClick={registerTrustedDeviceStep} variant="primary btn-block mt-3">Continue</Button>
          </div>
          <div className="mt-5">
            <hr></hr>
          </div>
          <div>
            <center><span onClick={LoginStep} className="btn-link">Try Another Method</span></center>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromptSvPinStep;