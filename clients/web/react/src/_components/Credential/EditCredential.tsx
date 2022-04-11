import React, { useState, useRef } from "react";

import { Button, Modal, Alert } from "react-bootstrap";
import { useDispatch } from "react-redux";
import validate from "validate.js";
import { useTranslation } from "react-i18next";
import { credentialActions } from "../../_actions";

/**
 * Component used to display additional details about a credential, as well as allowing
 * the user to update the nickname, or delete
 * @param credential Data related to a specific credential
 * @returns
 */
const EditCredential = function ({ credential }) {
  const { t } = useTranslation();

  const [show, setShow] = useState(false);

  const [nickname, setNickname] = useState("");

  const [invalidNickname, setInvalidNickname] = useState(undefined);

  const [submitted, setSubmitted] = useState(false);

  const dispatch = useDispatch();

  /**
   * Closes the modal
   */
  const handleClose = () => setShow(false);
  const handleShow = () => {
    setNickname(credential.credentialNickname.value);
    setShow(true);
  };

  /**
   * Handles the deletion of a credential if triggered by a user using the method in credentialActions
   */
  const handleDelete = () => {
    setShow(false);
    dispatch(
      credentialActions.delete(credential.credential.credentialId.base64)
    );
  };
  const constraints = {
    nickname: {
      length: {
        minimum: 1,
        maximum: 20,
      },
    },
  };

  /**
   * Handles when the user saves a new nickname for their security key
   * First validates if the nickname is valid before allowing an update
   */
  const handleSave = () => {
    setSubmitted(true);
    const result = validate({ nickname }, constraints);
    if (result) {
      setInvalidNickname(result.nickname.join(". "));
      return result;
    }
    setInvalidNickname(undefined);

    setShow(false);
    credential.credentialNickname.value = nickname;
    dispatch(credentialActions.update(credential));
  };

  /**
   * Used to validate nickname changes on user input
   * @param e Event triggered by user action
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNickname(value);
    const result = validate({ nickname: value }, constraints);
    if (result) {
      setInvalidNickname(result.nickname.join(". "));
    } else {
      setInvalidNickname(undefined);
    }
  };
  const inputRef = useRef(null);

  /**
   * Checks if attestation data exists on the credential, used to determine if additional data should be displayed
   * @param credential credential that was passed into this component by parent
   * @returns
   */
  const checkAttestation = (credential) => {
    const credAtt =
      credential.attestationMetadata?.value?.deviceProperties?.displayName;
    if (credAtt) return true;
    return false;
  };

  return (
    <>
      <Button variant="secondary" onClick={handleShow}>
        {t("credential.edit-button")}
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t("credential.edit-header")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>
            {t("credential.edit-form-label")}{" "}
            <input
              type="text"
              name="nickname"
              autoFocus
              value={nickname}
              ref={inputRef}
              onChange={handleChange}
              className={`form-control${
                submitted && invalidNickname ? " is-invalid" : ""
              }`}
              onKeyPress={(ev) => {
                if (ev.key === "Enter") {
                  handleSave();
                  ev.preventDefault();
                }
              }}
            />
          </label>
          <br />
          {invalidNickname ? (
            <Alert variant="danger">{invalidNickname}</Alert>
          ) : null}
          &nbsp;&nbsp;
          <br />
          <label>
            <em>{t("credential.edit-usernameless")}</em>{" "}
            {credential.registrationRequest
              ? credential.registrationRequest.requireResidentKey.toString()
              : ""}
          </label>
          <br />
          <label>
            <em>{t("credential.last-time-used")}</em>{" "}
            {credential.lastUsedTime
              ? new Date(
                  credential.lastUsedTime.seconds * 1000
                ).toLocaleString()
              : ""}
          </label>
          <br />
          <label>
            <em>{t("credential.last-update-time")}</em>{" "}
            {credential.lastUpdatedTime
              ? new Date(
                  credential.lastUpdatedTime.seconds * 1000
                ).toLocaleString()
              : ""}
          </label>
          <br />
          <label>
            <em>{t("credential.registration-time")}</em>{" "}
            {credential.registrationTime
              ? new Date(
                  credential.registrationTime.seconds * 1000
                ).toLocaleString()
              : ""}
          </label>
          <br />
          <br />
          {checkAttestation(credential) && (
            <>
              <h4 style={{ color: "#9aca3c" }}>
                {t("credential.yubico-att-label")}
              </h4>
              <p>
                <em>{t("credential.att-device-name")}</em>{" "}
                {
                  credential.attestationMetadata.value.deviceProperties
                    .displayName
                }{" "}
                -{" "}
                <a
                  href={
                    credential.attestationMetadata.value.deviceProperties
                      .deviceUrl
                  }
                  target="_blank"
                  rel="noreferrer">
                  {t("credential.att-device-info")}
                </a>
              </p>
              <div>
                <em>{t("credential.att-device-interfaces")}</em>{" "}
                <ul>
                  {credential.attestationMetadata.value.transports.map(
                    (transport, index) => (
                      <li key={index}>{transport}</li>
                    )
                  )}
                </ul>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t("credential.edit-cancel-button")}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {t("credential.edit-delete-button")}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t("credential.edit-save-button")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditCredential;
