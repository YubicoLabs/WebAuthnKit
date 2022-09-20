import React, { useState, useEffect, useCallback } from "react";

import { WebAuthnClient } from "../_components";
import { history } from "../_helpers";
import { Auth } from "aws-amplify";
import { get, create } from "@github/webauthn-json";
import { Spinner } from "react-bootstrap";

const styles = require("../_components/component.module.css");

/**
 * Step used to login the user with the autofill mechanism from Apple devices for Passkeys
 */
const PasskeyLogin = function ({ navigation }) {
  const [autoComplete, setAC] = useState("");
  const [loading, setLoading] = useState(false);

  const mediationAvailable = () => {
    const pubKeyCred = PublicKeyCredential;
    // Check if the function exists on the browser - Not safe to assume as the page will crash if the function is not available
    //typeof check is used as browsers that do not support mediation will not have the 'isConditionalMediationAvailable' method available
    if (
      typeof pubKeyCred.isConditionalMediationAvailable === "function" &&
      pubKeyCred.isConditionalMediationAvailable()
    ) {
      console.log("Mediation is available");
      return true;
    }
    console.log("Mediation is not available");
    return false;
  };

  /**
   * Function meant to prevent the form below from triggering a page refresh on submit
   * @param event event triggered from the UI
   */
  const cO = (event) => {
    event.preventDefault();
  };

  const passkeySignIn = useCallback(async () => {
    console.log("In passkeySignIn");

    try {
      // Reaching out to Cognito for auth challenge
      let requestOptions = await WebAuthnClient.getPublicKeyRequestOptions();
      setAC("username webuathn");
      console.log("Printing response from Cognito: ", requestOptions);

      // Good news, webauthn-json still works with mediation (praise be for loose typing in JS)
      const credential = await get({
        publicKey: requestOptions.publicKeyCredentialRequestOptions,
        mediation: "conditional",
      });
      setLoading(true);

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
      setLoading(false);
      navigation.go("InitUserStep");
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    if (!mediationAvailable()) {
      history.push("/login");
    } else {
      setAC("");
      passkeySignIn().catch(console.error);
    }
  }, [passkeySignIn]);

  const signInStep = () => {
    history.push("/login");
  };

  const signUpStep = () => {
    history.push("/register");
  };

  return (
    <>
      <h3>Login with passkey</h3>
      <form onSubmit={cO}>
        <input type="text" id="username-field" autoComplete={autoComplete} />
        <br />
      </form>
      <br />
      {loading && (
        <div className={styles.default["textCenter"]}>
          <Spinner animation="border" role="status" variant="primary" />
          <h4>Authenticating</h4>
        </div>
      )}
      <div className={styles.default["textCenter"]}>
        Don't see a passkey?{" "}
        <span onClick={signInStep} className="btn-link">
          Login another way
        </span>
      </div>
      <div className={styles.default["textCenter"]}>
        Don't have an account?{" "}
        <span onClick={signUpStep} className="btn-link">
          Sign Up
        </span>
      </div>
    </>
  );
};

export default PasskeyLogin;
