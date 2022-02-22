import React, { useState, useRef } from "react";

import { Button, Modal, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import validate from "validate.js";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { WebAuthnClient } from "..";
import { alertActions } from "../../_actions";
// eslint-disable-next-line camelcase
import aws_exports from "../../aws-exports";

// eslint-disable-next-line camelcase
axios.defaults.baseURL = aws_exports.apiEndpoint;

const styles = require("../component.module.css");

/**
 * Component used to drive the addition of registering a new trusted device
 * The component is a modal hidden behind a button, when clicked the registration process begins
 * @param continueStep is the callback method that should be triggered once the registration is complete
 *  This callback is primarily used when triggered from the RegisterTrustedDevice login step
 */
const AddTrustedDevice = function ({ continueStep }) {
  const { t } = useTranslation();

  // Loading indicator to prevent the user from triggering multiple registrations
  const [continueSubmitted, setContinueSubmitted] = useState(false);

  const [showAdd, setShowAdd] = useState(false);

  const [nickname, setNickname] = useState("");

  const [invalidNickname, setInvalidNickname] = useState(undefined);

  const [submitted, setSubmitted] = useState(false);

  const dispatch = useDispatch();

  /**
   * Closes the modal
   */
  const handleClose = () => {
    setContinueSubmitted(false);
    setShowAdd(false);
  };

  /**
   * Shows the modal
   */
  const handleShow = () => {
    setNickname("");
    setContinueSubmitted(true);
    setShowAdd(true);
  };
  const constraints = {
    nickname: {
      length: {
        maximum: 20,
      },
    },
  };

  /**
   * Handles the button click to begin registration
   * First the nickname is validated, and if valid then the registration method in this component is called
   */
  const handleSaveAdd = async () => {
    setSubmitted(true);
    setShowAdd(true);

    const result = validate({ nickname }, constraints);
    if (result) {
      setInvalidNickname(result.nickname.join(". "));
    } else {
      setInvalidNickname(undefined);
      setShowAdd(false);
      await register();
    }
  };

  /**
   * Primary logic of this method
   * Calls to the register API, and creates the credential on the authenticator
   * Keep in mind, this method will only allow the user to register a trusted device
   * Removing requireAuthenticatorAttachment from the register POST will allow any key to be registered
   */
  const register = async () => {
    console.log("register");
    console.log("nickname: ", nickname);

    try {
      await WebAuthnClient.registerNewCredential(
        nickname,
        true,
        "PLATFORM",
        null
      );
      dispatch(alertActions.success("Registration successful"));
    } catch (error) {
      dispatch(alertActions.error(error.message));
    }
  };

  /**
   * Validates the credential nickname as the user types
   * @param e Event triggered by user input
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNickname(value);
  };

  const inputRef = useRef(null);

  return (
    <>
      <Modal show={showAdd} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t("trusted-device.add-form-title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>{t("trusted-device.add-form-label")}</label>
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
                ev.preventDefault();
                handleSaveAdd();
              }
            }}
          />
          {invalidNickname ? (
            <Alert variant="danger">{invalidNickname}</Alert>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t("trusted-device.cancel-button")}
          </Button>
          <Button variant="primary" onClick={handleSaveAdd}>
            {t("trusted-device.register-button")}
          </Button>
        </Modal.Footer>
      </Modal>
      <Button
        type="submit"
        onClick={handleShow}
        value="continue"
        variant="primary btn-block mt-3"
        block
        disabled={continueSubmitted}>
        {continueSubmitted && (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            <span className={styles.default["loaderSpan"]}>
              {t("trusted-device.add-button-loading")}
            </span>
          </>
        )}
        {!continueSubmitted && <span>{t("trusted-device.add-button")}</span>}
      </Button>
    </>
  );
};

export default AddTrustedDevice;
