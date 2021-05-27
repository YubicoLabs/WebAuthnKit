import React, { useState, useEffect, useContext } from 'react';
import { Button, InputGroup, FormControl, Form } from 'react-bootstrap';
import validate from 'validate.js';

import styles from "./component.module.css";

const SignUpStep = ({ setForm, formData, navigation }) => {

  const [inputs, setInputs] = useState({
    username: localStorage.getItem('username')
  });
  const [errors, setErrors] = useState({
    username: ''
  });
  const [validated, setValidated] = useState(false);

  const constraints = {
    username: {
      presence: true,
      format: {
        pattern: "[a-z0-9_\-]+",
        flags: "i",
        message: "can only contain a-z, 0-9, or _-"
      },
      length: {
        minimum: 3,
        maximum: 20
      }
    }
  };

  const LogInStep = (step) => {
    navigation.go('LogInStep');
  }
  const registerKeySuccessStep = (step) => {
    navigation.go('RegisterKeySuccessStep');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(inputs => ({ ...inputs, [name]: value }));

    const result = validate({ username: value }, constraints);
    if (result) {
      setErrors(errors => ({ ...errors, [name]: result.username.join(". ") }));
      setValidated(false);
      return;
    } else {
      setErrors(errors => ({ ...errors, [name]: undefined }));
      setValidated(true);
    }
  }

  const handleSubmit = (event) => {
    const form = event.currentTarget;

    event.preventDefault();

        setValidated(true);

        if (form.checkValidity() === false) {
            event.stopPropagation();
        }

        if(isUsernameValid()) {
          registerKeySuccessStep();
        }
  }

  const isUsernameValid = () => {
    if(validate({ username: inputs.username }, constraints)){
        return false;
    }
    return true;
}

  return (
    <>
        <center>
          <h2>Welcome</h2>
          <label>Sign up to the WebAuthn Starter Kit to continue</label>
        </center>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group >
            <InputGroup mb="3" hasValidation>
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                name="username"
                placeholder="Username"
                aria-label="Username"
                defaultValue={inputs.username}
                aria-describedby="basic-addon1"
                onChange={handleChange}
                isInvalid={!isUsernameValid()}
                isValid={isUsernameValid()}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <center>
            <h4>Add Your Security Key</h4>
            <label>Security keys are the primary authentication factor</label>
          </center>
          <ol>
            <li>Make sure your Security Key is nearby</li>
            <li>Follow the steps in the browser</li>
            <li>Give your Security Key a nickname to easily identify it later</li>
          </ol>
          <Button type="submit" variant="primary btn-block mt-3">Continue</Button>
        </Form>
        <div className="mt-5">
          <hr></hr>
        </div>
        <div>
          <center>Already have an account? <span onClick={LogInStep} className="btn-link">Log In</span></center>
        </div>
    </>
  );
};

export default SignUpStep;