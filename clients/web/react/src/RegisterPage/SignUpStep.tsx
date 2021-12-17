/* eslint-disable prettier/prettier */
import React, { useState, ReactElement } from "react";
import {
  Button,
  InputGroup,
  FormControl,
  Form,
  Spinner,
} from "react-bootstrap";
import { useDispatch } from "react-redux";

import validate from "validate.js";
import { history } from "../_helpers";
import { WebAuthnClient } from "../_components";
import { credentialActions, alertActions } from "../_actions";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";

const styles = require("../_components/component.module.css");

const SignUpStep = function ({ setForm, formData, navigation }) {
  const dispatch = useDispatch();
  const [serverVerifiedPin, setServerVerifiedPin] = useState<ReactElement>();

  const { username, pin, nickname, credential } = formData;

  const [errors, setErrors] = useState({
    username: "",
  });
  const [validated, setValidated] = useState(false);
  const [continueSubmitted, setContinueSubmitted] = useState(false);

  const constraints = {
    username: {
      presence: true,
      format: {
        pattern: "[a-z0-9_-]+",
        flags: "i",
        message: "can only contain a-z, 0-9, or _-",
      },
      length: {
        minimum: 3,
        maximum: 20,
      },
    },
  };

  const LogInStep = () => {
    history.push("/login");
  };

  async function register() {
    console.log("register");

    try {
      const options = ""; // default = no platform or cross-platform preference
      const userData = await WebAuthnClient.signUp(username, uv);
      console.log("SignUpStep register userData: ", userData);

      if (userData === undefined) {
        console.error("SignUpStep register error: userData undefined");
        dispatch(alertActions.error("Something went wrong. Please try again."));
      } else {
        dispatch(alertActions.success("Registration successful"));
        setForm({ target: { name: "credential", value: userData.credential } });
        registerKeySuccessStep(userData.credential);
      }
    } catch (err) {
      console.error("SignUpStep register error");
      console.error(err);
      dispatch(alertActions.error(err.message));
    }
  }

  const UVPromise = (): Promise<{ value: number }> => {
    return new Promise((resolve, reject) => {
      const svpinCreateProps = {
        type: "create",
        saveCallback: resolve,
        closeCallback: reject,
      };
      console.log("SignUpStep UVPromise(): ", svpinCreateProps);
      setServerVerifiedPin(<ServerVerifiedPin {...svpinCreateProps} />);
    });
  };

  async function uv(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    console.log("SignUpStep PIN Result: ", pinResult.value);
    return pinResult.value;
  }

  const registerKeySuccessStep = (credential) => {
    localStorage.setItem("credential", JSON.stringify(credential));
    console.log("registerKeySuccessStep credential ", credential);
    window.location.reload();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(e);

    const result = validate({ username: value }, constraints);
    if (result) {
      setErrors((errors) => ({
        ...errors,
        [name]: result.username.join(". "),
      }));
      setValidated(false);
    } else {
      setErrors((errors) => ({ ...errors, [name]: undefined }));
      setValidated(true);
    }
  };

  const handleSubmit = async (event) => {
    const form = event.currentTarget;

    event.preventDefault();

    setValidated(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    if (isUsernameValid()) {
      setContinueSubmitted(true);
      await register();
      setContinueSubmitted(false);
      const hasCred = localStorage.getItem("credential");
      if (hasCred) {
        history.push("/");
      }
    }
  };

  const isUsernameValid = () => {
    if (validate({ username }, constraints)) {
      return false;
    }
    return true;
  };

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>Welcome</h2>
        <label>Sign up to the WebAuthn Starter Kit to continue</label>
      </div>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group>
          <InputGroup hasValidation>
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              name="username"
              placeholder="Username"
              aria-label="Username"
              defaultValue={username}
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
        <div className={styles.default["textCenter"]}>
          <h4>Add Your Security Key</h4>
          <label>Security keys are the primary authentication factor</label>
        </div>
        <ol>
          <li>Make sure your Security Key is nearby</li>
          <li>Follow the steps in the browser</li>
          <li>Give your Security Key a nickname to easily identify it later</li>
        </ol>
        <Button
          type="submit"
          variant="primary btn-block mt-3"
          disabled={continueSubmitted}>
          {continueSubmitted && (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className={styles.default["loaderSpan"]}>
                Creating your account
              </span>
            </>
          )}
          {!continueSubmitted && <span>Continue</span>}
        </Button>
      </Form>
      <div className="mt-5">
        <hr />
      </div>
      <div>
        <div className={styles.default["textCenter"]}>
          Already have an account?{" "}
          <span onClick={LogInStep} className="btn-link">
            Log In
          </span>
        </div>
      </div>
      {serverVerifiedPin}
    </>
  );
};

export default SignUpStep;
