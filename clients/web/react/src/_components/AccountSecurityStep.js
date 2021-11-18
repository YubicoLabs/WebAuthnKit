import React, { useState, useEffect, useRef, Profiler } from 'react';
import { Button, Card, InputGroup, FormControl, Table, ListGroup, Image, Container, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, credentialActions, alertActions } from '../_actions';
import { WebAuthnClient } from './WebAuthnClient';

import styles from "./component.module.css";

const AccountSecurityStep = ({ setForm, formData, navigation }) => {
  //Initialize User information
  const [userData, setUserData] = useState({
    username: '',
    token: '',
    credential: ''
  });
  const credentials = useSelector(state => state.credentials);
  const dispatch = useDispatch();

  useEffect(() => {
    setUserData(WebAuthnClient.getCurrentAuthenticatedUser() || undefined);
    console.log(`Username: ${userData.username}`);
    console.log(`Token: ${userData.token}`);
    console.log(`Credential: ${userData.credential}`);
  }, []);

  useEffect(() => {
    if(userData.token) {
      console.log(`JWT: ${userData.token}`);
      dispatch(credentialActions.getAll(jwt));
    }
  }, [alert])

  //TODO Get trusted devices

  //TODO Get Security Keys
  //TODO - Modal for Edit
  //TODO - Format date from response
  //TODO - Use Metadata to determine if YubiKey (and what image do we use for non-YubiKey?)
  function credentialDisplay(credential) {
    return (
      <>
        <Row className={"justify-content-md-center " + styles['security-key-image-col']}>
          <Col sm={12} md={4} lg={2}>
            <Image className={styles['security-key-image']} src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" roundedCircle />
          </Col>
          <Col sm={12} md={8} lg={6}>
            <h5>{credential.credentialNickname.value}</h5>
            <h6>YubiKey 5NFC</h6>
            <p>{credential.lastUsedTime}</p>
          </Col>
          <Col sm={12} md={12} lg={3}>
            <Button variant="secondary">Edit</Button>
          </Col>
        </Row>
        <hr className={styles['section-divider']} />
      </>
    );
  }

  //TODO Change SV-PIN

  //TODO Generate recovery codes

  //TODO Delete account

  const logOut = () => {
    navigation.go('LogOutStep')
  }

  return (
    <>
        <center>
          <h2>Account Security</h2>
        </center>
        <div>
          <Card>
            <Card.Header><h5>Trusted Devices</h5></Card.Header>
            <Card.Body>
              <Table hover responsive>
                <tbody>
                  <tr>
                    <td><img src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg" width="20" height="20" /></td>
                    <td>Safari on macOS. Registered: May 26, 2021</td>
                    <td> <Button variant="danger">Delete</Button></td>
                  </tr>
                  <tr>
                    <td><img src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg" width="20" height="20" /></td>
                    <td>Safari on macOS. Registered: April 26, 2021</td>
                    <td> <Button variant="danger">Delete</Button></td>
                  </tr>
                  <tr>
                    <td><img src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg" width="20" height="20" /></td>
                    <td>Safari on macOS. Registered: March 26, 2021</td>
                    <td> <Button variant="danger">Delete</Button></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><h5>Security Keys</h5></Card.Header>
            <Card.Body>
              <Row className={"justify-content-md-center " + styles['security-key-image-col']}>
                <Col sm={12} md={4} lg={3}>
                  <Image className={styles['security-key-image']} src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" roundedCircle />
                </Col>
                <Col sm={12} md={8} lg={6}>
                  <h5>Credential Nickname 1</h5>
                  <h6>YubiKey 5NFC</h6>
                  <p>Last Login: Aug 25, 2021</p>
                </Col>
                <Col sm={12} md={12} lg={3}>
                  <Button variant="secondary">Edit</Button>
                </Col>
              </Row>
              <hr className={styles['section-divider']} />
              <Row className={"justify-content-md-center " + styles['security-key-image-col']}>
                <Col sm={12} md={4} lg={3}>
                  <Image className={styles['security-key-image']} src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" roundedCircle />
                </Col>
                <Col sm={12} md={8} lg={6}>
                  <h5>Credential Nickname 2</h5>
                  <h6>YubiKey 5NFC</h6>
                  <p>Last Login: Aug 25, 2021</p>
                </Col>
                <Col sm={12} md={12} lg={3}>
                  <Button variant="secondary">Edit</Button>
                </Col>
              </Row>
              <hr className={styles['section-divider']} />
              <Row className={"justify-content-md-center " + styles['security-key-image-col']}>
                <Col sm={12} md={4} lg={3}>
                  <Image className={styles['security-key-image']} src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" roundedCircle />
                </Col>
                <Col sm={12} md={8} lg={6}>
                  <h5>Credential Nickname 3</h5>
                  <h6>YubiKey 5NFC</h6>
                  <p>Last Login: Aug 25, 2021</p>
                </Col>
                <Col sm={12} md={12} lg={3}>
                  <Button variant="secondary">Edit</Button>
                </Col>
              </Row>
              <hr className={styles['section-divider']} />
              <Button variant="secondary">Add Security Key</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><h5>Server Verified PIN</h5></Card.Header>
            <Card.Body>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">Old PIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</InputGroup.Text>
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
                <InputGroup.Text id="basic-addon1">New PIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</InputGroup.Text>
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
          <Card>
            <Card.Header><h5>Recovery Options</h5></Card.Header>
            <Card.Body>
              <Button variant="link">Recovery Codes</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><h5>Delete Account</h5></Card.Header>
            <Card.Body>
              <Button variant="danger">Permanently Delete Account</Button>
            </Card.Body>
          </Card>
          <div className="mt-5">
            <hr></hr>
          </div>
          <div>
            <center><span onClick={logOut} className="btn-link">Log Out</span></center>
          </div>
        </div>
    </>
  );
};

export default AccountSecurityStep;