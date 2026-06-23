import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Spinner } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { get } from "@github/webauthn-json";
import axios from "axios";

import { alertActions } from "../_actions";
import { history } from "../_helpers";
import aws_exports from "../aws-exports";

axios.defaults.baseURL = aws_exports.apiEndpoint;

function isMediationAvailable() {
  const pubKeyCred = window.PublicKeyCredential as any;
  if (
    pubKeyCred &&
    typeof pubKeyCred.isConditionalMediationAvailable === "function" &&
    pubKeyCred.isConditionalMediationAvailable()
  ) {
    return true;
  }
  return false;
}

const PasskeyLoginPage = function () {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const defaultInvalidPIN = -1;

  const passkeySignIn = useCallback(async () => {
    try {
      const response = await axios.get(
        "/users/credentials/fido2/authenticate"
      );
      const requestOptions = response.data;

      const assertionResponse = await get({
        publicKey: requestOptions.publicKeyCredentialRequestOptions,
        mediation: "conditional" as any,
      });

      setLoading(true);

      const userHandle = assertionResponse.response.userHandle;
      const challengeResponse = {
        credential: assertionResponse,
        requestId: requestOptions.requestId,
        pinCode: defaultInvalidPIN,
      };

      const cognitoUser = await Auth.signIn(userHandle);

      if (
        cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
        cognitoUser.challengeParam?.type === "webauthn.get"
      ) {
        await Auth.sendCustomChallengeAnswer(
          cognitoUser,
          JSON.stringify(challengeResponse)
        );
        const session = await Auth.currentSession();
        dispatch(alertActions.success("Authentication successful"));
        const userData = {
          id: 1,
          username: cognitoUser.username || userHandle,
          token: session.getAccessToken().getJwtToken(),
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setLoading(false);
        history.push("/");
      } else {
        setLoading(false);
        dispatch(alertActions.error("Unexpected server response"));
      }
    } catch (err) {
      setLoading(false);
      console.error("Passkey sign-in error:", err);
      dispatch(alertActions.error(err.message || "Passkey sign-in failed"));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isMediationAvailable()) {
      history.push("/login");
      return;
    }
    passkeySignIn();
  }, [passkeySignIn]);

  return (
    <>
      <h2>Login with Passkey</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          id="username-field"
          autoComplete="username webauthn"
          style={{ width: "100%" }}
          className="form-control"
          placeholder="Select a passkey..."
        />
      </form>
      <br />
      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" />
          <h4>Authenticating...</h4>
        </div>
      )}
      <div className="text-center">
        <span>Don't see a passkey? </span>
        <label
          onClick={() => history.push("/login")}
          className="btn btn-link"
        >
          Login another way
        </label>
      </div>
      <div className="text-center">
        <span>Don't have an account? </span>
        <label
          onClick={() => history.push("/register")}
          className="btn btn-link"
        >
          Sign Up
        </label>
      </div>
    </>
  );
};

export default PasskeyLoginPage;
