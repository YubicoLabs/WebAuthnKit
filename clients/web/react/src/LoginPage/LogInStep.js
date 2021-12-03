import React, { useState, useEffect, useContext } from "react";
import { Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";

import { get, supported } from "@github/webauthn-json";
import base64url from "base64url";
import { Auth } from "aws-amplify";
import validate from "validate.js";
import { WebAuthnClient } from "../_components";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";
import { history } from "../_helpers";
import { userActions, credentialActions, alertActions } from "../_actions";

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
  const [cognitoUser, setCognitoUser] = useState({});
  const webAuthnStartResponse = useSelector(
    (state) => state.authentication.webAuthnStartResponse
  );
  const defaultInvalidPIN = -1;
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

  // reset login status
  /* useEffect(() => { 
        dispatch(userActions.logout()); 
        
        if(inputs.username) {
            signInWithUsername();
        } else {
            setContinueSubmitted(true);
            dispatch(userActions.webAuthnStart());
        }
        
    }, []); */

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

  /*
  async function signIn(name) {
    console.log("signIn ", name);
    setContinueSubmitted(true);

    const lowercaseName = name.toLocaleLowerCase();

    localStorage.setItem("username", lowercaseName);

    try {
      const cognitoUser = await Auth.signIn(lowercaseName);
      setCognitoUser(cognitoUser);
      console.log("SignIn CognitoUser: ", cognitoUser);

      if (
        cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
        cognitoUser.challengeParam.type === "webauthn.create"
      ) {
        dispatch(alertActions.error("Please Sign Up"));
        history.push("/register");
        return;
      }
      if (
        cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
        cognitoUser.challengeParam.type === "webauthn.get"
      ) {
        console.log(
          `assertion request: ${JSON.stringify(
            cognitoUser.challengeParam,
            null,
            2
          )}`
        );

        const request = JSON.parse(
          cognitoUser.challengeParam.publicKeyCredentialRequestOptions
        );
        console.log("request: ", request);

        const publicKey = {
          publicKey: request.publicKeyCredentialRequestOptions,
        };
        console.log("publicKey: ", publicKey);

        const assertionResponse = await get(publicKey);
        console.log(`assertion response: ${JSON.stringify(assertionResponse)}`);

        const uv = getUV(assertionResponse.response.authenticatorData);
        console.log(`uv: ${uv}`);

        const challengeResponse = {
          credential: assertionResponse,
          requestId: request.requestId,
          pinCode: defaultInvalidPIN,
        };
        console.log("challengeResponse: ", challengeResponse);

        if (uv == false) {
          dispatch(credentialActions.getUV(challengeResponse));
        } else {
          console.log("sending Custom Challenge Answer");
          // to send the answer of the custom challenge
          Auth.sendCustomChallengeAnswer(
            cognitoUser,
            JSON.stringify(challengeResponse)
          )
            .then((user) => {
              console.log(user);

              Auth.currentSession()
                .then((data) => {
                  dispatch(alertActions.success("Authentication successful"));
                  const userData = {
                    id: 1,
                    username: user.attributes.name,
                    token: data.getAccessToken().getJwtToken(),
                  };
                  localStorage.setItem("user", JSON.stringify(userData));
                  console.log("userData ", localStorage.getItem("user"));

                  registerTrustedDeviceOrContinue("/");
                })
                .catch((err) => {
                  console.error("currentSession error: ", err);
                  dispatch(
                    alertActions.error("Something went wrong. ", err.message)
                  );
                  setContinueSubmitted(false);
                });
            })
            .catch((err) => {
              console.error("sendCustomChallengeAnswer error: ", err);
              dispatch(alertActions.error(err.message));
            });
        }
      } else {
        setContinueSubmitted(false);
        dispatch(alertActions.error("Invalid server response"));
      }
    } catch (err) {
      console.error("signIn error");
      console.error(err);
      setContinueSubmitted(false);
      dispatch(alertActions.error(err.message));
    }
  }
  */

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
  /*
  const UV = function (props) {
    const { cognitoUser } = props;
    const finishUVRequest = useSelector(
      (state) => state.credentials.finishUVRequest
    );
    const svpinDispatchProps = {
      type: "dispatch",
      saveCallback: finishUVResponse,
      showSelector: finishUVRequest,
    };

    function finishUVResponse(fields) {
      const challengeResponse = finishUVRequest;
      console.log(
        "sending authenticator response with sv-pin: ",
        challengeResponse
      );
      challengeResponse.pinCode = parseInt(fields.pin);

      Auth.sendCustomChallengeAnswer(
        cognitoUser,
        JSON.stringify(challengeResponse)
      )
        .then((user) => {
          console.log("uv sendCustomChallengeAnswer: ", user);

          Auth.currentSession()
            .then((data) => {
              dispatch(alertActions.success("Authentication successful"));
              const userData = {
                id: 1,
                username: user.attributes.name,
                token: data.getAccessToken().getJwtToken(),
              };
              localStorage.setItem("user", JSON.stringify(userData));
              console.log("userData ", localStorage.getItem("user"));
              history.push("/");
            })
            .catch((err) => {
              console.log("currentSession error: ", err);
              dispatch(
                alertActions.error("Something went wrong. ", err.message)
              );
              setContinueSubmitted(false);
            });
        })
        .catch((err) => {
          console.log("sendCustomChallengeAnswer error: ", err);
          const message = "Invalid PIN";
          dispatch(alertActions.error(message));
          setContinueSubmitted(false);
        });
      dispatch(credentialActions.completeUV());
    }

    return <ServerVerifiedPin {...svpinDispatchProps} />;
  };
*/
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
        history.push("/");
      } else if (inputs.forgotStep === true) {
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
