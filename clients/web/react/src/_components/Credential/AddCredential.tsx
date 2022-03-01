import React, { useState, useRef, ReactElement } from "react";

import { Button, Modal, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import validate from "validate.js";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { credentialActions, alertActions } from "../../_actions";
import ServerVerifiedPin from "../ServerVerifiedPin/ServerVerifiedPin";
import AddCredentialGuidance from "./AddCredentialGuidance";
// eslint-disable-next-line camelcase
import aws_exports from "../../aws-exports";
import { WebAuthnClient } from "..";

// eslint-disable-next-line camelcase
axios.defaults.baseURL = aws_exports.apiEndpoint;

const styles = require("../component.module.css");

/**
 * Component used to add a new credential
 */
const AddCredential = function () {
  const { t } = useTranslation();

  const [showAdd, setShowAdd] = useState(false);

  // Will load the SVPIN component if the new credential is non-FIDO2
  const [serverVerifiedPin, setServerVerifiedPin] = useState<ReactElement>();

  const [nickname, setNickname] = useState("");

  const [isResidentKey, setIsResidentKey] = useState(false);

  const [invalidNickname, setInvalidNickname] = useState(undefined);

  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const dispatch = useDispatch();

  /**
   * Closes the modal for registering a new credential
   * @returns
   */
  const handleClose = () => setShowAdd(false);
  const handleShow = () => {
    setNickname("");
    setShowAdd(true);
    setAlertMessage("");
  };
  // Default PIN used if this is a FIDO2 key
  const defaultInvalidPIN = -1;
  const constraints = {
    keyName: {
      length: {
        minimum: 1,
        maximum: 20,
      },
    },
  };

  /**
   * Called when the user submits the new key registration
   * First the nickname of the key is validated, then the register method in this component is called
   */
  const handleSaveAdd = async () => {
    setSubmitted(true);

    const result = validate({ keyName: nickname }, constraints);
    if (result) {
      setInvalidNickname(result.keyName.join(". "));
    } else {
      setInvalidNickname(undefined);
      setLoading(true);
      try {
        await register();
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  /**
   * Updates the value of the checkbox if the user wishes to write a resident credential
   * @param e Event triggered by a user action (clicking the checkbox)
   */
  const handleCheckboxChange = (e) => {
    const { target } = e;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setIsResidentKey(value);
  };

  /**
   * If the key is a U2F key, then a SVPIN needs to be configured on key registration
   * This promise allows the ServerVerifiedPIN to be initialized by the WebAuthN component through a promise
   * This Step will configure the ServerVerifiedPIN components properties, and await for a Save response to be sent from the component
   * @param challengeResponse sent from WebAuthN component that is used to dispatch the event to start PIN registration
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
  const UVPromise = (): Promise<{ value: number }> => {
    return new Promise((resolve, reject) => {
      const svpinCreateProps = {
        type: "create",
        saveCallback: resolve,
        closeCallback: reject,
      };
      setServerVerifiedPin(<ServerVerifiedPin {...svpinCreateProps} />);
    });
  };

  /**
   * If the key is a U2F key, then a SVPIN needs to be configured on key registration
   * This promise allows the ServerVerifiedPIN to be initialized by the WebAuthN component through a promise
   * This Step will configure the ServerVerifiedPIN components properties, and await for a Save response to be sent from the component
   * @param challengeResponse sent from WebAuthN component that is used to dispatch the event to start PIN registration
   * @returns A promise containing the PIN to be used for registration in the WebAuthN component
   */
  async function registerUV(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    return pinResult.value;
  }

  /**
   * Primary logic of this method
   * Calls to the register API, and creates the credential on the security key
   * Removing requireAuthenticatorAttachment will allow for the registration of both roaming authenticator and platform
   * Current state will only allow for roaming authenticators
   */
  const register = async () => {
    console.log("Beginning key registration process");
    console.log("register() nickname: ", nickname);

    try {
      await WebAuthnClient.registerNewCredential(
        nickname,
        isResidentKey,
        "CROSS_PLATFORM",
        registerUV
      );
      dispatch(alertActions.success("Registration successful"));
      setAlertMessage("");
    } catch (error) {
      dispatch(alertActions.error(error.message));
      setAlertMessage(error.message);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNickname(value);

    const result = validate({ keyName: value }, constraints);
    if (result) {
      setInvalidNickname(result.keyName.join(". "));
    } else {
      setInvalidNickname(undefined);
    }
  };

  const inputRef = useRef(null);

  return (
    <>
      <Modal show={showAdd} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t("credential.add-header")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alertMessage !== "" ? (
            <Alert variant="danger">{alertMessage}</Alert>
          ) : (
            <></>
          )}
          <AddCredentialGuidance />

          <label>{t("credential.add-form-label")}</label>
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
                handleSaveAdd();
                ev.preventDefault();
              }
            }}
          />
          {invalidNickname ? (
            <Alert variant="danger">{invalidNickname}</Alert>
          ) : null}
          <br />
          <label>
            <input
              name="isResidentKey"
              type="checkbox"
              checked={isResidentKey}
              onChange={handleCheckboxChange}
            />{" "}
            {t("credential.usernameless-label")}
            <br />
            <em>
              <small>{t("credential.usernameless-note")}</small>
            </em>
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t("credential.add-cancel-button")}
          </Button>

          <Button
            type="submit"
            onClick={handleSaveAdd}
            variant="primary"
            disabled={loading}>
            {loading && (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className={styles.default["loaderSpan"]}>
                  {t("credential.add-primary-button-loading")}
                </span>
              </>
            )}
            {!loading && <span>{t("credential.add-primary-button")}</span>}
          </Button>
        </Modal.Footer>
      </Modal>
      <Button variant="primary" onClick={handleShow}>
        {t("credential.add-header")}
      </Button>
      {serverVerifiedPin}
    </>
  );
};

export default AddCredential;
