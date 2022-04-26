import React from "react";
import { useDispatch } from "react-redux";
import { Button, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { credentialActions } from "../../_actions";

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
      credentialActions.delete(credential.credential.credentialId.base64url)
    );
    if (
      credential.credential.credentialId.base64url ===
      localStorage.getItem("trustedDeviceID")
    ) {
      localStorage.removeItem("trustedDevice");
      localStorage.removeItem("trustedDeviceID");
    }
  };

  /**
   * Takes the image URL provided by the credential after attestation
   * If no image is found, then a default is set
   * @param credential
   * @returns URL from the attestation response, or a default image if no icon is present
   */
  const getAttestationImage = (credential) => {
    const imgUrl = credential.attestationMetadata?.value?.icon;
    if (imgUrl) return imgUrl;
    return "https://www.yubico.com/wp-content/uploads//2021/02/illus-shield-lock-r1-dkteal.svg";
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center">
        <div className="p-2">
          <Image
            className={styles.default["security-key-image"]}
            src={getAttestationImage(credential)}
            roundedCircle
          />
        </div>
        <div className="p-2 flex-grow-1">
          <h5>{credential.credentialNickname.value}</h5>
          {credential?.attestationMetadata?.value?.description && (
            <h6>{credential.attestationMetadata.value.description}</h6>
          )}
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
