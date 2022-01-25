import React, { useState, useRef } from "react";

import { Button, Modal, Alert } from "react-bootstrap";
import { useDispatch } from "react-redux";
import validate from "validate.js";
import { credentialActions } from "../../_actions";

/**
 * Component used to display additional details about a credential, as well as allowing
 * the user to update the nickname, or delete
 * @param credential Data related to a specific credential
 * @returns
 */
const EditCredential = function ({ credential }) {
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

    console.log(value);

    const result = validate({ nickname: value }, constraints);
    if (result) {
      console.log("Here");
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
        Edit
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit your security key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>
            Nickname{" "}
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
            <em>Usernameless a.k.a. Client-Side Discoverable Credential:</em>{" "}
            {credential.registrationRequest
              ? credential.registrationRequest.requireResidentKey.toString()
              : ""}
          </label>
          <br />
          <label>
            <em>Last Used Time:</em>{" "}
            {credential.lastUsedTime
              ? new Date(
                  credential.lastUsedTime.seconds * 1000
                ).toLocaleString()
              : ""}
          </label>
          <br />
          <label>
            <em>Last Updated Time:</em>{" "}
            {credential.lastUpdatedTime
              ? new Date(
                  credential.lastUpdatedTime.seconds * 1000
                ).toLocaleString()
              : ""}
          </label>
          <br />
          <label>
            <em>Registration Time:</em>{" "}
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
              <h4 style={{ color: "#9aca3c" }}>Yubico Device Information:</h4>
              <label>
                <em>Device Name:</em>{" "}
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
                  Device Info
                </a>
              </label>
              <label>
                <em>Available Interfaces:</em>{" "}
                <ul>
                  {credential.attestationMetadata.value.transports.map(
                    (transport, index) => (
                      <li key={index}>{transport}</li>
                    )
                  )}
                </ul>
              </label>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditCredential;
