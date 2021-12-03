import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, InputGroup, FormControl, Table } from "react-bootstrap";
import { userActions, credentialActions } from "../_actions";
import { history } from "../_helpers";
import CredentialList from "../_components/Credential/CredentialList";
import { RecoveryCodes } from "../_components/RecoveryCodes/RecoveryCodes";
import { DeleteUser } from "../_components/DeleteUser/DeleteUser";
import styles from "../_components/component.module.css";

const HomePage = function () {
  const authentication = useSelector((state) => state.authentication);
  const [jwt, setjwt] = useState("");
  const credentials = useSelector((state) => state.credentials);
  const [credentialItems, setCredentialItems] = useState([]);
  const [recoveryCodeProps, setRecoveryCodeProps] = useState({
    allRecoveryCodesUsed: false,
    recoveryCodesViewed: false,
  });
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const alert = useSelector((state) => state.alert);

  const dispatch = useDispatch();

  function currentAuthenticatedUser() {
    dispatch(userActions.getCurrentAuthenticatedUser());
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
  }, [credentials]);

  useEffect(() => {
    dispatch(credentialActions.getAll(authentication.user.token));
  }, [jwt]);

  useEffect(() => {
    if (!jwt && authentication.user.token) {
      setjwt(authentication.user.token);
    }
  }, [authentication, alert]);

  useEffect(() => {
    setTimeout(() => {
      if (authentication.user.token !== undefined) {
        console.log(
          "Calling get all with credential: ",
          authentication.user.token
        );
        dispatch(credentialActions.getAll(authentication.user.token));
      }
    }, 2000);
  }, []);

  useEffect(() => {
    // window.location.reload();
    setTimeout(() => currentAuthenticatedUser(), 300);
    // currentAuthenticatedUser();
  }, []);

  const logout = async () => {
    history.push("/logout");
  };

  return (
    <>
      <h2>Account Security</h2>
      <div>
        <Card className={styles.cardSpacing}>
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
          <p>Loading</p>
        ) : (
          <CredentialList credentialItems={credentialItems} />
        )}
        <Card className={styles.cardSpacing}>
          <Card.Header>
            <h5>Server Verified PIN</h5>
          </Card.Header>
          <Card.Body>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">
                  Old PIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Old PIN"
                aria-label="Old PIN"
                aria-describedby="basic-addon1"
                type="password"
              />
            </InputGroup>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">
                  New PIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="New PIN"
                aria-label="New PIN"
                aria-describedby="basic-addon1"
                type="password"
              />
            </InputGroup>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">Confirm PIN</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Confirm PIN"
                aria-label="Confirm PIN"
                aria-describedby="basic-addon1"
                type="password"
              />
            </InputGroup>
            <Button variant="secondary">Update PIN</Button>
          </Card.Body>
        </Card>
        {credentialsLoading ? (
          <p>Loading</p>
        ) : (
          <RecoveryCodes credentials={recoveryCodeProps} />
        )}
        {authentication.user.token && (
          <DeleteUser userToken={authentication.user.token} />
        )}
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
