import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Button, Card, Spinner, Table } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { credentialActions } from "../_actions";
import { history } from "../_helpers";
import CredentialList from "../_components/Credential/CredentialList";
import TrustedDeviceList from "../_components/TrustedDevices/TrustedDeviceList";
import RecoveryCodes from "../_components/RecoveryCodes/RecoveryCodes";
import DeleteUser from "../_components/DeleteUser/DeleteUser";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";

const styles = require("../_components/component.module.css");

const HomePage = function () {
  const [jwt, setjwt] = useState("");
  const credentials = useSelector((state: RootStateOrAny) => state.credentials);
  const alert = useSelector((state: RootStateOrAny) => state.alert);
  const [credentialItems, setCredentialItems] = useState([]);
  const [securityKeyItems, setSecurityKeyItems] = useState([]);
  const [registeredDeviceItems, setRegisteredDeviceItems] = useState([]);
  const [recoveryCodeProps, setRecoveryCodeProps] = useState({
    allRecoveryCodesUsed: false,
    recoveryCodesViewed: false,
  });
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const dispatch = useDispatch();

  function svpCallback(newValue) {
    const fields = { pin: newValue.value, confirmPin: newValue.value };
    dispatch(credentialActions.updatePin(fields));
  }

  function svpCloseCallback(message) {
    console.warn(message);
  }

  const serverVerifiedProps = {
    type: "change",
    saveCallback: svpCallback,
    closeCallback: svpCloseCallback,
  };

  async function currentAuthenticatedUser() {
    const data = await Auth.currentSession();
    const token = data.getIdToken().getJwtToken();
    if (token) {
      setjwt(token);
    } else {
      console.error("There was an error getting your current user session");
    }
  }

  useEffect(() => {
    if (credentials === {} || credentials.loading) {
      setCredentialsLoading(true);
    } else {
      if (credentials.items) {
        setCredentialItems(credentials.items);
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
  }, [credentials, alert]);

  useEffect(() => {
    if (alert.message) {
      if (
        alert.message === "Registration successful" ||
        alert.message === "Delete credential successful"
      ) {
        dispatch(credentialActions.getAll(jwt));
      }
    }
  }, [alert]);

  // This method is fine
  useEffect(() => {
    if (jwt) {
      dispatch(credentialActions.getAll(jwt));
    }
  }, [jwt]);

  useEffect(() => {
    currentAuthenticatedUser();
  }, []);

  const logout = async () => {
    history.push("/logout");
  };

  function secKeyOrRegisteredDevice(credList) {
    const secKeys = [];
    const regDevice = [];
    for (let i = 0; i < credList.length; i++) {
      const itemAuthAttach =
        credList[i].registrationRequest.publicKeyCredentialCreationOptions
          .authenticatorSelection?.authenticatorAttachment;
      if (itemAuthAttach === null || itemAuthAttach === "CROSS_PLATFORM") {
        secKeys.push(credList[i]);
      } else if (itemAuthAttach === "PLATFORM") {
        regDevice.push(credList[i]);
      }
    }
    console.log("SecKeys: ", secKeys);
    console.log("RegDevs: ", regDevice);
    return { securityKeys: secKeys, registeredDevices: regDevice };
  }

  return (
    <>
      <h2>Account Security</h2>
      <div>
        {credentialsLoading ? (
          <div className={styles.default["textCenter"]}>
            <Spinner animation="border" role="status" variant="primary" />
            <p>Getting your trusted devices!</p>
          </div>
        ) : (
          <TrustedDeviceList credentialItems={registeredDeviceItems} />
        )}
        {credentialsLoading ? (
          <div className={styles.default["textCenter"]}>
            <Spinner animation="border" role="status" variant="primary" />
            <p>Getting your security keys!</p>
          </div>
        ) : (
          <CredentialList credentialItems={securityKeyItems} />
        )}
        <Card className={styles.default["cardSpacing"]}>
          <Card.Header>
            <h5>Server Verified PIN</h5>
          </Card.Header>
          <Card.Body>
            <ServerVerifiedPin {...serverVerifiedProps} />
          </Card.Body>
        </Card>
        {credentialsLoading ? (
          <div className={styles.default["textCenter"]}>
            <Spinner animation="border" role="status" variant="primary" />
            <p>Getting your recovery codes!</p>
          </div>
        ) : (
          <RecoveryCodes credentials={recoveryCodeProps} />
        )}
        {jwt && <DeleteUser userToken={jwt} />}
        <div className="mt-5">
          <hr />
        </div>
        <div>
          <Button variant="secondary" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default HomePage;
