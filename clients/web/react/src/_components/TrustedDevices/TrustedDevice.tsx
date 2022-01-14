import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Image } from "react-bootstrap";
import { credentialActions } from "../../_actions";

const styles = require("../component.module.css");
const TrustedDevice = function ({ credential }) {
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(
      credentialActions.delete(credential.credential.credentialId.base64)
    );
    if (
      credential.credential.credentialId.base64 ===
      localStorage.getItem("trustedDeviceID")
    ) {
      localStorage.removeItem("trustedDevice");
      localStorage.removeItem("trustedDeviceID");
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center">
        <div className="p-2">
          <Image
            className={styles.default["security-key-image"]}
            src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg"
            roundedCircle
          />
        </div>
        <div className="p-2 flex-grow-1">
          <h5>{credential.credentialNickname.value}</h5>
          <p>
            Date Last used:{" "}
            {new Date(credential.lastUsedTime.seconds * 1000).toLocaleString()}
          </p>
        </div>
        <div className="m-2">
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
      <hr className={styles.default["section-divider"]} />
    </>
  );
};

export default TrustedDevice;
