import React from "react";
import { Image } from "react-bootstrap";
import EditCredential from "./EditCredential";

const styles = require("../component.module.css");

const checkAttestation = (credential) => {
  const credAtt =
    credential.attestationMetadata?.value?.deviceProperties?.displayName;
  if (credAtt) return true;
  return false;
};

const getAttestationImage = (credential) => {
  const imgUrl =
    credential.attestationMetadata?.value?.deviceProperties?.imageUrl;
  if (imgUrl) return imgUrl;
  return "https://www.yubico.com/wp-content/uploads//2021/02/illus-shield-lock-r1-dkteal.svg";
};

const Credential = function ({ credential }) {
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
          {checkAttestation(credential) && (
            <h6>
              {
                credential.attestationMetadata.value.deviceProperties
                  .displayName
              }
            </h6>
          )}
          <p>
            Date Last used:{" "}
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
