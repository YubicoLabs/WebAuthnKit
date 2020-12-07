import React, { useState, useEffect, useRef, Profiler } from 'react';
import { Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import validate from 'validate.js';

export function ServerVerifiedPin(props) {
    // props.type: "create" | "change" | "dispatch" [default]
    // props.saveCallback: method to call on save, passes fields as the argument
    // props.showSelector: if defined then show sv-pin modal

    const [show, setShow] = useState(false);
    const [fields, handleFieldChange] = useState({
        pin: "",
        confirmPin: "",
    });
    const [invalidPin, setInvalidPin] = useState(undefined);
    const [invalidConfirmPin, setInvalidConfirmPin] = useState(undefined);
    const inputRef = useRef(null);
    const inputRefNext = useRef(null);
    const [uVSubmitted, setUvSubmitted] = useState(false);
    const [label, setLabel] = useState({
        header: "",
        button: "",
        modalHeader: "",
        modalPin: "",
        modalConfirmPin: "",
        modalSaveButton: ""
    });
    const [showConfirmPin, setShowConfirmPin] = useState(true);
    const [showButton, setShowButton] = useState(false);
    var constraints = {
        pin: {
            presence: true,
            numericality: {
                onlyInteger: true,
                greaterThan: -1,
            },
            length: {
                minimum: 4,
                maximum: 16
            }
        },
        confirmPin: {
            equality: "pin"
        }
    };


    useEffect(() => {
        configureModal(props.type);
    }, []);

    useEffect(() => {
        if(show) {
            inputRef.current.focus();
        }
    }, [show]);

    useEffect(() => {
        if(props.showSelector !== undefined) {
            console.log("showing sv-pin: ", props.showSelector);
            handleShow();
        }
    }, [props.showSelector]);

    const configureModal = (type) => {
        switch (type) {
            case "create": 
                setLabel({
                    header: "Server-Verified PIN",
                    button: "Server-Verified PIN",
                    modalHeader: "Server-Verified PIN",
                    modalPin: "Please create a server-verified PIN",
                    modalConfirmPin: "Confirm PIN",
                    modalSaveButton: "OK"
                });
                setShowConfirmPin(true);
                setShowButton(false);
                break;
            case "change":
                setLabel({
                    header: "Server-Verified PIN",
                    button: "Change server-verified PIN",
                    modalHeader: "Change your Server-Verified PIN",
                    modalPin: "New PIN",
                    modalConfirmPin: "Confirm PIN",
                    modalSaveButton: "Save Changes"
                });
                setShowConfirmPin(true);
                setShowButton(true);
                break;
            case "dispatch":
            default:
                setLabel({
                    header: "Server-Verified PIN",
                    button: "Server-Verified PIN",
                    modalHeader: "Enter Server-Verified PIN",
                    modalPin: "PIN",
                    modalConfirmPin: "",
                    modalSaveButton: "OK"
                });
                setShowConfirmPin(false);
                setShowButton(false);
        }
        return type;
    }
    
    const handleClose = () => {
        setShow(false);
        setUvSubmitted(false);
    }
    
    const handleCancel = () => {
        setShow(false);
        setUvSubmitted(false);
    }
    
    const handleSave = () => {
        setUvSubmitted(true);
        if(validForm(fields.pin, setInvalidPin, fields.confirmPin, setInvalidConfirmPin)) {
            props.saveCallback(fields);
            setShow(false);
        } else {
            //do nothing
        }
    }
    
    const handleShow = () => {
        setUvSubmitted(false);
        setShow(true);
    }
    
    function handleChange(e) {
        const { name, value } = e.target;
        handleFieldChange(fields => ({ ...fields, [name]: value }));
        if (name === "pin") {
            validForm(value, setInvalidPin, fields.confirmPin, setInvalidConfirmPin);
        } else if(name === "confirmPin") {
            validForm(fields.pin, setInvalidPin, value, setInvalidConfirmPin);
        }
    }
    
    const validForm = (pin, pinCallback, confirmPin, confirmPinCallback) => {
        const pinResult = validate({pin: pin}, constraints);
        if(pinResult){
            pinCallback(pinResult.pin.join(". "));
        } else {
            pinCallback(undefined);
        }

        if(showConfirmPin) {
            const confirmPinResult = validate({pin: confirmPin}, constraints);
            if(confirmPinResult){
                confirmPinCallback(confirmPinResult.pin.join(". "));
            } else {
                confirmPinCallback(undefined);
            }

            const equalityResult = validate({pin: pin, confirmPin: confirmPin}, constraints);
            if(equalityResult) {
                if (!confirmPinResult) {
                    confirmPinCallback(equalityResult.confirmPin.join(". "));
                }
            }

            return ( !pinResult && !confirmPinResult && !equalityResult );
        } else {
            return !pinResult;
        }
    }

    return (
        <>
            {showButton ?
            <>
                <h3>{label.header}</h3>
                        <Button variant="primary" onClick={handleShow}>
                            {label.button}
                        </Button>
                <p></p>
            </>
            : null}
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{label.modalHeader}</Modal.Title>
                </Modal.Header>
                <Form>
                <Modal.Body>
                    <label>{label.modalPin}</label>
                    <input type="password" name="pin" value={fields.pin} onChange={handleChange} ref={inputRef} className={'form-control' + (uVSubmitted && invalidPin ? ' is-invalid' : '')} onKeyPress={(ev) => {
                            if (ev.key === 'Enter') {
                                if(showConfirmPin) {
                                    inputRefNext.current.focus();
                                } else {
                                    handleSave();
                                }
                                ev.preventDefault();
                            }
                        }}/> 
                    { invalidPin ? <Alert variant="danger">{invalidPin}</Alert> : null }
                    {showConfirmPin ? 
                        <>
                        <label>{label.modalConfirmPin}</label>
                        <input type="password" name="confirmPin" value={fields.confirmPin} onChange={handleChange} ref={inputRefNext} className={'form-control' + (uVSubmitted && invalidConfirmPin ? ' is-invalid' : '')} onKeyPress={(ev) => {
                                if (ev.key === 'Enter') {
                                    handleSave();
                                    ev.preventDefault();
                                }
                            }}/> 
                        { invalidConfirmPin ? <Alert variant="danger">{invalidConfirmPin}</Alert> : null }
                        </>
                    : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {label.modalSaveButton}
                    </Button>
                </Modal.Footer>
                </Form>
            </Modal>
        </> 
    );
}
