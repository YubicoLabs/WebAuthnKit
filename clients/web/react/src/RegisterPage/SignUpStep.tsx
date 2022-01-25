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
  const dispatch = useDispatch();
  const [serverVerifiedPin, setServerVerifiedPin] = useState<ReactElement>();
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
    console.log("register");

    try {
      const userData = await WebAuthnClient.signUp(username, uv, webKitMethod);
      console.log("SignUpStep register userData: ", userData);

      if (userData === undefined) {
        console.error("SignUpStep register error: userData undefined");
        dispatch(alertActions.error("Something went wrong. Please try again."));
      } else {
        dispatch(alertActions.success("Registration successful"));
        setForm({ target: { name: "credential", value: userData.credential } });
        registerKeySuccessStep(userData.credential);
        navigation.go("InitUserStep");
      }
    } catch (err) {
      console.error("SignUpStep register error");
      console.error(err);
      setContinueSubmitted(false);
      dispatch(alertActions.error(err.message));
      setHandleWebKit(null);
    }
  }

  /**
   * If the key is a U2F key, then a SVPIN needs to be configured on key registration
   * This promise allows the ServerVerifiedPIN to be initialized by the WebAuthN component through a promise
   * This Step will configure the ServerVerifiedPIN components properties, and await for a Save response to be sent from the component
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
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

  /**
   * If the key is a U2F key, then a SVPIN needs to be configured on key registration
   * This promise allows the ServerVerifiedPIN to be initialized by the WebAuthN component through a promise
   * This Step will configure the ServerVerifiedPIN components properties, and await for a Save response to be sent from the component
   * @param challengeResponse sent from WebAuthN component that is used to dispatch the event to start PIN registration
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
  async function uv(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    console.log("SignUpStep PIN Result: ", pinResult.value);
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
      console.log("SignUpStep WebKitPromise(): ", handleWebKitProps);
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
    console.log("SignUpStep webKitMethod Result: ", attestationResponse);
    return attestationResponse;
  }

  /**
   * If successful this will set the credential in local storage to the credential used for registration
   * @param userCredential
   */
  const registerKeySuccessStep = (userCredential) => {
    localStorage.setItem("credential", JSON.stringify(userCredential));
    console.log("registerKeySuccessStep credential ", userCredential);
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
      {handleWebKit}
    </>
  );
};

export default SignUpStep;
