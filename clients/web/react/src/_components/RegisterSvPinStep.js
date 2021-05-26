import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const RegisterSvPinStep = ({ setForm, formData, navigation }) => {
  const accountSecurityStep = () => {
    navigation.go('AccountSecurityStep');
  }

  return (
    <>
        <center>
          <h2>Create your Server-Verified PIN</h2>
          <label>Your account requires a Server-Verified PIN. Treat this PIN like your account's password.</label>
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
            <Button onClick={accountSecurityStep} variant="primary btn-block mt-3">Continue</Button>
          </div>
        </div>
    </>
  );
};

export default RegisterSvPinStep;