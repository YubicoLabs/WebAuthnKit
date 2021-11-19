import React, { useState, useEffect, useRef, Profiler } from 'react';
import { Button, Card, InputGroup, FormControl, Table, ListGroup, Image, Container, Row, Col, Modal, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, credentialActions, alertActions } from '../_actions';
import { WebAuthnClient } from './WebAuthnClient';

import styles from "./component.module.css";
import Auth from '@aws-amplify/auth';

const AccountSecurityStep = ({ setForm, formData, navigation }) => {
  //Initialize User information
  const [userData, setUserData] = useState({
    username: '',
    token: '',
    credential: ''
  });
  //const credentials = useSelector(state => state.credentials);
  const credentials = [
    {
      credentialNickname: 'My BIO Key',
      lastUsedTime: 'Aug 25, 2021',
      lastUpdatedTime: 'Sept 12, 2021',
      registrationTime: 'July 23, 2021'
    },
    {
      credentialNickname: 'My 5Ci Key',
      lastUsedTime: 'Aug 25, 2021',
      lastUpdatedTime: 'Sept 12, 2021',
      registrationTime: 'July 23, 2021'
    },
    {
      credentialNickname: 'My 5NFC Key',
      lastUsedTime: 'Aug 25, 2021',
      lastUpdatedTime: 'Sept 12, 2021',
      registrationTime: 'July 23, 2021'
    }
  ];

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
      //dispatch(credentialActions.getAll(jwt));
    }
  }, [alert])

  //TODO Get trusted devices

  //TODO Get Security Keys
  //TODO - Modal for Edit
  //TODO - Format date from response
  //TODO - Use Metadata to determine if YubiKey (and what image do we use for non-YubiKey?)
  /**
   * To put in final render use this
   * credentials.items.map((credential, index) => {credentialDisplay(credential)} />
   */
  function CredentialDisplay(credential) {

    function EditModal() {
      const [show, setShow] = useState(false);

      const handleClose = () => setShow(false);
      const handleShow = () => setShow(true);

      //TODO implement this feature
      const handleSave = () => {
        console.log("Save called")
      }

      //TODO uncomment the dispatch and test if this still works
      const handleDelete = () => {
        setShow(false);
        console.log("Delete called");
        //dispatch(credentialActions.delete(credential.credential.credentialId.base64));
      }

      //Todo, make an edit field for the username (see if the constraints are in any of the helpers)
      return (
        <>
          <Button variant="secondary" onClick={handleShow}>Edit</Button>

          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Edit {credential.credentialNickname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                **placeholder for edit nickname**
                </ListGroup.Item>
                <ListGroup.Item>
                  <em>Last Used Time: {credential.lastUsedTime}</em>
                </ListGroup.Item>
                <ListGroup.Item>
                  <em>Last Updated Time: {credential.lastUpdatedTime}</em>
                </ListGroup.Item>
                <ListGroup.Item>
                  <em>Registration Time: {credential.registrationTime}</em>
                </ListGroup.Item>
              </ListGroup>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>Close</Button>
              <Button variant="primary" onClick={handleSave}>Save Changes</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </Modal.Footer>
          </Modal>
        </>
      );
    }

    return (
      <>
        <div className="d-flex justify-content-center align-items-center">
          <div className="p-2">
          <Image className={styles['security-key-image']} src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" roundedCircle />
          </div>
          <div className="p-2 flex-grow-1">
          <h5>{credential.credentialNickname}</h5>
            <h6>YubiKey 5NFC</h6>
            <p>{credential.lastUsedTime}</p>          
          </div>
          <div className="m-2">
          <EditModal />
          </div>
        </div>
        <hr className={styles['section-divider']} />
      </>
    );
  }

  //TODO Change SV-PIN

  //TODO Generate recovery codes
  function RecoveryCodes() {
    //let recoveryCodesViewed = credentials.recoveryCodesViewed; //For Cody's reference, this is found in FIDO2KitAPI, gets added to the payload
    //let allRecoveryCodesUsed = credentials.allRecoveryCodesUsed;
    //const recoveryCodes = useSelector(state => state.recoveryCodes);
    let recoveryCodesViewed = false
    let allRecoveryCodesUsed = false;
    const recoveryCodes = {
      loading: false,
      generating: false,
      error: '',
      codesRemaining: 3,
      codes: [
        '5e010f7cde664f98a8c003e220ff0084',
        'e2ef5f92c32a427885795af52c2ddaea',
        '53d7a9899a7947dd8646d481baee685e',
        '510afd0c813c45df87116275588c067b',
        '510afd0c813c45df87116275588c067b'
      ]
    }
    const [showCodes, setShowCodes] = useState(false);

    const handleClose = () => {
      setShowCodes(false);
    }
    const handleShow = () => {
      setShowCodes(true);
      //dispatch(credentialActions.recoveryCodesViewed());
    }
    const handleGenerate = () => {
      setShowCodes(true);
      //dispatch(credentialActions.generateRecoveryCodes());
    }

    useEffect(() => {
      if(recoveryCodesViewed === false || allRecoveryCodesUsed) {
        handleShow();
      }
    }, [recoveryCodesViewed, allRecoveryCodesUsed]);

    return (
      <>
        <Card>
            <Card.Header><h5>Recovery Options</h5></Card.Header>
            <Card.Body>
              <Button variant="link" onClick={handleShow}>Recovery Codes</Button>
            </Card.Body>
          </Card>
          <Modal show={showCodes} onHide={handleClose}>
              <Modal.Header closeButton>
                  <Modal.Title>Recovery Codes</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <label>Protect your recovery codes as you would a password. We recommend saving them in a safe spot, such as password manager.</label> 
                  <Alert variant="warning">If you lose you all your authenticators and don't have the recovery codes you will lose access to your account.</Alert>
                  {recoveryCodes.loading && <em>Loading recovery codes...</em>}
                  {recoveryCodes.generating && <em>Generating recovery codes...</em>}
                  {recoveryCodes.error && <span className="text-danger">ERROR: {recoveryCodes.error}</span>}
                  {recoveryCodes.codesRemaining && (recoveryCodes.codesRemaining === 0) ? <em>Please generate new recovery codes now.</em> : ''}
                  {recoveryCodes.codes && 
                      <ul>
                          <li>{recoveryCodes.codes[0]}</li>
                          <li>{recoveryCodes.codes[1]}</li>
                          <li>{recoveryCodes.codes[2]}</li>
                          <li>{recoveryCodes.codes[3]}</li>
                          <li>{recoveryCodes.codes[4]}</li>
                      </ul>
                  }   
                  {recoveryCodes.codes && <Alert variant="warning">Save your recovery codes now. They will not be shown again.</Alert>}        
                  {recoveryCodes.codesRemaining && (recoveryCodes.codesRemaining > 0) ? <em>{recoveryCodes.codesRemaining} recovery codes remaining.</em> : ''}
                  {allRecoveryCodesUsed && (!recoveryCodes.generating || !recoveryCodes.codes) && <em className="text-danger">All recovery codes have been used. Please generate new recovery codes now.</em>}
                  <p></p>
                  <h6>Generate new recovery codes</h6> 
                  <label>When you generate new recovery codes, you must copy them to a safe spot. Your old codes will not work anymore.</label> 
                  <Button variant="secondary" onClick={handleGenerate}>Generate</Button>
              </Modal.Body>
              <Modal.Footer>
                  <Button variant="primary" onClick={handleClose}>
                      Close
                  </Button>
              </Modal.Footer>
          </Modal>
      </>
    )
  }

  function DeleteUser() {
    const [show, setShow] = useState(false);
    const handleShow = () => {
      setShow(true);
    }
    const handleClose = () => {
      setShow(false);
    }
    const handleDelete = () => {
      navigation.go('LogOutStep');
    }
    /**
    const handleDelete = () => {
      setShow(false);
      Auth.currentAuthenticatedUser().then((user) => new Promise((resolve, reject) => {
        user.deleteUser(error => {
          if(error) {
            return reject(error);
          }
          dispatch(userActions.delete(userData.token));
          navigation.go('LogOutStep');
  
          resolve();
        });
      }))
      .catch(error => {
        console.error(error);
        dispatch(alertActions.error(error.message));
      });
    }
    */

    return (
      <>
        <Card>
          <Card.Header><h5>Delete Account</h5></Card.Header>
          <Card.Body>
            <Button variant="danger" onClick={handleShow}>Permanently Delete Account</Button>
          </Card.Body>
        </Card>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
          </Modal.Header>
          <Modal.Body> 
              <label>Once you delete your account, there is no going back. Please be certain.</label> 
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
              <Button variant="primary" onClick={handleClose}>
                  Close
              </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  const logOut = () => {
    dispatch(userActions.logout()); 
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
              {credentials.map((credential, index) => 
                <CredentialDisplay key={'credDisp' + index} {...credential}/>
              )}
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
          <RecoveryCodes />
          <DeleteUser />
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