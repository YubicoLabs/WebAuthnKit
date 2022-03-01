import React, { useState, ReactElement } from "react";
import { Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useDispatch } from "react-redux";

import validate from "validate.js";
import { useTranslation } from "react-i18next";
import { WebAuthnClient } from "../_components";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";
import { history } from "../_helpers";
import { credentialActions, alertActions } from "../_actions";

const styles = require("../_components/component.module.css");

/**
 * Step used to login the user with a username
 * This component will also allow the user to transition to other auth steps if needed
 */
const LogInStep = function ({ navigation }) {
  const { t } = useTranslation();

  const [inputs, setInputs] = useState({
    username: localStorage.getItem("username"),
    forgotStep: false,
    continue: false,
  });

  const [errors, setErrors] = useState({
    username: "",
  });

  const [validated, setValidated] = useState(false);

  // Loading indicator for the Continue Button, used to prevent the user from making multiple registration requests
  const [continueSubmitted, setContinueSubmitted] = useState(false);

  // Loading indicator for the Usernameless Continue Button, used to prevent the user from making multiple registration requests
  const [usernamelessSubmitted, setUsernamelessSubmitted] = useState(false);

  const [serverVerifiedPin, setServerVerifiedPin] = useState<ReactElement>();

  // detects if the user has put any info in the username field, used to stop the red outline from occurring on initial load
  const [initialInput, setInitialInput] = useState(false);

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

  /**
   * If the key is a U2F key, then a SVPIN needs to be configured on key registration
   * This promise allows the ServerVerifiedPIN to be initialized by the WebAuthN component through a promise
   * This Step will configure the ServerVerifiedPIN components properties, and await for a Save response to be sent from the component
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
  const UVPromise = (): Promise<{ value: number }> => {
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

  /**
   * If the key is a U2F key, then a SVPIN needs to be configured on key registration
   * This promise allows the ServerVerifiedPIN to be initialized by the WebAuthN component through a promise
   * This Step will configure the ServerVerifiedPIN components properties, and await for a Save response to be sent from the component
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
  async function uv(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    console.log("SignUpStep PIN Result: ", pinResult.value);
    return pinResult.value;
  }

  /**
   * Primary logic of the sign in step
   * @param username Username input by the user - if usernameless then this will be undefined
   * If successful the user will proceed to the init user step
   */
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
        localStorage.setItem("username", userData.username);
        console.log("LogInStep Successful credential ", userData.credential);
        InitUserStep();
      }
    } catch (error) {
      console.log("LoginStep signin error");
      console.log(error);
      setUsernamelessSubmitted(false);
      setContinueSubmitted(false);
      dispatch(alertActions.error(error.message));
      if (error.code === "UserNotFoundException") {
        signUpStep();
      }
    }
  }

  /**
   * Routes the user to the Init User Step to set their credentials and Auth Tokens
   */
  const InitUserStep = () => {
    navigation.go("InitUserStep");
  };

  /**
   * Routes the user to the first step of the register step
   */
  const signUpStep = () => {
    history.push("/register");
  };

  /**
   * Routes the user to the step allowing them to log in with a recovery code
   */
  const forgotStep = () => {
    navigation.go("ForgotStep");
  };

  /**
   * Entry point to allow the user to login with a resident credential
   * Sends undefined to the WebAuthN component, logic to handle undefined is defined there
   */
  const usernamelessLogin = async () => {
    console.log("LoginStep, beginning usernamelessLogin");
    setUsernamelessSubmitted(true);
    await signIn(undefined);
  };

  /**
   * This method will prevent the user from moving to the recovery step if they haven't entered a valid username
   */
  const forgotClickHandler = () => {
    setInputs((inputs) => ({ ...inputs, continue: false }));
    setInputs((inputs) => ({ ...inputs, forgotStep: true }));
  };

  /**
   * This method will prevent the user from calling the sign in method if they haven't entered a valid username
   */
  const continueClickHandler = () => {
    setInputs((inputs) => ({ ...inputs, continue: true }));
    setInputs((inputs) => ({ ...inputs, forgotStep: false }));
  };

  /**
   * Used to validate if the username sent by the user follows the constraints set above
   * @param e Event sent by the button in the render code below
   */
  const handleChange = (e) => {
    if (!initialInput) {
      setInitialInput(true);
    }
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

  /**
   * Used to submit the request to the sign in method above
   * This method also locks the button to prevent multiple user triggered logins
   * @param event Event sent by the button in the render code below
   */
  const handleSubmit = async (event) => {
    const form = event.currentTarget;

    event.preventDefault();

    setValidated(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    if (isUsernameValid()) {
      if (inputs.continue === true) {
        setContinueSubmitted(true);
        await signIn(inputs.username);
      } else if (inputs.forgotStep === true) {
        localStorage.setItem("username", inputs.username);
        forgotStep();
      }
    } else {
      setErrors({ username: "Please enter your username" });
    }
  };

  /**
   * Used to validate if the username sent by the user follows the constraints set above
   * @returns true if the username is valid, false otherwise
   */
  const isUsernameValid = () => {
    if (validate({ username: inputs.username }, constraints)) {
      return false;
    }
    return true;
  };

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>{t("login.welcome")}</h2>
        <label>{t("login.instructions")}</label>
      </div>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group>
          <InputGroup hasValidation>
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
              isInvalid={!isUsernameValid() && initialInput}
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
                {t("login.primary-button-loading")}
              </span>
            </>
          )}
          {!continueSubmitted && <span>{t("login.primary-button")}</span>}
        </Button>
        <Button
          type="submit"
          onClick={forgotClickHandler}
          variant="link"
          className="float-right">
          {t("login.forgot-key")}
        </Button>
        <br />
      </Form>
      <div className="mt-3">
        <span className={styles.default["text-divider"]}>OR</span>
      </div>
      <div>
        <Button
          type="submit"
          onClick={usernamelessLogin}
          value="continue"
          variant="secondary btn-block mt-3"
          block
          disabled={usernamelessSubmitted}>
          {usernamelessSubmitted && (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className={styles.default["loaderSpan"]}>
                {t("login.trusted-device-button-loading")}
              </span>
            </>
          )}
          {!usernamelessSubmitted && (
            <span>{t("login.trusted-device-button")}</span>
          )}
        </Button>
      </div>
      <div className="mt-5">
        <hr />
      </div>
      <div>
        <div className={styles.default["textCenter"]}>
          Don't have an account?{" "}
          <span onClick={signUpStep} className="btn-link">
            Sign Up
          </span>
        </div>
      </div>
      {serverVerifiedPin}
    </>
  );
};

export default LogInStep;
