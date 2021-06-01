import React, { useState, useEffect, useContext } from 'react';
import { Button, InputGroup, FormControl, Form } from 'react-bootstrap';

import styles from "./component.module.css";

const ForgotStep = ({ setForm, formData, navigation }) => {
  const [validated, setValidated] = useState(false);

  const [inputs, setInputs] = useState({
    username: localStorage.getItem('username'),
    recoveryCode: undefined
  });

  const LogInStep = () => {
    navigation.go('LogInStep');
  }
  const accountSecurityStep = () => {
    navigation.go('AccountSecurityStep');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(inputs => ({ ...inputs, [name]: value }));

    setValidated(false);
  }

  const handleSubmit = (event) => {
    const form = event.currentTarget;

    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    setValidated(true);

    if (inputs.recoveryCode) {
      accountSecurityStep();
    }
  }

  return (
    <>
      <center>
        <h2>Forgot Your Security Key?</h2>
        <label>Enter a recovery code to continue.</label>
      </center>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">Recovery Code</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            name="recoveryCode"
            placeholder="Enter Recovery Code"
            aria-label="Recovery Code"
            aria-describedby="basic-addon1"
            type="password"
            onChange={handleChange}
            required
          />
          <Form.Control.Feedback type="invalid">
            Please provide a recover code.
          </Form.Control.Feedback>
        </InputGroup>
        <Button type="submit" variant="primary" block>Continue</Button>
      </Form>
      <div className="mt-5">
        <hr></hr>
      </div>
      <div>
        <center><span onClick={LogInStep} className="btn-link">Back to Log In</span></center>
      </div>
    </>
  );
};

export default ForgotStep;