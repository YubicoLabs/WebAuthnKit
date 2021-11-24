import React, { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { Auth } from "aws-amplify";
import { userActions, alertActions } from "../../_actions";

const DeleteUser = function ({ userToken }) {
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const handleShow = () => {
    setShow(true);
  };
  const handleClose = () => {
    setShow(false);
  };

  const handleDelete = () => {
    setShow(false);
    Auth.currentAuthenticatedUser()
      .then(
        (user) =>
          new Promise((resolve, reject) => {
            user.deleteUser((error) => {
              if (error) {
                return reject(error);
              }
              dispatch(userActions.delete(userToken));

              resolve();
            });
          })
      )
      .catch((error) => {
        console.error(error);
        dispatch(alertActions.error(error.message));
      });
  };

  return (
    <>
      <Card>
        <Card.Header>
          <h5>Delete Account</h5>
        </Card.Header>
        <Card.Body>
          <Button variant="danger" onClick={handleShow}>
            Permanently Delete Account
          </Button>
        </Card.Body>
      </Card>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>
            Once you delete your account, there is no going back. Please be
            certain.
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export { DeleteUser };
