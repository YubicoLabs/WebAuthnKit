import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { userActions, credentialActions, alertActions } from '../_actions';
import { CredentialList } from '../_components/Credential';
import { RecoveryCodes } from '../_components/RecoveryCodes';
import { DeleteUser } from '../_components/DeleteUser';

import { Button, InputGroup, Card, Table, FormControl } from 'react-bootstrap';
import { Auth } from 'aws-amplify';
import axios from 'axios';
import aws_exports from '../aws-exports';
import validate from 'validate.js';

axios.defaults.baseURL = aws_exports.apiEndpoint;

function HomePage() {

    const [userInfo, setUserInfo] = useState({
        id: "",
        username: "",
        credential: "",
        token: ''
    });
    const credentials = useSelector(state => state.credentials);
    const alert = useSelector(state => state.alert);
    const svpinChangeProps = {type: "change", saveCallback: updatePin};
    const dispatch = useDispatch();

    //To re-evaluate later
    function updatePin(fields) {
        dispatch(credentialActions.updatePin(fields));
    }

    useEffect(() => {
        currentAuthenticatedUser();
    }, []);

    useEffect(() => {
        if(userInfo.token) {
            dispatch(credentialActions.getAll(userInfo.token));
        }
    }, [alert]);

    function currentAuthenticatedUser() {
        const currAuthUser = (dispatch(userActions.getCurrentAuthenticatedUser) || undefined);
        console.log("Home currentAuthenticatedUser: ", currAuthUser)

        if (currAuthUser === undefined) {
            console.error("Home currentAuthenticatedUser error");
            dispatch(alertActions.error("Something went wrong. Please try again."));
          } else {
            dispatch(alertActions.success('Home currentAuthenticatedUser successful'));
            setUserInfo(currAuthUser);
            dispatch(credentialActions.getAll(userInfo.token));
          }
    }
    
    const logout = () => {
        Auth.signOut();
        navigation.go('LogOutStep');
    }

    //Review
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
              <CredentialList credentials={credentials.items} />
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
          <RecoveryCodes credentials={credentials} />
          <DeleteUser userToken={userInfo.token} navigation={navigation} />
          <div className="mt-5">
            <hr></hr>
          </div>
          <div>
            <center><span onClick={logout} className="btn-link">Log Out</span></center>
          </div>
        </div>
    </>
    );
}

export { HomePage };