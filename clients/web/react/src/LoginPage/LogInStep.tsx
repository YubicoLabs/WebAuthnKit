import React, { useState, ReactElement, useEffect, useCallback } from "react";
import { Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useDispatch } from "react-redux";

import validate from "validate.js";
import { useTranslation } from "react-i18next";
import { WebAuthnClient } from "../_components";
import U2FPassword from "../_components/u2fPassword/u2fPassword";
import { history } from "../_helpers";
import { credentialActions, alertActions } from "../_actions";
import { Auth } from "aws-amplify";
import { get } from "@github/webauthn-json";

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

  const [u2fPassword, setu2fPassword] = useState<ReactElement>();

  // detects if the user has put any info in the username field, used to stop the red outline from occurring on initial load
  const [initialInput, setInitialInput] = useState(false);

  //Used to determine if a autofill menu should be used in the input
  const [autoComplete, setAC] = useState("");

  const [authAbortController, setAuthAbortController] = useState(
    new AbortController()
  );

  //const authAbortController = new AbortController();
  //const authAbortSignal = authAbortController.signal;

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
   * If the key is a U2F key, then a U2F Password needs to be configured on key registration
   * This promise allows the U2F Password to be initialized by the WebAuthN component through a promise
   * This Step will configure the U2F Password components properties, and await for a Save response to be sent from the component
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
  const UVPromise = (): Promise<{ value: number }> => {
    return new Promise((resolve, reject) => {
      const u2fPassCreateProps = {
        type: "dispatch",
        saveCallback: resolve,
        closeCallback: reject,
      };
      setu2fPassword(<U2FPassword {...u2fPassCreateProps} />);
    });
  };

  /**
   * If the key is a U2F key, then a U2F Password needs to be configured on key registration
   * This promise allows the U2F Password to be initialized by the WebAuthn component through a promise
   * This Step will configure the U2F Password components properties, and await for a Save response to be sent from the component
   * @returns A promise containing the U2F Password to be used for registration in the WebAuthn component
   */
  async function uv(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    return pinResult.value;
  }

  /**
   * Primary logic of the sign in step
   * @param username Username input by the user - if usernameless then this will be undefined
   * If successful the user will proceed to the init user step
   */
  async function signIn(username) {
    // If autofill is currently running, end the process to make way for modal auth session
    if (mediationAvailable()) {
      authAbortController.abort();
    }

    console.info(
      t("console.info", {
        COMPONENT: "LoginStep",
        METHOD: "signIn()",
        LOG_REASON: t("console.reason.loginStep0"),
      }),
      username
    );

    try {
      const userData = await WebAuthnClient.signIn(username, uv);
      console.info(
        t("console.info", {
          COMPONENT: "LoginStep",
          METHOD: "signIn()",
          LOG_REASON: t("console.reason.loginStep1"),
        }),
        userData
      );

      if (userData === undefined) {
        console.info(
          t("console.info", {
            COMPONENT: "LoginStep",
            METHOD: "signIn()",
            LOG_REASON: t("console.reason.loginStep2"),
          })
        );
        dispatch(alertActions.error(t("alerts.something-went-wrong")));
      } else {
        dispatch(alertActions.success(t("alerts.login-successful")));
        localStorage.setItem("credential", JSON.stringify(userData.credential));
        localStorage.setItem("username", userData.username);
        console.info(
          t("console.info", {
            COMPONENT: "LoginStep",
            METHOD: "signIn()",
            LOG_REASON: t("console.reason.loginStep3"),
          }),
          userData.credential
        );
        InitUserStep();
      }
    } catch (error) {
      console.error(
        t("console.error", {
          COMPONENT: "LoginStep",
          METHOD: "signIn()",
          REASON: t("console.reason.loginStep4"),
        }),
        error
      );

      setUsernamelessSubmitted(false);
      setContinueSubmitted(false);
      dispatch(alertActions.error(error.message));
      if (error.code === "UserNotFoundException") {
        signUpStep();
      }

      if (mediationAvailable()) {
        // Create a new abortcontroller, signaling that new autofill ceremony should be invoked
        setAuthAbortController(new AbortController());
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
  const signUpStep = async () => {
    // You only need to kill the autofill process if mediation is available
    if (mediationAvailable()) {
      // The active webauthn ceremony needs to be aborted, otherwise the registration ceremony cannot be invoked
      authAbortController.abort();
    }
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
    console.info(
      t("console.info", {
        COMPONENT: "LoginStep",
        METHOD: "signIn()",
        LOG_REASON: t("console.reason.loginStep5"),
      })
    );
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

  /**
   * Method to determine if conditional mediation (autofill) is available on the browser
   * This method will be used in multiple flows on this page to determine if actions should be taken
   * to trigger an autofill flow, or abort an existing practice
   * @returns True if autofill is available, false otherwise
   */
  const mediationAvailable = () => {
    // Need to add any as the used version of TS does not include isConditionalMediationAvailable
    const pubKeyCred: any = PublicKeyCredential;
    // Check if the function exists on the browser - Not safe to assume as the page will crash if the function is not available
    //typeof check is used as browsers that do not support mediation will not have the 'isConditionalMediationAvailable' method available
    if (
      typeof pubKeyCred.isConditionalMediationAvailable === "function" &&
      pubKeyCred.isConditionalMediationAvailable()
    ) {
      return true;
    }
    return false;
  };

  /**
   * Sign in flow that utilizes the conditional mediation flow of the get() method
   */
  const passkeySignIn = useCallback(async (authAbortControllerValue) => {
    try {
      // Reaching out to Cognito for auth challenge
      let requestOptions = await WebAuthnClient.getPublicKeyRequestOptions();
      setAC("username webuathn");
      console.log("Printing response from Cognito: ", requestOptions);

      const credential = await get({
        publicKey: requestOptions.publicKeyCredentialRequestOptions,
        // @ts-ignore
        mediation: "conditional",
        signal: authAbortControllerValue.signal,
      });
      setUsernamelessSubmitted(true);
      setContinueSubmitted(true);

      console.log("Credential found for: ", credential.response.userHandle);
      const name = credential.response.userHandle;
      const cognitoUser = await Auth.signIn(name);
      console.log("cognitoUser: ", cognitoUser);

      const challengeResponse = {
        credential: credential,
        requestId: requestOptions.requestId,
        pinCode: "-1",
      };
      const userData = await WebAuthnClient.sendChallengeAnswer(
        cognitoUser,
        challengeResponse,
        "-1"
      );
      console.log(userData);
      setUsernamelessSubmitted(false);
      setContinueSubmitted(false);
      navigation.go("InitUserStep");
    } catch (error) {
      console.error(error);
    }
  }, []);

  /**
   * On initial page load, attempt to see if autofill is available
   * If available, begin a conditional mediation WebAuthn call
   */
  useEffect(() => {
    if (mediationAvailable()) {
      console.log("Allowing for mediation request to process");
      setAC("");
      passkeySignIn(authAbortController).catch(console.error);
    }
  }, [passkeySignIn]);

  /**
   * Attempt to retrigger the passkeysignin method if a new abort controller was created
   */
  useEffect(() => {
    if (mediationAvailable() && authAbortController.signal.aborted === false) {
      passkeySignIn(authAbortController).catch(console.error);
    }
  }, [authAbortController]);

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
              autoComplete="username webauthn"
            />
            {/**Chrome has a requirement that a password field be present, will remove once it's no longer needed**/}
            <input
              id="password"
              value=""
              required
              type="password"
              autoComplete="current-password webauthn"
              hidden></input>
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
      {u2fPassword}
    </>
  );
};

export default LogInStep;
