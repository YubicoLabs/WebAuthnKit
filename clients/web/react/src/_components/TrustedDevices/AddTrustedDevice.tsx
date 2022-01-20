import React, { useState, useRef, ReactElement } from "react";

import { create } from "@github/webauthn-json";
import { Button, Modal, Alert, Spinner } from "react-bootstrap";
import base64url from "base64url";
import cbor from "cbor";
import axios from "axios";
import validate from "validate.js";
import { useDispatch } from "react-redux";
import { credentialActions, alertActions } from "../../_actions";
import { TrustedDeviceHelper } from "./TrustedDeviceHelper";
// eslint-disable-next-line camelcase
import aws_exports from "../../aws-exports";

// eslint-disable-next-line camelcase
axios.defaults.baseURL = aws_exports.apiEndpoint;

const styles = require("../component.module.css");

const AddTrustedDevice = function ({ continueStep }) {
  const [continueSubmitted, setContinueSubmitted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [nickname, setNickname] = useState("");
  const [invalidNickname, setInvalidNickname] = useState(undefined);
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useDispatch();

  const handleClose = () => {
    setContinueSubmitted(false);
    setShowAdd(false);
  };
  const handleShow = () => {
    setNickname("");
    setContinueSubmitted(true);
    setShowAdd(true);
  };
  const defaultInvalidPIN = -1;
  const constraints = {
    nickname: {
      length: {
        maximum: 20,
      },
    },
  };

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

  function getUV(attestationObject) {
    const attestationBuffer = base64url.toBuffer(attestationObject);
    const attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
    const buffer = attestationStruct.authData;

    const flagsBuf = buffer.slice(32, 33);
    const flagsInt = flagsBuf[0];
    const flags = {
      up: !!(flagsInt & 0x01),
      uv: !!(flagsInt & 0x04),
      at: !!(flagsInt & 0x40),
      ed: !!(flagsInt & 0x80),
      flagsInt,
    };
    return flags.uv;
  }

  const register = async () => {
    console.log("register");
    console.log("nickname: ", nickname);

    axios
      .post("/users/credentials/fido2/register", {
        nickname,
        requireResidentKey: true,
        requireAuthenticatorAttachment: "PLATFORM",
      })
      .then(async (startRegistrationResponse) => {
        console.log(startRegistrationResponse);

        const { requestId } = startRegistrationResponse.data;

        const publicKey = {
          publicKey:
            startRegistrationResponse.data.publicKeyCredentialCreationOptions,
        };
        console.log("publlicKey: ", publicKey);

        create(publicKey)
          .then(async (makeCredentialResponse) => {
            console.log(
              `make credential response: ${JSON.stringify(
                makeCredentialResponse
              )}`
            );

            const uv = getUV(makeCredentialResponse.response.attestationObject);
            console.log("uv: ", uv);

            const challengeResponse = {
              credential: makeCredentialResponse,
              requestId,
              pinSet: startRegistrationResponse.data.pinSet,
              pinCode: defaultInvalidPIN,
              nickname,
            };

            console.log("challengeResponse: ", challengeResponse);

            console.log("finishRegistration: ", challengeResponse);
            dispatch(credentialActions.registerFinish(challengeResponse));
            TrustedDeviceHelper.setTrustedDevice(
              TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED,
              challengeResponse.credential.id
            );
            continueStep();
          })
          .catch((error) => {
            setContinueSubmitted(false);
            if (
              error.message ===
              "The user attempted to register an authenticator that contains one of the credentials already registered with the relying party."
            ) {
              dispatch(
                alertActions.success("Trusted Device is already registered")
              );
              continueStep();
            } else {
              console.error(error);
              dispatch(alertActions.error(error.message));
            }
          });
      })
      .catch((error) => {
        console.error(error);
        setShowAdd(false);
        setContinueSubmitted(false);
        dispatch(alertActions.error(error.message));
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNickname(value);
  };

  const inputRef = useRef(null);

  return (
    <>
      <Modal show={showAdd} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add a new trusted device</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>Nickname</label>
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
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAdd}>
            Register Trusted Device
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
              Adding your device
            </span>
          </>
        )}
        {!continueSubmitted && <span>Add this device now</span>}
      </Button>
    </>
  );
};

export default AddTrustedDevice;
