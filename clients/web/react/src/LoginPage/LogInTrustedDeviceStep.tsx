import React, { useState, useEffect } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { Button, Spinner } from "react-bootstrap";

import { Auth } from "aws-amplify";
import { get } from "@github/webauthn-json";

import { userActions, alertActions } from "../_actions";
import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

function LogInTrustedDeviceStep({ navigation }) {
  // Loading indicator for the Continue Button, used to prevent the user from making multiple registration requests
  const [continueSubmitted, setContinueSubmitted] = useState(false);

  // Triggered to get some Start Response if the user is trying to login without a username
  const webAuthnStartResponse = useSelector(
    (state: RootStateOrAny) => state.authentication.webAuthnStartResponse
  );

  const defaultInvalidPIN = -1;
  const dispatch = useDispatch();

  useEffect(() => {
    if (webAuthnStartResponse) {
      signIn();
    }
  }, [webAuthnStartResponse]);

  /**
   * Route the user back to the default login step if they don't want a usernameless login
   */
  const LogInStep = () => {
    navigation.go("LogInStep");
  };

  /**
   * Once triggered by the user, send a dispatch to generate the webauthn start response
   */
  const continueStep = () => {
    dispatch(userActions.webAuthnStart());
  };

  /**
   * Once the starter response is set, begin the the user sign in
   */
  async function signIn() {
    try {
      setContinueSubmitted(true);
      await signInWithoutUsername();
      // setContinueSubmitted(false);
    } catch {
      setContinueSubmitted(false);
    }
  }

  /**
   * Call to the get() api to get the credentials based on the public key value in the starter response
   */
  async function signInWithoutUsername() {
    console.log("signInWithoutUsername");
    // get usernameless auth request
    console.log("webAuthnStartResponse: ", webAuthnStartResponse);

    const publicKey = {
      publicKey: webAuthnStartResponse.publicKeyCredentialRequestOptions,
    };
    console.log("publicKey: ", publicKey);

    const assertionResponse = await get(publicKey);
    console.log("assertionResponse: ", assertionResponse);

    // get username from assertionResponse
    const username = assertionResponse.response.userHandle;
    console.log("userhandle: ", username);

    const challengeResponse = {
      credential: assertionResponse,
      requestId: webAuthnStartResponse.requestId,
      pinCode: defaultInvalidPIN,
    };

    // If a credential is found, sign in the user with the provided username
    Auth.signIn(username)
      .then((user) => {
        if (
          user.challengeName === "CUSTOM_CHALLENGE" &&
          user.challengeParam.type === "webauthn.create"
        ) {
          dispatch(alertActions.error("Please register an account"));
          history.push("/register");
        } else if (
          user.challengeName === "CUSTOM_CHALLENGE" &&
          user.challengeParam.type === "webauthn.get"
        ) {
          // to send the answer of the custom challenge
          console.log("uv sending Custom Challenge Answer");
          Auth.sendCustomChallengeAnswer(
            user,
            JSON.stringify(challengeResponse)
          )
            .then((user) => {
              console.log("someUser Stuff", user);
              navigation.go("InitUserStep");
            })
            .catch((err) => {
              console.error("sendCustomChallengeAnswer error: ", err);
              dispatch(alertActions.error(err.message));
            });
        } else {
          dispatch(alertActions.error("Invalid server response"));
        }
      })
      .catch((error) => {
        console.error("signIn error");
        console.error(error);
        dispatch(alertActions.error(error.message));
        setContinueSubmitted(false);
      });
  }

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>Welcome</h2>
        <label>Log in to the WebAuthn Starter Kit to continue</label>
      </div>
      <div className="form mt-2">
        <div>
          <div className={styles.default["textCenter"]}>
            <label>{localStorage.getItem("username")}</label>
          </div>
        </div>
        <div>
          <Button
            type="submit"
            onClick={continueStep}
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
                  Fetching your profile
                </span>
              </>
            )}
            {!continueSubmitted && (
              <span>Continue with Trusted Device or Security Key</span>
            )}
          </Button>
        </div>
        <div className="mt-5">
          <hr />
        </div>
        <div>
          <div className={styles.default["textCenter"]}>
            <span onClick={LogInStep} className="btn-link">
              Try Another Method
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default LogInTrustedDeviceStep;
