import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Alert, Button, Card, Modal } from "react-bootstrap";
import { credentialActions } from "../../_actions";

const PropTypes = require("prop-types");
const styles = require("../component.module.css");

/**
 * Component used to display information related to recovery codes including:
 * Recovery code generation
 * Listing recovery codes
 * Displaying the number of recovery codes available to the user
 * @param credentials generated from getAll() in home, includes information only specific to recovery codes
 */
const RecoveryCodes = function ({ credentials }) {
  const { t } = useTranslation();

  // Indicated if the recovery codes have been viewed - If they have then the application
  // Should not re-display the codes, instead new codes should be generated
  const { recoveryCodesViewed } = credentials;

  // Indicates if all codes have been consumed by login
  const { allRecoveryCodesUsed } = credentials;

  const [ignoreModal, setIgnoreMoral] = useState(
    localStorage.getItem("recoveryCodesModal") === "true"
  );

  const recoveryCodes = useSelector(
    (state: RootStateOrAny) => state.recoveryCodes
  );

  const [showCodes, setShowCodes] = useState(false);

  const dispatch = useDispatch();

  /**
   * Closes the modal
   */
  const handleClose = () => {
    setShowCodes(false);
  };
  /**
   * Shows the modal once the button has been clicked
   */
  const handleShow = () => {
    setShowCodes(true);
    dispatch(credentialActions.listRecoveryCodes());
  };

  /**
   * Generates new recovery codes by calling to the backend API using the credential action
   */
  const handleGenerate = () => {
    setShowCodes(true);
    dispatch(credentialActions.generateRecoveryCodes());
  };

  const handleIgnore = () => {
    localStorage.setItem("recoveryCodesModal", "true");
    setShowCodes(false);
  };

  /**
   * The modal will continue to appear on the parent component if the user has not generated new credentials
   * OR if all the codes have been consumed
   */
  useEffect(() => {
    if ((!recoveryCodesViewed || allRecoveryCodesUsed) && !ignoreModal) {
      handleShow();
    }
  }, [recoveryCodesViewed, allRecoveryCodesUsed]);

  useEffect(() => {
    if (localStorage.getItem("recoveryCodesModal") === "true") {
      setIgnoreMoral(true);
    }
  }, []);

  return (
    <>
      <Card className={styles.default["cardSpacing"]}>
        <Card.Header>
          <h5> {t("recovery-codes.header")}</h5>
        </Card.Header>
        <Card.Body>
          <Button variant="dark" onClick={handleShow}>
            {t("recovery-codes.button-label")}
          </Button>
        </Card.Body>
      </Card>
      <Modal show={showCodes} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t("recovery-codes.modal-header")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>{t("recovery-codes.body-text")}</label>
          <Alert variant="warning">{t("recovery-codes.body-warning")}</Alert>
          {recoveryCodes.loading && (
            <em>{t("recovery-codes.loading-codes")}</em>
          )}
          {recoveryCodes.generating && (
            <em>{t("recovery-codes.generating-codes")}</em>
          )}
          {recoveryCodes.error && (
            <span className="text-danger">
              {t("recovery-codes.error")} {recoveryCodes.error}
            </span>
          )}
          {recoveryCodes.codesRemaining &&
          recoveryCodes.codesRemaining === 0 ? (
            <em>{t("recovery-codes.generate-new-codes")}</em>
          ) : (
            ""
          )}
          {recoveryCodes.codes && (
            <ul>
              <li>{recoveryCodes.codes[0]}</li>
              <li>{recoveryCodes.codes[1]}</li>
              <li>{recoveryCodes.codes[2]}</li>
              <li>{recoveryCodes.codes[3]}</li>
              <li>{recoveryCodes.codes[4]}</li>
            </ul>
          )}
          {recoveryCodes.codes && (
            <Alert variant="warning">{t("recovery-codes.save-codes")}</Alert>
          )}
          {recoveryCodes.codesRemaining && recoveryCodes.codesRemaining > 0 ? (
            <em>
              {recoveryCodes.codesRemaining}{" "}
              {t("recovery-codes.codes-remaining")}
            </em>
          ) : (
            ""
          )}
          {allRecoveryCodesUsed &&
            (!recoveryCodes.generating || !recoveryCodes.codes) && (
              <em className="text-danger">
                {t("recovery-codes.all-codes-used")}
              </em>
            )}
          <p />
          <h6>{t("recovery-codes.generate-codes")}</h6>
          <label>{t("recovery-codes.generate-codes-text")}</label>
          <Button variant="secondary" onClick={handleGenerate}>
            {t("recovery-codes.generate-codes-button")}
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} variant="primary btn-block mt-3">
            {t("recovery-codes.close-button")}
          </Button>
          <Button onClick={handleIgnore} variant="light btn-block mt-3">
            {t("recovery-codes.ignore")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

RecoveryCodes.propTypes = {
  credentials: PropTypes.any.isRequired,
};

export default RecoveryCodes;
