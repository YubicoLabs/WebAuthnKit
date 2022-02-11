import React, { useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { history } from "../_helpers";
import { userActions } from "../_actions";

const styles = require("../_components/component.module.css");

/**
 * Transitionary page that is used to log in the user and to set auth tokens used for APIs - This step should only be reached after a successful registration
 * @returns User is routed back to the login screen, with all credentials removed from the browser
 */
const InitUserStep = function ({ navigation }) {
  const { t } = useTranslation();

  const user = useSelector((state: RootStateOrAny) => state.users);

  const dispatch = useDispatch();

  /**
   * If the browser + platform allows for platform authenticators, then allow the user to proceed to the register trusted device step
   * Otherwise, route the user to the home page
   */
  function registerTrustedDeviceOrContinue() {
    const trustedDevice = localStorage.getItem("trustedDevice");

    if (trustedDevice === null) {
      // For more information on this method, see here: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/isUserVerifyingPlatformAuthenticatorAvailable
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(function (available) {
          if (available) {
            navigation.go("RegisterTrustedDeviceStep");
          } else {
            history.push("/");
          }
        })
        .catch(function (err) {
          console.error(err);
          history.push("/");
        });
    } else {
      history.push("/");
    }
  }

  /**
   * Once a user is configured, ensure that they have a user token
   * If the user has a token, allow them to proceed to the key registration success page
   */
  useEffect(() => {
    dispatch(userActions.getCurrentAuthenticatedUser());
  }, []);

  useEffect(() => {
    const token = user?.token;

    if (token !== undefined) {
      registerTrustedDeviceOrContinue();
    }
  }, [user]);

  return (
    <div className={styles.default["textCenter"]}>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>{t("init-user")}</h2>
    </div>
  );
};

export default InitUserStep;
