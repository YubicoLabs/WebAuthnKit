import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const ForgotStep = ({ setForm, formData, navigation }) => {
  const LogInStep = () => {
    navigation.go('LogInStep');
  }

  return (
    <>
      <div style={styles['rcourners']}>
        <img src="https://avatars.githubusercontent.com/u/25739468?s=100&v=4" alt="YubicoLabs" className="rounded mx-auto d-block" />
        <center>
          <h2>Forgot Your Security Key?</h2>
          <label>Enter a recovery code to continue.</label>
        </center>
        <div className="form mt-2">
          <div>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">Recovery Code</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Enter Recovery Code"
                aria-label="Recovery Code"
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
            <center><span onClick={LogInStep} className="btn-link">Back to Log In</span></center>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotStep;