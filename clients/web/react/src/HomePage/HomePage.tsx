import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Button, Card, Spinner, Table } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { credentialActions } from "../_actions";

import { userActions } from "../_actions";

import { history } from "../_helpers";
import CredentialList from "../_components/Credential/CredentialList";
import TrustedDeviceList from "../_components/TrustedDevices/TrustedDeviceList";
import RecoveryCodes from "../_components/RecoveryCodes/RecoveryCodes";
import DeleteUser from "../_components/DeleteUser/DeleteUser";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";
import userService from "../_services/user.service";

const styles = require("../_components/component.module.css");

const HomePage = function () {
  const [username, setUsername] = useState("");
  const [jwt, setjwt] = useState("");
  const credentials = useSelector((state: RootStateOrAny) => state.credentials);
  const user = useSelector((state: RootStateOrAny) => state.users);
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
  }, [credentials]);

  useEffect(() => {
    if (jwt) {
      dispatch(credentialActions.getAll(jwt));
    }
  }, [jwt]);

  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      dispatch(userActions.getCurrentAuthenticatedUser());
    } else {
      setUser();
    }
  }, []);

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
      <h2 className={styles.default["usernameHeader"]}>Welcome {username}!</h2>
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
