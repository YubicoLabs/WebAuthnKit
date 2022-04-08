import React, { useState, useEffect } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { Button, Spinner } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { get } from "@github/webauthn-json";
import { useTranslation } from "react-i18next";
import { userActions, alertActions } from "../_actions";
import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

const LogInTrustedDeviceStep = function ({ navigation }) {
  const { t } = useTranslation();

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
    console.info(
      t("console.info", {
        COMPONENT: "LoginTrustedDeviceStep",
        METHOD: "signInWithoutUsername()",
        LOG_REASON: t("console.reason.loginTrustedDevice0"),
      })
    );

    // get usernameless auth request
    console.info(
      t("console.info", {
        COMPONENT: "LoginTrustedDeviceStep",
        METHOD: "signInWithoutUsername()",
        LOG_REASON: t("console.reason.loginTrustedDevice1"),
      }),
      webAuthnStartResponse
    );

    const publicKey = {
      publicKey: webAuthnStartResponse.publicKeyCredentialRequestOptions,
    };
    console.info(
      t("console.info", {
        COMPONENT: "LoginTrustedDeviceStep",
        METHOD: "signInWithoutUsername()",
        LOG_REASON: t("console.reason.loginTrustedDevice2"),
      }),
      publicKey
    );

    const assertionResponse = await get(publicKey);
    console.info(
      t("console.info", {
        COMPONENT: "LoginTrustedDeviceStep",
        METHOD: "signInWithoutUsername()",
        LOG_REASON: t("console.reason.loginTrustedDevice3"),
      }),
      assertionResponse
    );

    // get username from assertionResponse
    const username = assertionResponse.response.userHandle;
    console.info(
      t("console.info", {
        COMPONENT: "LoginTrustedDeviceStep",
        METHOD: "signInWithoutUsername()",
        LOG_REASON: t("console.reason.loginTrustedDevice4"),
      }),
      username
    );

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
          dispatch(alertActions.error(t("alerts.register-account")));
          history.push("/register");
        } else if (
          user.challengeName === "CUSTOM_CHALLENGE" &&
          user.challengeParam.type === "webauthn.get"
        ) {
          // to send the answer of the custom challenge
          console.info(
            t("console.info", {
              COMPONENT: "LoginTrustedDeviceStep",
              METHOD: "signInWithoutUsername()",
              LOG_REASON: t("console.reason.loginTrustedDevice5"),
            })
          );
          Auth.sendCustomChallengeAnswer(
            user,
            JSON.stringify(challengeResponse)
          )
            .then((user) => {
              navigation.go("InitUserStep");
            })
            .catch((err) => {
              console.error(
                t("console.error", {
                  COMPONENT: "LoginTrustedDeviceStep",
                  METHOD: "signInWithoutUsername()",
                  REASON: t("console.reason.loginTrustedDevice6"),
                }),
                err
              );
              dispatch(alertActions.error(err.message));
            });
        } else {
          dispatch(alertActions.error(t("alerts.invalid-server-response")));
        }
      })
      .catch((error) => {
        console.error(
          t("console.error", {
            COMPONENT: "LoginTrustedDeviceStep",
            METHOD: "signInWithoutUsername()",
            REASON: t("console.reason.loginTrustedDevice7"),
          }),
          error
        );
        dispatch(alertActions.error(error.message));
        setContinueSubmitted(false);
      });
  }

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>{t("login.welcome")}</h2>
        <label>{t("login.instructions")}</label>
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
                  {t("login.primary-button-loading")}
                </span>
              </>
            )}
            {!continueSubmitted && (
              <span>{t("login.trusted-device-button")}</span>
            )}
          </Button>
        </div>
        <div className="mt-5">
          <hr />
        </div>
        <div>
          <div className={styles.default["textCenter"]}>
            <span onClick={LogInStep} className="btn-link">
              {t("login.alt-method")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogInTrustedDeviceStep;
