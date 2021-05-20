import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const SignUpStep = ({ setForm, formData, navigation }) => {

  const loginStep = (step) => {
    navigation.go('LoginStep');
  }
  const registerSvPinStep = (step) => {
    navigation.go('RegisterSvPinStep');
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
                <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Username"
                aria-label="Username"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1"><img src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" width="20" height="20"></img></InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Security Key Nickname"
                aria-label="Nickname"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
          </div>
          <div>
            <Button onClick={registerSvPinStep} variant="primary btn-block mt-3">Continue</Button>
          </div>
          <div className="mt-5">
            <hr></hr>
          </div>
          <div>
            <center>Already have an account? <span onClick={loginStep} className="btn-link">Log In</span></center>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpStep;