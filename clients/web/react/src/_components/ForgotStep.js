import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const ForgotStep = ({ setForm, formData, navigation }) => {
  const LogInStep = () => {
    navigation.go('LogInStep');
  }
  const accountSecurityStep = () => {
    navigation.go('AccountSecurityStep');
  }

  return (
    <>
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
            <Button onClick={accountSecurityStep} variant="primary btn-block mt-3">Continue</Button>
          </div>
          <div className="mt-5">
            <hr></hr>
          </div>
          <div>
            <center><span onClick={LogInStep} className="btn-link">Back to Log In</span></center>
          </div>
        </div>
    </>
  );
};

export default ForgotStep;