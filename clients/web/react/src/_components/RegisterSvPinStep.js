import React, { useState, useEffect, useContext } from 'react';
import { Button, InputGroup, FormControl, Form } from 'react-bootstrap';
import validate from 'validate.js';

import styles from "./component.module.css";

const RegisterSvPinStep = ({ setForm, formData, navigation }) => {
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
    },
    confirmPin: {
      equality: "pin"
    }
  };

  const [inputs, setInputs] = useState({
    username: localStorage.getItem('username'),
    pin: '',
    confirmPin: ''
  });

  const [errors, setErrors] = useState({
    pin: '',
    confirmPin: ''
  });

  const accountSecurityStep = () => {
    navigation.go('AccountSecurityStep');
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
      accountSecurityStep();
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
        <h2>Create your Server-Verified PIN</h2>
        <label>Your account requires a Server-Verified PIN. Treat this PIN like your account's password.</label>
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
            onChange={handleChange}
            isInvalid={!isInputValid()}
            isValid={isInputValid()}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.pin}
          </Form.Control.Feedback>
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">Confirm PIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            name="confirmPin"
            placeholder="PIN"
            aria-label="PIN"
            aria-describedby="basic-addon1"
            onChange={handleChange}
            isInvalid={!isInputValid()}
            isValid={isInputValid()}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.confirmPin}
          </Form.Control.Feedback>
        </InputGroup>
        <Button type="submit" variant="primary" block>Continue</Button>
      </Form>
    </>
  );
};

export default RegisterSvPinStep;