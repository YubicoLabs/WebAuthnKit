import React, { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { Auth } from "aws-amplify";
import { useTranslation } from "react-i18next";
import { userActions, alertActions } from "../../_actions";
import { history } from "../../_helpers";

const PropTypes = require("prop-types");
const styles = require("../component.module.css");

/**
 * Component allowing the user to delete their account, and remove any details in the user local storage
 * Modal pops up asking for confirmation if the user wants to delete their account
 * Sends the user back to the initial login screen - The user should not be able to relogin after this step is run
 */
const DeleteUser = function ({ userToken }) {
  const { t } = useTranslation();

  const [show, setShow] = useState(false);

  const dispatch = useDispatch();

  /**
   * Used to show the modal
   */
  const handleShow = () => {
    setShow(true);
  };

  /**
   * Used to hide the modal
   */
  const handleClose = () => {
    setShow(false);
  };

  /**
   * This method is called once a user has confirmed the desire to delete their account
   * Starts by getting the current user credentials - Once retrieved the user actions dispatch is used to send a call to the backend to delete the user
   */
  const handleDelete = () => {
    setShow(false);
    Auth.currentAuthenticatedUser()
      .then(
        (user) =>
          new Promise<void>((resolve, reject) => {
            user.deleteUser((error) => {
              if (error) {
                return reject(error);
              }
              dispatch(userActions.delete(userToken));
              history.push("/logout");
              return resolve();
            });
          })
      )
      .catch((error) => {
        console.error(
          t("console.error", {
            COMPONENT: "DeleteUser",
            METHOD: "handleDelete()",
            REASON: t("console.reason.deleteUser0"),
          }),
          error
        );
        dispatch(alertActions.error(error.message));
      });
  };

  return (
    <>
      <Card className={styles.cardSpacing}>
        <Card.Header>
          <h5> {t("delete.header")}</h5>
        </Card.Header>
        <Card.Body>
          <Button variant="danger" onClick={handleShow}>
            {t("delete.button-label")}
          </Button>
        </Card.Body>
      </Card>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t("delete.modal-title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t("delete.modal-note")}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDelete}>
            {t("delete.modal-delete-button")}
          </Button>
          <Button variant="primary" onClick={handleClose}>
            {t("delete.modal-close-button")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

DeleteUser.propTypes = {
  userToken: PropTypes.string.isRequired,
};

export default DeleteUser;
