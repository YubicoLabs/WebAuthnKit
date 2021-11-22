import React from 'react';
import axios from 'axios';
import aws_exports from '../../aws-exports';
import { userActions, alertActions } from '../_actions';

import { Button, Card, Modal } from 'react-bootstrap';

axios.defaults.baseURL = aws_exports.apiEndpoint;

function DeleteUser({ userToken, navigation }) {
  const [show, setShow] = useState(false);
    const handleShow = () => {
      setShow(true);
    }
    const handleClose = () => {
      setShow(false);
    }

    const handleDelete = () => {
      setShow(false);
      Auth.currentAuthenticatedUser().then((user) => new Promise((resolve, reject) => {
        user.deleteUser(error => {
          if(error) {
            return reject(error);
          }
          dispatch(userActions.delete(userToken));
          navigation.go('LogOutStep');
  
          resolve();
        });
      }))
      .catch(error => {
        console.error(error);
        dispatch(alertActions.error(error.message));
      });
    }

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

export { DeleteUser };
