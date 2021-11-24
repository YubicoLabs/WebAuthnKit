import React, { useState, useRef } from "react";

import { create } from "@github/webauthn-json";
import { Button, Modal, Alert } from "react-bootstrap";
import base64url from "base64url";
import cbor from "cbor";
import axios from "axios";
import validate from "validate.js";
import { useDispatch } from "react-redux";
import { credentialActions, alertActions } from "../../_actions";
// eslint-disable-next-line camelcase
import aws_exports from "../../aws-exports";

// eslint-disable-next-line camelcase
axios.defaults.baseURL = aws_exports.apiEndpoint;

const AddCredential = function () {
  const [showAdd, setShowAdd] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isResidentKey, setIsResidentKey] = useState(false);
  const [invalidNickname, setInvalidNickname] = useState(undefined);
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useDispatch();

  const handleClose = () => setShowAdd(false);
  const handleShow = () => {
    setNickname("");
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

  const handleSaveAdd = () => {
    setSubmitted(true);

    const result = validate({ nickname }, constraints);
    if (result) {
      setInvalidNickname(result.nickname.join(". "));
    } else {
      setInvalidNickname(undefined);
      setShowAdd(false);
      register();
    }
  };

  const handleCheckboxChange = (e) => {
    const { target } = e;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setIsResidentKey(value);
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

  const register = () => {
    console.log("register");
    console.log("nickname: ", nickname);

    axios
      .post("/users/credentials/fido2/register", {
        nickname,
        requireResidentKey: isResidentKey,
      })
      .then((startRegistrationResponse) => {
        console.log(startRegistrationResponse);

        const { requestId } = startRegistrationResponse.data;

        const publicKey = {
          publicKey:
            startRegistrationResponse.data.publicKeyCredentialCreationOptions,
        };
        console.log("publlicKey: ", publicKey);

        create(publicKey)
          .then((makeCredentialResponse) => {
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

            if (uv === true) {
              if (uv === true) {
                console.log("finishRegistration: ", challengeResponse);
                dispatch(credentialActions.registerFinish(challengeResponse));
              } else {
                dispatch(credentialActions.getUV(challengeResponse));
              }
            }
          })
          .catch((error) => {
            console.error(error);
            dispatch(alertActions.error(error.message));
          });
      })
      .catch((error) => {
        console.error(error);
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
          <Modal.Title>Add a new security key</Modal.Title>
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
            Enable usernameless login with this key
            <br />
            <em>
              <small>
                Note: Passwordless requires a FIDO2 device and a browser that
                supports it.
              </small>
            </em>
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAdd}>
            Register security key
          </Button>
        </Modal.Footer>
      </Modal>
      <Button variant="primary" onClick={handleShow}>
        Add a new security key
      </Button>
    </>
  );
};

export { AddCredential };
