import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Button, Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { credentialActions, userActions } from "../_actions";
import { history } from "../_helpers";
import CredentialList from "../_components/Credential/CredentialList";
import TrustedDeviceList from "../_components/TrustedDevices/TrustedDeviceList";
import RecoveryCodes from "../_components/RecoveryCodes/RecoveryCodes";
import DeleteUser from "../_components/DeleteUser/DeleteUser";
import U2FPassword from "../_components/u2fPassword/u2fPassword";

const styles = require("../_components/component.module.css");

/**
 * Primary page of the application - Allows the user to manage their credentials and allows them to perform actions like generate recovery codes, reset U2F Password, delete account, and sign out
 */
const HomePage = function () {
  const { t } = useTranslation();

  const [username, setUsername] = useState("");

  const [jwt, setjwt] = useState("");

  // Used to store a static version of the credentials, just in case an action triggers a credential change
  const credentials = useSelector((state: RootStateOrAny) => state.credentials);

  const user = useSelector((state: RootStateOrAny) => state.users);

  const alert = useSelector((state: RootStateOrAny) => state.alert);

  // Stores all keys that are registered as roaming authenticators
  const [securityKeyItems, setSecurityKeyItems] = useState([]);

  // Stores all keys that are registered as platform authenticators
  const [registeredDeviceItems, setRegisteredDeviceItems] = useState([]);

  // Stores static values for data concerning recovery codes
  const [recoveryCodeProps, setRecoveryCodeProps] = useState({
    allRecoveryCodesUsed: false,
    recoveryCodesViewed: false,
  });

  // Indicator that is set if new credentials are being generated
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const dispatch = useDispatch();

  /**
   * Sent to U2F Password prompt as a successful callback - dispatches any changes to the PIN
   * @param newValue new value of the U2F Password
   */
  function u2fPassCallback(newValue) {
    const fields = { pin: newValue.value, confirmPin: newValue.value };
    dispatch(credentialActions.updatePin(fields));
  }

  /**
   * Closes the U2F Password callback if closed by the users
   * Sends a warning message indicating to the developer that the component was closed
   * @param message warning message sent from the promise callback
   */
  function u2fCloseCallback(message) {
    console.warn(
      t("console.warn", {
        COMPONENT: "HomePage",
        METHOD: "u2fCloseCallback",
        REASON: message,
      })
    );
  }

  /**
   * Properties used to configure the U2F Password component
   */
  const u2fProps = {
    type: "change",
    saveCallback: u2fPassCallback,
    closeCallback: u2fCloseCallback,
  };

  /**
   * Effect monitoring changes to credentials
   * If loading, then sets the loading indicator to appear during updates
   * If not loading, gets the new list of credentials, and segments them as either a platform authenticator, or roaming/default authenticator
   * After a refresh, also updates any recovery code data is this is stored in the Credentials Store
   */
  useEffect(() => {
    /**
     * This first conditional is needed - Occasionally the app will lose track of the current user
     * so you will need to re-acquire the users credentials by calling getCurrentAuthenticatedUser
     * Optional chaining used as the error field will not be there on a successful call, and could break the app
     */
    if (credentials?.error) {
      dispatch(userActions.getCurrentAuthenticatedUser());
    }
    if (credentials === {} || credentials.loading) {
      setCredentialsLoading(true);
    } else {
      if (credentials.items) {
        const keySegment = secKeyOrRegisteredDevice(credentials.items);
        setSecurityKeyItems(keySegment.securityKeys);
        setRegisteredDeviceItems(keySegment.registeredDevices);
      }
      if (
        credentials.allRecoveryCodesUsed !== undefined &&
        credentials.recoveryCodesViewed !== undefined
      ) {
        setRecoveryCodeProps({
          allRecoveryCodesUsed: credentials.allRecoveryCodesUsed,
          recoveryCodesViewed: credentials.recoveryCodesViewed,
        });
      }
      setCredentialsLoading(false);
    }
  }, [credentials]);

  /**
   * Updates the alert messages that are shown on the top of the screen - Skips certain alerts as they causes an infinite loop of getting credentials
   */
  useEffect(() => {
    if (alert.message && jwt) {
      if (
        alert.message === t("alerts.registration-successful") ||
        alert.message === t("alerts.delete-successful")
      ) {
        dispatch(credentialActions.getAll(jwt));
      }
    }
  }, [alert]);

  /**
   * If the user auth token is changed, then refresh the credentials
   */
  useEffect(() => {
    if (jwt) {
      dispatch(credentialActions.getAll(jwt));
    }
  }, [jwt]);

  /**
   * On initial load ensure that the user details have been added to local storage, otherwise attempt another call on user actions
   */
  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      dispatch(userActions.getCurrentAuthenticatedUser());
    } else {
      setUser();
    }
  }, []);

  /**
   * If there are any  changes to the user, reset the JWT - This is also used to trigger a new retrieval of credentials
   */
  useEffect(() => {
    const token = user?.token;
    if (token !== undefined) {
      setUser();
    }
  }, [user]);

  const setUser = () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    setUsername(currentUser.displayname);
    setjwt(currentUser.token);
  };

  /**
   * Routes the user to the logout step
   */
  const logout = async () => {
    history.push("/logout");
  };

  /**
   * Splits the credential list between authenticator type - Not necessary, but used for this example to differentiate between roaming and platform authenticators
   * @param credList Full list of credentials from a getAll credentials retrieval
   * @returns Two separate lists, one with all platform authenticators, and one with roaming
   */
  function secKeyOrRegisteredDevice(credList) {
    const secKeys = [];
    const regDevice = [];
    for (let i = 0; i < credList.length; i++) {
      const itemAuthAttach =
        credList[i].registrationRequest.publicKeyCredentialCreationOptions
          .authenticatorSelection?.authenticatorAttachment;
      if (itemAuthAttach === "PLATFORM") {
        regDevice.push(credList[i]);
      } else {
        secKeys.push(credList[i]);
      }
    }
    return { securityKeys: secKeys, registeredDevices: regDevice };
  }

  return (
    <>
      <h2 className={styles.default["usernameHeader"]}>
        {t("home.welcome")} {username}!
      </h2>
      <h2>{t("home.header")}</h2>
      <div>
        {credentialsLoading ? (
          <Card className={styles.default["cardSpacing"]}>
            <Card.Header>
              <h5>{t("home.plat-auth-title")}</h5>
            </Card.Header>
            <Card.Body>
              <div className={styles.default["textCenter"]}>
                <Spinner animation="border" role="status" variant="primary" />
                <p>{t("home.plat-auth-loading")}</p>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <TrustedDeviceList credentialItems={registeredDeviceItems} />
        )}
        {credentialsLoading ? (
          <Card className={styles.default["cardSpacing"]}>
            <Card.Header>
              <h5>{t("home.roam-auth-title")}</h5>
            </Card.Header>
            <Card.Body>
              <div className={styles.default["textCenter"]}>
                <Spinner animation="border" role="status" variant="primary" />
                <p>{t("home.roam-auth-loading")}</p>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <CredentialList credentialItems={securityKeyItems} />
        )}
        <Card className={styles.default["cardSpacing"]}>
          <Card.Header>
            <h5>{t("home.u2fpassword-title")}</h5>
          </Card.Header>
          <Card.Body>
            <U2FPassword {...u2fProps} />
          </Card.Body>
        </Card>
        {credentialsLoading ? (
          <Card className={styles.default["cardSpacing"]}>
            <Card.Header>
              <h5>{t("home.recovery-code-title")}</h5>
            </Card.Header>
            <Card.Body>
              <div className={styles.default["textCenter"]}>
                <Spinner animation="border" role="status" variant="primary" />
                <p>{t("home.recovery-code-loading")}</p>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <RecoveryCodes credentials={recoveryCodeProps} />
        )}
        {jwt && <DeleteUser userToken={jwt} />}
        <div className="mt-5">
          <hr />
        </div>
        <div>
          <Button variant="secondary" onClick={logout}>
            {t("home.sign-out")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default HomePage;
