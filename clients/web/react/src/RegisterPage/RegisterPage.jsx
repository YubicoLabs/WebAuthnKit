import React, { useState, useEffect, useRef } from "react";
import { Link, useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Row, Col } from "react-bootstrap";

import { create, supported } from "@github/webauthn-json";
import base64url from "base64url";
import cbor from "cbor";
import { Auth } from "aws-amplify";
import { ServerVerifiedPin } from "../_components";
import { userActions, credentialActions, alertActions } from "../_actions";

const RegisterPage = function () {
  const username = localStorage.getItem("username");
  const [submitted, setSubmitted] = useState(false);
  const signInResult = useSelector(
    (state) => state.authentication.signInResult
  );
  const history = useHistory();
  const [cognitoUser, setCognitoUser] = useState({});
  const defaultInvalidPIN = -1;
  const dispatch = useDispatch();

  // reset login status
  useEffect(() => {
    dispatch(userActions.logout());
    console.log("signInResult: ", signInResult);
    return () => {
      if (history.action === "POP") {
        // Code here will run when back button fires. Note that it's after the `return` for useEffect's callback; code before the return will fire after the page mounts, code after when it is about to unmount.
        dispatch(credentialActions.completeUV());
      }
    };
  }, []);

  async function handleWebAuthn(e) {
    if (submitted === true) {
      // do nothing, we are in the middle of the registration ceremony
      return;
    }

    setSubmitted(true);

    e.preventDefault();

    console.log("signInResult: ", signInResult);

    // start Registration
    const randomString = (length) =>
      [...Array(length)]
        .map(() => Math.floor(Math.random() * 36).toString(36))
        .join("");
    const password = randomString(14);
    const usernameLower = username.toLowerCase();
    const attributes = { name: usernameLower };

    try {
      const { user } = await Auth.signUp({
        username,
        password,
        attributes,
      });
      console.log("SignUp: ", user);
    } catch (error) {
      // A user can get here if they come back to register after the initial registration was interrupted
      console.log(error);
    }

    try {
      const cognitoUser = await Auth.signIn(username);
      setCognitoUser(cognitoUser);
      console.log("SignIn CognitoUser: ", cognitoUser);

      if (
        cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
        cognitoUser.challengeParam.type === "webauthn.get"
      ) {
        dispatch(
          alertActions.error("You have already registered. Please sign in.")
        );
        history.push("/login");
        return;
      }

      if (
        cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
        cognitoUser.challengeParam.type === "webauthn.create"
      ) {
        console.log(
          `registration request: ${JSON.stringify(
            cognitoUser.challengeParam,
            null,
            2
          )}`
        );

        const request = JSON.parse(
          cognitoUser.challengeParam.publicKeyCredentialCreationOptions
        );
        console.log("request: ", request);

        if (request.publicKeyCredentialCreationOptions === "error") {
          const error = "Error generating public key creation options";
          console.error(error);
          setSubmitted(false);
          dispatch(alertActions.error(error.toString()));
          return;
        }

        const publicKey = {
          publicKey: request.publicKeyCredentialCreationOptions,
        };
        console.log("publicKey, ", publicKey);

        const credential = await create(publicKey);

        console.log(`make credential response: ${JSON.stringify(credential)}`);

        const uv = getUV(credential.response.attestationObject);
        console.log(`uv: ${uv}`);

        const challengeResponse = {
          credential,
          requestId: request.requestId,
          pinCode: defaultInvalidPIN,
        };
        console.log("challengeResponse: ", challengeResponse);

        if (uv == false) {
          dispatch(credentialActions.getUV(challengeResponse));
        } else {
          console.log("sendCustomChallengeAnswer: ", cognitoUser);
          // to send the answer of the custom challenge
          const user = await Auth.sendCustomChallengeAnswer(
            cognitoUser,
            JSON.stringify(challengeResponse)
          )
            .then((user) => {
              console.log(user);

              Auth.currentSession()
                .then((data) => {
                  dispatch(alertActions.success("Registration successful"));
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
                  setSubmitted(false);
                });
            })
            .catch((err) => {
              console.log(err);
              setSubmitted(false);
              dispatch(alertActions.error(err.message));
            });
        }
      } else {
        const error = "Invalid challengeName and type";
        console.error(error);
        setSubmitted(false);
        dispatch(alertActions.error(error));
      }
    } catch (error) {
      console.error("signIn error");
      console.error(error);
      setSubmitted(false);
      dispatch(alertActions.error(error.toString()));
    }
  }

  function getUV(attestationObject) {
    const attestationBuffer = base64url.toBuffer(attestationObject);
    const attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
    const buffer = attestationStruct.authData;

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

  const WebAuthn = function () {
    if (!supported()) {
      return <div>This browser is not compatible with WebAuthn</div>;
    }

    return (
      <div>
        <form name="form" onSubmit={handleWebAuthn}>
          <div className="form-group">
            <button className="btn btn-primary">
              {submitted && (
                <span className="spinner-border spinner-border-sm mr-1" />
              )}
              Register Security Key
            </button>
          </div>
        </form>
      </div>
    );
  };

  const UV = function (props) {
    const { cognitoUser } = props;
    const finishUVRequest = useSelector(
      (state) => state.credentials.finishUVRequest
    );
    const svpinCreateProps = {
      type: "create",
      saveCallback: finishUVResponse,
      showSelector: finishUVRequest,
    };
    const registering = useSelector((state) => state.registration.registering);

    function finishUVResponse(fields) {
      if (registering) {
        console.log("Already sent the finish regisration request");
        return;
      }

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
          console.log("uv finishUVResponse sendCustomChallengeAnswer: ", user);

          Auth.currentSession()
            .then((data) => {
              dispatch(alertActions.success("Registration successful"));
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
              setSubmitted(false);
            });
        })
        .catch((err) => {
          console.log(
            "uv finishUVResponse sendCustomChallengeAnswer error: ",
            err
          );
          const message = "Invalid PIN";
          dispatch(alertActions.error(message));
          setSubmitted(false);
        });
      dispatch(credentialActions.completeUV());
    }

    return <ServerVerifiedPin {...svpinCreateProps} />;
  };

  return (
    <>
      <h2>Hello {username}</h2>
      <label>Welcome to the WebAuthn Start Kit.</label>
      <WebAuthn />
      <UV cognitoUser={cognitoUser} />
      <label>
        Please register a security key to finish setting up your account.
      </label>
      <Row>
        <Col>
          <Link to="/login" className="btn btn-link">
            Cancel
          </Link>
        </Col>
      </Row>
    </>
  );
};

export { RegisterPage };
