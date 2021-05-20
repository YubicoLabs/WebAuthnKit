import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const RegisterSvPinStep = ({ setForm, formData, navigation }) => {
  const LoginStep = () => {
    navigation.go('LoginStep');
  }

  return (
    <>
      <div style={styles['rcourners']}>
        <img src="https://avatars.githubusercontent.com/u/25739468?s=100&v=4" alt="YubicoLabs" className="rounded mx-auto d-block" />
        <center>
          <h2>Welcome</h2>
          <label>Sign up to the WebAuthn Starter Kit to continue</label>
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
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">Confirm PIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="PIN"
                aria-label="PIN"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
          </div>
          <div>
            <Button variant="primary btn-block mt-3">Continue</Button>
          </div>
          <div className="mt-5">
            <hr></hr>
          </div>
          <div>
            <center>Already have an account? <span onClick={LoginStep} className="btn-link">Log In</span></center>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterSvPinStep;