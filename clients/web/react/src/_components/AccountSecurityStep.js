import React from "react";
import { Button, Card, InputGroup, FormControl, Table } from 'react-bootstrap';

import styles from "./component.module.css";

const AccountSecurityStep = ({ setForm, formData, navigation }) => {
  const logOut = () => {
    window.location.reload();
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
              <Table hover responsive>
                <tbody>
                  <tr>
                    <td><img src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" width="20" height="20" /></td>
                    <td>YubiKey 5. Last used: May 26, 2021</td>
                    <td> <Button variant="secondary">Edit</Button></td>
                  </tr>
                  <tr>
                    <td><img src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" width="20" height="20" /></td>
                    <td>YubiKey 4. Last used: April 26, 2021</td>
                    <td> <Button variant="secondary">Edit</Button></td>
                  </tr>
                  <tr>
                    <td><img src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" width="20" height="20" /></td>
                    <td>YubiKey 6. Last used: March 26, 2021</td>
                    <td> <Button variant="secondary">Edit</Button></td>
                  </tr>
                </tbody>
              </Table>
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