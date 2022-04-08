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
import { useTranslation } from "react-i18next";
import { history } from "../_helpers";
import { WebAuthnClient } from "../_components";
import { credentialActions, alertActions } from "../_actions";
import U2FPassword from "../_components/u2fPassword/u2fPassword";
import HandleWebKit from "../_components/HandleWebkit/HandleWebkit";

const styles = require("../_components/component.module.css");

/**
 * Step for the user to begin the registration process
 * First the user will enter in a valid username
 * This page will then use the WebAuthN Component to perform the sign up steps configured in the backend
 * @param param0
 * @returns
 */
const SignUpStep = function ({ setForm, formData, navigation }) {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const [u2fPassword, setu2fPassword] = useState<ReactElement>();

  const [handleWebKit, setHandleWebKit] = useState<ReactElement>();

  const { username, pin, nickname, credential } = formData;

  const [errors, setErrors] = useState({
    username: "",
  });

  const [validated, setValidated] = useState(false);

  // Loading indicator for the Continue Button, used to prevent the user from making multiple registration requests
  const [continueSubmitted, setContinueSubmitted] = useState(false);

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

  /**
   * Allows the user to return to the login page
   */
  const LogInStep = () => {
    history.push("/login");
  };

  /**
   * Primary logic of the register step
   */
  async function register() {
    console.info(
      t("console.info", {
        COMPONENT: "SignUpStep",
        METHOD: "register",
        LOG_REASON: t("console.reason.signUp0"),
      })
    );

    try {
      const userData = await WebAuthnClient.signUp(username, uv, webKitMethod);
      console.info(
        t("console.info", {
          COMPONENT: "SignUpStep",
          METHOD: "register",
          LOG_REASON: t("console.reason.signUp1"),
        }),
        userData
      );

      if (userData === undefined) {
        console.error(
          t("console.error", {
            COMPONENT: "SignUpStep",
            METHOD: "register",
            REASON: t("console.reason.signUp2"),
          })
        );
        dispatch(alertActions.error(t("alerts.something-went-wrong")));
      } else {
        dispatch(alertActions.success(t("alerts.registration-successful")));
        setForm({ target: { name: "credential", value: userData.credential } });
        registerKeySuccessStep(userData.credential);
        navigation.go("InitUserStep");
      }
    } catch (err) {
      console.error(
        t("console.error", {
          COMPONENT: "SignUpStep",
          METHOD: "register",
          REASON: t("console.reason.signUp3"),
        }),
        err
      );
      setContinueSubmitted(false);
      dispatch(alertActions.error(err.message));
      setHandleWebKit(null);
    }
  }

  /**
   * If the key is a U2F key, then a U2F Password needs to be configured on key registration
   * This promise allows the U2F Password to be initialized by the WebAuthn component through a promise
   * This Step will configure the U2F Password components properties, and await for a Save response to be sent from the component
   * @returns A promise containing the U2F Password to be used for registration in the WebAuthN component
   */
  const UVPromise = (): Promise<{ value: number }> => {
    return new Promise((resolve, reject) => {
      const u2fPassCreateProps = {
        type: "create",
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
   * @param challengeResponse sent from WebAuthN component that is used to dispatch the event to start U2F Password registration
   * @returns A promise containing the U2F Password to be used for registration in the WebAuthN component
   */
  async function uv(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    return pinResult.value;
  }

  /**
   * WebKit (Safari on Mac and iOS) do not allow for seamless registration of new keys
   * Safari will require a "user gesture" to allow for the use of the create credential api
   * This will initialize a HandleWebKit component to provide a button for users to press to correctly trigger a user gesture
   * @param type macos | ios - The component has different display details depending on the platform
   * @param publicKey publicKey sent as initial challenge - Needed to call the create() api
   * @returns Promise with the attestationResponse required to complete initial user registration
   */
  const WebKitPromise = (
    type,
    publicKey
  ): Promise<{ attestationResponse: any }> => {
    return new Promise((resolve, reject) => {
      const handleWebKitProps = {
        type,
        publicKey,
        saveCallback: resolve,
        closeCallback: reject,
      };
      setHandleWebKit(<HandleWebKit {...handleWebKitProps} />);
    });
  };

  /**
   * WebKit (Safari on Mac and iOS) do not allow for seamless registration of new keys
   * Safari will require a "user gesture" to allow for the use of the create credential api
   * This will initialize a HandleWebKit component to provide a button for users to press to correctly trigger a user gesture
   * @param type macos | ios - The component has different display details depending on the platform
   * @param publicKey publicKey sent as initial challenge - Needed to call the create() api
   * @returns Promise with the attestationResponse required to complete initial user registration
   */
  async function webKitMethod(type, publicKey) {
    const attestationResponse = await WebKitPromise(type, publicKey);
    return attestationResponse;
  }

  /**
   * If successful this will set the credential in local storage to the credential used for registration
   * @param userCredential
   */
  const registerKeySuccessStep = (userCredential) => {
    localStorage.setItem("credential", JSON.stringify(userCredential));
    console.info(
      t("console.info", {
        COMPONENT: "SignUpStep",
        METHOD: "registerKeySuccessStep",
        REASON: t("console.reason.signUp4"),
      }),
      userCredential
    );
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
    setForm(e);

    const result = validate({ username: value }, constraints);
    if (result) {
      setErrors((errorList) => ({
        ...errorList,
        [name]: result.username.join(". "),
      }));
      setValidated(false);
    } else {
      setErrors((errorList) => ({ ...errorList, [name]: undefined }));
      setValidated(true);
    }
  };

  /**
   * Used to submit the request to the register method above
   * This method also locks the button to prevent multiple user triggered registrations
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
      setContinueSubmitted(true);
      await register();
    }
  };

  /**
   * Used to validate if the username sent by the user follows the constraints set above
   * @returns true if the username is valid, false otherwise
   */
  const isUsernameValid = () => {
    if (validate({ username }, constraints)) {
      return false;
    }
    return true;
  };

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>{t("registration.welcome")}</h2>
        <label>{t("registration.instructions")}</label>
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
              isInvalid={!isUsernameValid() && initialInput}
              isValid={isUsernameValid()}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.username}
            </Form.Control.Feedback>
          </InputGroup>
        </Form.Group>
        <div className={styles.default["textCenter"]}>
          <h4>{t("registration.add-key")}</h4>
          <label>{t("registration.add-key-prompt")}</label>
        </div>
        <ol>
          <li>{t("registration.add-key-1")}</li>
          <li>{t("registration.add-key-2")}</li>
          <li>{t("registration.add-key-3")}</li>
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
                {t("registration.primary-button-loading")}
              </span>
            </>
          )}
          {!continueSubmitted && (
            <span>{t("registration.primary-button")}</span>
          )}
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
      {u2fPassword}
      {handleWebKit}
    </>
  );
};

export default SignUpStep;
