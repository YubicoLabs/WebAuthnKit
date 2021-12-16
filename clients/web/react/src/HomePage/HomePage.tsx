import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Button, Card, Spinner, Table } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { credentialActions } from "../_actions";
import { history } from "../_helpers";
import CredentialList from "../_components/Credential/CredentialList";
import RecoveryCodes from "../_components/RecoveryCodes/RecoveryCodes";
import DeleteUser from "../_components/DeleteUser/DeleteUser";
import ServerVerifiedPin from "../_components/ServerVerifiedPin/ServerVerifiedPin";

const styles = require("../_components/component.module.css");

const HomePage = function () {
  const [jwt, setjwt] = useState("");
  const credentials = useSelector((state: RootStateOrAny) => state.credentials);
  const alert = useSelector((state: RootStateOrAny) => state.alert);
  const [credentialItems, setCredentialItems] = useState([]);
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
      console.warn("*****In here ******");
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

  return (
    <>
      <h2>Account Security</h2>
      <div>
        <Card className={styles.default["cardSpacing"]}>
          <Card.Header>
            <h5>Trusted Devices</h5>
          </Card.Header>
          <Card.Body>
            <Table hover responsive>
              <tbody>
                <tr>
                  <td>
                    <img
                      src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg"
                      width="20"
                      height="20"
                      alt=""
                    />
                  </td>
                  <td>Safari on macOS. Registered: May 26, 2021</td>
                  <td>
                    {" "}
                    <Button variant="danger">Delete</Button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img
                      src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg"
                      width="20"
                      height="20"
                      alt=""
                    />
                  </td>
                  <td>Safari on macOS. Registered: April 26, 2021</td>
                  <td>
                    {" "}
                    <Button variant="danger">Delete</Button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img
                      src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg"
                      width="20"
                      height="20"
                      alt=""
                    />
                  </td>
                  <td>Safari on macOS. Registered: March 26, 2021</td>
                  <td>
                    {" "}
                    <Button variant="danger">Delete</Button>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        {credentialsLoading ? (
          <div className={styles.default["textCenter"]}>
            <Spinner animation="border" role="status" variant="primary" />
            <p>Getting your security keys!</p>
          </div>
        ) : (
          <CredentialList credentialItems={credentialItems} />
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
