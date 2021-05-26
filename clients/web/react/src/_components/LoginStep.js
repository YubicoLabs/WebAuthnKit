import React, { useState, useEffect, useContext } from 'react';
import { Button, InputGroup, Form } from 'react-bootstrap';
import validate from 'validate.js';

import styles from "./component.module.css";

const LogInStep = ({ navigation }) => {
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

    const promptSvPinStep = () => {
        navigation.go('PromptSvPinStep');
    }
    const signUpStep = () => {
        navigation.go('SignUpStep');
    }
    const forgotStep = () => {
        navigation.go('ForgotStep');
    }
    const accountSecurityStep = () => {
        navigation.go('AccountSecurityStep');
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(inputs => ({ ...inputs, [name]: value }));

        setValidated(false);

        const result = validate({ username: value }, constraints);
        if (result) {
            setErrors(errors => ({ ...errors, [name]: result.username.join(". ") }));
            return;
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

        if(isUsernameValid()) {
            setValidated(true);
            promptSvPinStep();
        } else {
            setValidated(false);
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
                    <label>Log in to the WebAuthn Starter Kit to continue</label>
                </center>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group >
                        <InputGroup mb="3" hasValidation>
                            <InputGroup.Prepend>
                                <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                            </InputGroup.Prepend>
                            <Form.Control
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
                    <div onClick={forgotStep} className="btn-link mt-2 text-right">Forgot Your Security Key?</div>
                    <Button type="submit" variant="primary btn-block mt-3">Continue</Button>
                </Form>
                <div className="mt-3">
                    <span className={styles['text-divider']}>OR</span>
                </div>
                <div>
                    <Button onClick={accountSecurityStep} variant="secondary btn-block mt-3">Continue with Trusted Device or Security Key</Button>
                </div>
                <div className="mt-5">
                    <hr></hr>
                </div>
                <div>
                    <center>Don't have an account? <span onClick={signUpStep} className="btn-link">Sign Up</span></center>
                </div>
        </>
    );
};

export default LogInStep;