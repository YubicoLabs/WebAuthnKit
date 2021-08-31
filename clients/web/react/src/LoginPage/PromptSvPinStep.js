import React, { useState, useEffect, useContext } from 'react';
import { Button, InputGroup, FormControl, Form } from 'react-bootstrap';
import validate from 'validate.js';

import styles from "../_components/component.module.css";

const PromptSvPinStep = ({ setForm, formData, navigation }) => {
  const [validated, setValidated] = useState(false);

  var constraints = {
    pin: {
      presence: true,
      numericality: {
        onlyInteger: true,
        greaterThan: -1,
      },
      length: {
        minimum: 4,
        maximum: 16
      }
    }
  };

  const [inputs, setInputs] = useState({
    username: localStorage.getItem('username'),
    pin: ''
  });

  const [errors, setErrors] = useState({
    pin: ''
  });

  const LogInStep = () => {
    navigation.go('LogInStep');
  }
  const registerTrustedDeviceStep = () => {
    navigation.go('RegisterTrustedDeviceStep');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(inputs => ({ ...inputs, [name]: value }));

    setValidated(false);

    const result = validate(inputs, constraints);
    if (result) {
      if (result[name]) {
        setErrors(errors => ({ ...errors, [name]: result[name].join(". ") }));
      } else {
        setErrors(errors => ({ ...errors, [name]: undefined }));
      }
    } else {
      setErrors(errors => ({ ...errors, [name]: undefined }));
    }
  }

  const handleSubmit = (event) => {
    const form = event.currentTarget;

    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    setValidated(true);

    if (isInputValid()) {
      registerTrustedDeviceStep();
    }
  }

  const isInputValid = () => {
    if (validate(inputs, constraints)) {
      return false;
    }
    return true;
  }

  return (
    <>
      <center>
        <h2>Welcome</h2>
        <label>Log in to the WebAuthn Starter Kit to continue</label>
      </center>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">Server Verified PIN</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            name="pin"
            placeholder="PIN"
            aria-label="PIN"
            aria-describedby="basic-addon1"
            type="password"
            onChange={handleChange}
            isInvalid={!isInputValid()}
            isValid={isInputValid()}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.pin}
          </Form.Control.Feedback>
        </InputGroup>
        <Button type="submit" variant="primary" block>Continue</Button>
      </Form>
      <div className="mt-5">
        <hr></hr>
      </div>
      <div>
        <center><span onClick={LogInStep} className="btn-link">Try Another Method</span></center>
      </div>
    </>
  );
};

export default PromptSvPinStep;