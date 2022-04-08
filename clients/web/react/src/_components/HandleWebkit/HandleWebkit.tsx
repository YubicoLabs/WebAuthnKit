import React, { useState, useEffect } from "react";
import { create } from "@github/webauthn-json";
import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, Spinner } from "react-bootstrap";

const styles = require("../component.module.css");

/**
 * Modal that handles the registration of users using Safari on Mac and iPhone
 * WebKit requires a user gesture in order to use the create() api for credentials
 * The current registration flow is not within the same "context" for user generation
 * So this button is required to trigger that user gesture to create the credential
 * This modal is treated as a promise, once the attestationResponse is given by create()
 * the flow will return back the the signUp() method in the WebAuthN component to finalize the
 * registration process
 * @param props
 *  props.type: "ios" | "macos"
 *  props.publicKey: Options needed to call create(publicKey) - Handling here as webkit requires credential creation to be triggered by a user event
 *  props.saveCallback: method to call on save, passes fields as the argument
 *  props.closeCallback: method to call when closing the flow, is used to reject a promise
 */
const HandleWebKit = function (props) {
  const { t } = useTranslation();

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
   * create: Sent by the registration flow to create a new U2F Password upon initial registration
   * change: Sent by the homepage when a user wants to change their U2F Password
   * dispatch: Sent by login when a user needs to enter their U2F Password when logging into the service
   */
  const configureModal = (type) => {
    switch (type) {
      case "ios":
        setLabel({
          modalHeader: t("handle-webkit.modal-header-ios"),
          modalText: t("handle-webkit.modal-text-ios"),
          modalPlatAuthButton: t("handle-webkit.modal-platauth-button-ios"),
        });
        break;
      case "macos":
        setLabel({
          modalHeader: t("handle-webkit.modal-header-macos"),
          modalText: t("handle-webkit.modal-text-macos"),
          modalPlatAuthButton: t("handle-webkit.modal-platauth-button-macos"),
        });
        break;
      default:
        setLabel({
          modalHeader: t("handle-webkit.modal-default"),
          modalText: t("handle-webkit.modal-default"),
          modalPlatAuthButton: t("handle-webkit.modal-default"),
        });
        break;
    }
  };

  /**
   * Shows the modal
   */
  const handleShow = () => {
    console.info(
      t("console.info", {
        COMPONENT: "HandleWebKit",
        METHOD: "handleShow()",
        LOG_REASON: t("console.reason.handlewebkit0"),
      })
    );
    setShow(true);
    setContinueSubmitted(false);
  };

  /**
   * Closes the modal
   */
  const handleClose = () => {
    props.closeCallback(new Error(t("handle-webkit.pin-error")));
    setShow(false);
    setContinueSubmitted(false);
  };

  /**
   * Handles the registration of a user
   * This can resolve both security keys && platform authenticators (TouchID and FaceID)
   * Note: TouchID will not be presented as an option if the user is using an external screen with their laptop lid closed
   */
  const handleRegistration = async () => {
    setContinueSubmitted(true);
    console.info(
      t("console.info", {
        COMPONENT: "HandleWebKit",
        METHOD: "handleRegistration()",
        LOG_REASON: t("console.reason.handlewebkit1"),
      }),
      props.publicKey
    );

    try {
      const attestationResponse = await create(props.publicKey);
      props.saveCallback({ ...attestationResponse });
      setShow(false);
      setContinueSubmitted(false);
    } catch (error) {
      setContinueSubmitted(false);
      console.error(
        t("console.error", {
          COMPONENT: "HandleWebKit",
          METHOD: "handleRegistration()",
          REASON: t("console.reason.handlewebkit2"),
        }),
        error
      );
    }
  };

  /**
   * On initializing this component, shows the modal
   */
  useEffect(() => {
    console.info(
      t("console.info", {
        COMPONENT: "HandleWebKit",
        METHOD: "useEffect()",
        LOG_REASON: t("console.reason.handlewebkit3"),
      })
    );
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
          onClick={handleRegistration}>
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
                {t("handle-webkit.button-loading")}
              </span>
            </>
          )}
          {!continueSubmitted && <span>{t("handle-webkit.button")}</span>}
        </Button>
      </ModalBody>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          {t("handle-webkit.close-button")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HandleWebKit;
