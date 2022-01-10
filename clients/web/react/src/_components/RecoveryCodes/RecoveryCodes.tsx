import React, { useState, useEffect } from "react";

import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Alert, Button, Card, Modal } from "react-bootstrap";
import { credentialActions } from "../../_actions";

const PropTypes = require("prop-types");
const styles = require("../component.module.css");

const RecoveryCodes = function ({ credentials }) {
  const recoveryCodesViewed = credentials.recoveryCodesViewed;
  const allRecoveryCodesUsed = credentials.allRecoveryCodesUsed;
  const recoveryCodes = useSelector(
    (state: RootStateOrAny) => state.recoveryCodes
  );
  const [showCodes, setShowCodes] = useState(false);
  const dispatch = useDispatch();

  const handleClose = () => {
    setShowCodes(false);
  };
  const handleShow = () => {
    setShowCodes(true);
    dispatch(credentialActions.listRecoveryCodes());
  };
  const handleGenerate = () => {
    setShowCodes(true);
    dispatch(credentialActions.generateRecoveryCodes());
  };

  useEffect(() => {
    if (!recoveryCodesViewed || allRecoveryCodesUsed) {
      handleShow();
    }
  }, [recoveryCodesViewed, allRecoveryCodesUsed]);

  return (
    <>
      <Card className={styles.default["cardSpacing"]}>
        <Card.Header>
          <h5>Recovery Options</h5>
        </Card.Header>
        <Card.Body>
          <Button variant="link" onClick={handleShow}>
            Recovery Codes
          </Button>
        </Card.Body>
      </Card>
      <Modal show={showCodes} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Recovery Codes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>
            Protect your recovery codes as you would a password. We recommend
            saving them in a safe spot, such as password manager.
          </label>
          <Alert variant="warning">
            If you lose you all your authenticators and don't have the recovery
            codes you will lose access to your account.
          </Alert>
          {recoveryCodes.loading && <em>Loading recovery codes...</em>}
          {recoveryCodes.generating && <em>Generating recovery codes...</em>}
          {recoveryCodes.error && (
            <span className="text-danger">ERROR: {recoveryCodes.error}</span>
          )}
          {recoveryCodes.codesRemaining &&
          recoveryCodes.codesRemaining === 0 ? (
            <em>Please generate new recovery codes now.</em>
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
            <Alert variant="warning">
              Save your recovery codes now. They will not be shown again.
            </Alert>
          )}
          {recoveryCodes.codesRemaining && recoveryCodes.codesRemaining > 0 ? (
            <em>{recoveryCodes.codesRemaining} recovery codes remaining.</em>
          ) : (
            ""
          )}
          {allRecoveryCodesUsed &&
            (!recoveryCodes.generating || !recoveryCodes.codes) && (
              <em className="text-danger">
                All recovery codes have been used. Please generate new recovery
                codes now.
              </em>
            )}
          <p />
          <h6>Generate new recovery codes</h6>
          <label>
            When you generate new recovery codes, you must copy them to a safe
            spot. Your old codes will not work anymore.
          </label>
          <Button variant="secondary" onClick={handleGenerate}>
            Generate
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Close
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
