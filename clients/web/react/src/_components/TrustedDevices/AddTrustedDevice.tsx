import React, { useState, useRef, ReactElement } from "react";

import { create } from "@github/webauthn-json";
import { history } from "../../_helpers";
import { Button, Modal, Alert } from "react-bootstrap";
import base64url from "base64url";
import cbor from "cbor";
import axios from "axios";
import validate from "validate.js";
import { useDispatch } from "react-redux";
import { credentialActions, alertActions } from "../../_actions";
import ServerVerifiedPin from "../ServerVerifiedPin/ServerVerifiedPin";
import { TrustedDeviceHelper } from "./TrustedDeviceHelper";
// eslint-disable-next-line camelcase
import aws_exports from "../../aws-exports";

// eslint-disable-next-line camelcase
axios.defaults.baseURL = aws_exports.apiEndpoint;

const AddTrustedDevice = function ({ continueStep }) {
  const [showAdd, setShowAdd] = useState(false);
  const [serverVerifiedPin, setServerVerifiedPin] = useState<ReactElement>();
  const [nickname, setNickname] = useState("");
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

  const UVPromise = (): Promise<{ value: number }> => {
    return new Promise((resolve, reject) => {
      const svpinCreateProps = {
        type: "create",
        saveCallback: resolve,
        closeCallback: reject,
      };
      console.log("SignUpStep UVPromise(): ", svpinCreateProps);
      setServerVerifiedPin(<ServerVerifiedPin {...svpinCreateProps} />);
    });
  };

  async function registerUV(challengeResponse) {
    dispatch(credentialActions.getUV(challengeResponse));
    const pinResult = await UVPromise();
    console.log("SignUpStep PIN Result: ", pinResult.value);
    return pinResult.value;
  }

  const register = async () => {
    console.log("register");
    console.log("nickname: ", nickname);

    axios
      .post("/users/credentials/fido2/register", {
        nickname,
        requireResidentKey: true,
        requireAuthenticatorAttachment: true,
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
                handleSaveAdd();
                ev.preventDefault();
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
      <Button variant="primary btn-block mt-3" onClick={handleShow}>
        Add this device now
      </Button>
      {serverVerifiedPin}
    </>
  );
};

export default AddTrustedDevice;
