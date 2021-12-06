import React, { useState, useEffect, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Form, Modal, ModalBody } from "react-bootstrap";
import { validate } from "validate.js";
import { alertActions, credentialActions } from "../../_actions";
import styles from "../component.module.css";

// props.type: "create" | "change" | "dispatch" [default]
// props.saveCallback: method to call on save, passes fields as the argument
// props.closeCallback: method to call when closing the flow, is used to reject a promise
const ServerVerifiedPin = function (props) {
  const [pinCollection, setPinCollection] = useState({
    pin: "",
    confirmPin: "",
  });
  const finishUVRequest = useSelector(
    (state) => state.credentials.finishUVRequest
  );
  const [invalidPin, setInvalidPin] = useState(undefined);
  const [invalidConfirmPin, setInvalidConfirmPin] = useState(undefined);
  const [show, setShow] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const inputRef = useRef(null);
  const inputRefNext = useRef(null);
  const [label, setLabel] = useState({
    buttonText: "",
    modalHeader: "",
    modalText: "",
    modalSubmitText: "",
  });
  const constraints = {
    pin: {
      presence: true,
      numericality: {
        onlyInteger: true,
        greaterThan: -1,
      },
      length: {
        minimum: 4,
        maximum: 16,
      },
    },
    confirmPin: {
      equality: "pin",
    },
  };

  /**
   * This method is used to configure the labels on the component depending on the type of UV dispatch that is sent from the parent component
   * @param {*} type possible values are:
   * create: Sent by the registration flow to create a new SVPIN upon initial registration
   * change: Sent by the homepage when a user wants to change their SVPIN
   * dispatch: Sent by login when a user needs to enter their SVPIN when logging into the service
   */
  const configureModal = (type) => {
    switch (type) {
      case "create":
        setLabel({
          buttonText: "",
          modalHeader: "Create Server-Verified PIN",
          modalText: "Please create a Server-Verified PIN",
          modalSubmitText: "Submit PIN",
        });
        setShowButton(false);
        setShowConfirmPin(true);
        break;
      case "change":
        setLabel({
          buttonText: "Change your Server-Verified PIN",
          modalHeader: "Change your Server-Verified PIN",
          modalText: "Enter your new PIN information",
          modalSubmitText: "Change PIN",
        });
        setShowButton(true);
        setShowConfirmPin(true);
        break;
      case "dispatch":
        setLabel({
          buttonText: "",
          modalHeader: "Server-Verified PIN",
          modalText: "Enter your Server-Verified PIN",
          modalSubmitText: "Submit",
        });
        setShowButton(false);
        setShowConfirmPin(false);
        break;
      default:
        setLabel({
          buttonText: "",
          modalHeader: "",
          modalText: "",
          modalSubmitText: "",
        });
        break;
    }
  };

  const validForm = (currentPin, currentConfirmPin) => {
    const pinResult = validate({ pin: currentPin }, constraints);
    if (pinResult) {
      setInvalidPin(pinResult.pin.join(". "));
    } else {
      setInvalidPin(undefined);
    }

    if (showConfirmPin) {
      const confirmPinResult = validate(
        { pin: currentConfirmPin },
        constraints
      );
      if (confirmPinResult) {
        setInvalidConfirmPin(confirmPinResult.pin.join(". "));
      } else {
        setInvalidConfirmPin(undefined);
      }

      const equalityResult = validate(
        { pin: currentPin, confirmPin: currentConfirmPin },
        constraints
      );
      if (equalityResult) {
        if (!confirmPinResult) {
          setInvalidConfirmPin(equalityResult.confirmPin.join(". "));
        }
      }

      return !pinResult && !confirmPinResult && !equalityResult;
    }
    return !pinResult;
  };

  const handleShow = () => {
    setShow(true);
  };

  const handleClose = () => {
    props.closeCallback(
      new Error(
        "PIN Registration Ended - Please attempt to register your security key"
      )
    );
    setShow(false);
  };

  const handleSave = () => {
    if (validForm(pinCollection.pin, pinCollection.confirmPin)) {
      props.saveCallback({ value: pinCollection.pin });
      handleClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // eslint-disable-next-line no-shadow
    setPinCollection((pinCollection) => ({ ...pinCollection, [name]: value }));
    if (name === "pin") {
      validForm(value, pinCollection.confirmPin);
    } else if (name === "confirmPin") {
      validForm(pinCollection.pin, value);
    }
  };

  useEffect(() => {
    configureModal(props.type);
  }, []);

  useEffect(() => {
    if (finishUVRequest !== undefined && props.type !== "change") {
      console.log("showing sv-pin: ", finishUVRequest);
      handleShow();
    }
  }, [finishUVRequest]);

  return (
    <>
      {showButton && (
        <Card className={styles.cardSpacing}>
          <Button onClick={handleShow}>{label.buttonText}</Button>
        </Card>
      )}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header>
          <Modal.Title>{label.modalHeader}</Modal.Title>
        </Modal.Header>
        <Form>
          <ModalBody>
            <p>{label.modalText}</p>
            {/* Implement the main input for pin */}
            <Form.Label>Enter PIN</Form.Label>
            <Form.Control
              name="pin"
              value={pinCollection.pin}
              type="text"
              placeholder="ex. 85943"
              ref={inputRef}
              onChange={handleChange}
              className={`form-control${invalidPin ? " is-invalid" : ""}`}
              onKeyPress={(ev) => {
                if (ev.key === "Enter") {
                  if (showConfirmPin) {
                    inputRefNext.current.focus();
                  } else {
                    handleSave();
                  }
                  ev.preventDefault();
                }
              }}
            />
            {invalidPin ? <Alert variant="danger">{invalidPin}</Alert> : null}
            {/* Implement the main input for confirmation PIN
                This only appears if showConfirmPIn is set to true */}
            {showConfirmPin && (
              <>
                <Form.Label>Confirm PIN</Form.Label>
                <Form.Control
                  name="confirmPin"
                  value={pinCollection.confirmPin}
                  type="text"
                  placeholder="Use the same PIN you used above"
                  ref={inputRefNext}
                  onChange={handleChange}
                  className={`form-control${
                    invalidConfirmPin ? " is-invalid" : ""
                  }`}
                  onKeyPress={(ev) => {
                    if (ev.key === "Enter") {
                      handleSave();
                      ev.preventDefault();
                    }
                  }}
                />
                {invalidConfirmPin ? (
                  <Alert variant="danger">{invalidConfirmPin}</Alert>
                ) : null}
              </>
            )}
          </ModalBody>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {label.modalSubmitText}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ServerVerifiedPin;
