import React from "react";
import { useDispatch } from "react-redux";
import { Button, Image } from "react-bootstrap";
import { credentialActions } from "../../_actions";
import { useTranslation } from "react-i18next";

const styles = require("../component.module.css");

/**
 * Component used to display the details of a Trusted Device
 * @param credential credential item with details specific to a single credential
 */
const TrustedDevice = function ({ credential }) {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  /**
   * Handles the pressing of the delete button
   * IF the ID of the deleted device matches the ID of the Trusted Device locally stored
   * then it removes any local information related to the trusted device
   */
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
            {t("trusted-device.date-last-used")}{" "}
            {new Date(credential.lastUsedTime.seconds * 1000).toLocaleString()}
          </p>
        </div>
        <div className="m-2">
          <Button variant="danger" onClick={handleDelete}>
            {t("trusted-device.delete-button")}
          </Button>
        </div>
      </div>
      <hr className={styles.default["section-divider"]} />
    </>
  );
};

export default TrustedDevice;
