import React, { useState, useEffect } from "react";
import { Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";

import base64url from "base64url";
import validate from "validate.js";
import { WebAuthnClient } from "../_components";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";
import { history } from "../_helpers";
import { credentialActions, alertActions } from "../_actions";

import styles from "../_components/component.module.css";

const LogInStep = function ({ navigation }) {
  const [inputs, setInputs] = useState({
    username: localStorage.getItem("username"),
    forgotStep: false,
    continue: false,
  });
  const [errors, setErrors] = useState({
    username: "",
  });
  const [validated, setValidated] = useState(false);
  const webAuthnStartResponse = useSelector(
    (state) => state.authentication.webAuthnStartResponse
  );
  const [continueSubmitted, setContinueSubmitted] = useState(false);
  const [serverVerifiedPin, setServerVerifiedPin] = useState();

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

  const dispatch = useDispatch();

  useEffect(() => {
    if (webAuthnStartResponse) {
      signInWithoutUsername();
    }
  }, [webAuthnStartResponse]);

  function getUV(authenticatorData) {
    const buffer = base64url.toBuffer(authenticatorData);

    const flagsBuf = buffer.slice(32, 33);
    const flagsInt = flagsBuf[0];
    const flags = {
      up: !!(flagsInt & 0x01),
      uv: !!(flagsInt & 0x04),
      at: !!(flagsInt & 0x40),
      ed: !!(flagsInt & 0x80),
      flagsInt,
    };
    return flags.uv;
  }

  const UVPromise = () => {
    return new Promise((resolve, reject) => {
      const svpinCreateProps = {
        type: "dispatch",
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

  async function signIn(username) {
    console.log("LoginStep Signing In User, ", username);

    try {
      const userData = await WebAuthnClient.signIn(username, uv);
      console.log("LogInStep signin userData: ", userData);

      if (userData === undefined) {
        console.log("LogInStep error: userData undefined");
        dispatch(alertActions.error("Something went wrong. Please try again."));
      } else {
        dispatch(alertActions.success("Login Successful"));
        localStorage.setItem("credential", JSON.stringify(userData.credential));
        console.log("LogInStep Successful credential ", userData.credential);
      }
    } catch (error) {
      console.log("LoginStep signin error");
      console.log(error);
      dispatch(alertActions.error(error.message));
    }
  }

  function registerTrustedDeviceOrContinue(path) {
    const trustedDevice = localStorage.getItem("trustedDevice");
    console.log("trustedDevice=", trustedDevice);

    if (trustedDevice === null) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(function (available) {
          if (available) {
            registerTrustedDeviceStep();
          } else {
            history.push(path);
          }
        })
        .catch(function (err) {
          console.error(err);
          history.push(path);
        });
    } else {
      history.push(path);
    }
  }

  const promptSvPinStep = () => {
    navigation.go("PromptSvPinStep");
  };
  const registerTrustedDeviceStep = () => {
    navigation.go("RegisterTrustedDeviceStep");
  };
  const signUpStep = () => {
    history.push("/register");
  };
  const forgotStep = () => {
    navigation.go("ForgotStep");
  };
  const accountSecurityStep = () => {
    // signIn();
  };

  const forgotClickHandler = () => {
    setInputs((inputs) => ({ ...inputs, continue: false }));
    setInputs((inputs) => ({ ...inputs, forgotStep: true }));
  };

  const continueClickHandler = () => {
    setInputs((inputs) => ({ ...inputs, continue: true }));
    setInputs((inputs) => ({ ...inputs, forgotStep: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));

    setValidated(false);

    const result = validate({ username: value }, constraints);
    if (result) {
      setErrors((errors) => ({
        ...errors,
        [name]: result.username.join(". "),
      }));
    } else {
      setErrors((errors) => ({ ...errors, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    const form = event.currentTarget;

    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    if (isUsernameValid()) {
      setValidated(true);
      if (inputs.continue === true) {
        await signIn(inputs.username);
        registerTrustedDeviceOrContinue("/");
      } else if (inputs.forgotStep === true) {
        localStorage.setItem("username", inputs.username);
        forgotStep();
      }
    } else {
      setValidated(false);
    }
  };

  const isUsernameValid = () => {
    if (validate({ username: inputs.username }, constraints)) {
      return false;
    }
    return true;
  };

  return (
    <>
      <center>
        <h2>Welcome</h2>
        <label>Log in to the WebAuthn Starter Kit to continue</label>
      </center>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group>
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

        <Button
          type="submit"
          onClick={continueClickHandler}
          value="continue"
          variant="primary"
          block
          disabled={continueSubmitted}
        >
          {continueSubmitted && (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          )}
          Continue
        </Button>
        <Button
          type="submit"
          onClick={forgotClickHandler}
          variant="link"
          className="float-right"
        >
          Forgot Your Security Key?
        </Button>
        <br />
      </Form>
      <div className="mt-3">
        <span className={styles["text-divider"]}>OR</span>
      </div>
      <div>
        <Button
          onClick={accountSecurityStep}
          variant="secondary btn-block mt-3"
        >
          Continue with Trusted Device or Security Key
        </Button>
      </div>
      <div className="mt-5">
        <hr />
      </div>
      <div>
        <center>
          Don't have an account?{" "}
          <span onClick={signUpStep} className="btn-link">
            Sign Up
          </span>
        </center>
      </div>
      {serverVerifiedPin}
    </>
  );
};

export default LogInStep;
