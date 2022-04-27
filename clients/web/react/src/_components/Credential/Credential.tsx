import React from "react";
import { Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import EditCredential from "./EditCredential";

const styles = require("../component.module.css");

/**
 * Checks if the credential has attestation metadata to display and to pass to the Edit component
 * @param credential
 * @returns
 */
const checkAttestation = (credential) => {
  const credAtt =
    credential.attestationMetadata?.value?.deviceProperties?.displayName;
  if (credAtt) return true;
  return false;
};

/**
 * Takes the image URL provided by the credential after attestation
 * If no image is found, then a default is set
 * @param credential
 * @returns
 */
const getAttestationImage = (credential) => {
  const imgUrl = credential.attestationMetadata?.value?.icon;
  if (imgUrl) return imgUrl;
  return "https://www.yubico.com/wp-content/uploads//2021/02/illus-shield-lock-r1-dkteal.svg";
};

/**
 * Component used to display the information of a single Credential
 * Primarily used by the home scree to show base credential details
 * More details can be seen if the user clicks the EDIT button
 * @param param0
 * @returns
 */
const Credential = function ({ credential }) {
  const { t } = useTranslation();

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
          {credential?.attestationMetadata?.value?.description &&
            credential.attestationMetadata.value.description !==
              credential.credentialNickname.value && (
              <h6>{credential.attestationMetadata.value.description}</h6>
            )}
          <p>
            {t("credential.date-last-used")}:{" "}
            {new Date(credential.lastUsedTime.seconds * 1000).toLocaleString()}
          </p>
        </div>
        <div className="m-2">
          <EditCredential credential={credential} />
        </div>
      </div>
      <hr className={styles.default["section-divider"]} />
    </>
  );
};

export default Credential;
