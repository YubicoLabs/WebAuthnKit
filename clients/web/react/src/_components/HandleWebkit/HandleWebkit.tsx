import React, { useState, useEffect } from "react";
import { create } from "@github/webauthn-json";

import { Button, Modal, ModalBody, Spinner } from "react-bootstrap";

const styles = require("../component.module.css");

// props.type: "ios" | "macos"
// props.publicKey: Options needed to call create(publicKey) - Handling here as webkit requires credential creation to be triggered by a user event
// props.saveCallback: method to call on save, passes fields as the argument
// props.closeCallback: method to call when closing the flow, is used to reject a promise
const HandleWebKit = function (props) {
  const [show, setShow] = useState(false);
  const [continueSubmitted, setContinueSubmitted] = useState(false);
  const [label, setLabel] = useState({
    modalHeader: "",
    modalText: "",
    modalPlatAuthButton: "",
  });

  /**
   * This method is used to configure the labels on the component depending on the type of UV dispatch that is sent from the parent component
   * @param {*} type possible values are:
   * create: Sent by the registration flow to create a new SVPIN upon initial registration
   * change: Sent by the homepage when a user wants to change their SVPIN
   * dispatch: Sent by login when a user needs to enter their SVPIN when logging into the service
   */
  const configureModal = (type) => {
    switch (type) {
      case "ios":
        setLabel({
          modalHeader: "Select your registration method",
          modalText:
            "Click the button below to register with FaceID or your security key",
          modalPlatAuthButton: "FaceID",
        });
        break;
      case "macos":
        setLabel({
          modalHeader: "Select your registration method",
          modalText: "Click the button below to register your security key",
          modalPlatAuthButton: "TouchID",
        });
        break;
      default:
        setLabel({
          modalHeader: "",
          modalText: "",
          modalPlatAuthButton: "",
        });
        break;
    }
  };

  const handleShow = () => {
    console.log(`HandleWebKit Showing Modal`);
    setShow(true);
    setContinueSubmitted(false);
  };

  const handleClose = () => {
    props.closeCallback(
      new Error(
        "PIN Registration Ended - Please attempt to register your security key"
      )
    );
    setShow(false);
    setContinueSubmitted(false);
  };

  const handleSecKey = async () => {
    setContinueSubmitted(true);
    console.log("HandleWebKit handleSecKey() publicKey: ", props.publicKey);

    try {
      const attestationResponse = await create(props.publicKey);
      props.saveCallback({ ...attestationResponse });
      setShow(false);
      setContinueSubmitted(false);
    } catch (error) {
      setContinueSubmitted(false);
      console.error("HandleWebKit handleSecKey() Error: ", error);
    }
  };

  /* Saving for when Plat Auth are available on Safari on the Mac
  const handlePlatAuth = async () => {
    const publicKeyCopy = { ...props.publicKey };
    publicKeyCopy.publicKey.authenticatorSelection.authenticatorAttachment =
      "platform";
    publicKeyCopy.publicKey.attestation = "direct";
    console.log("HandleWebKit handlePlatAuth() publicKey: ", publicKeyCopy);
    let attestationResponse = {};
    try {
      attestationResponse = await create(publicKeyCopy);
      console.log(attestationResponse);
    } catch (err) {
      console.warn(err);
    }
    console.log(attestationResponse);
    props.saveCallback({ ...attestationResponse });
    setShow(false);
  };
  */

  useEffect(() => {
    console.log(`HandleWebKit Configuring Props and Showing Modal`);
    configureModal(props.type);
    handleShow();
  }, []);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header>
        <Modal.Title>{label.modalHeader}</Modal.Title>
      </Modal.Header>
      <ModalBody>
        <p>{label.modalText}</p>
        <Button
          variant="primary"
          size="lg"
          block
          disabled={continueSubmitted}
          onClick={handleSecKey}>
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
                Creating your account
              </span>
            </>
          )}
          {!continueSubmitted && <span>Complete your registration</span>}
        </Button>
        {/**
        <Button variant="secondary" size="lg" block onClick={handlePlatAuth}>
          {label.modalPlatAuthButton}
        </Button>
        */}
      </ModalBody>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HandleWebKit;
