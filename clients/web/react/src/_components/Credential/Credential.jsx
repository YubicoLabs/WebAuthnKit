import React from "react";
import { Image } from "react-bootstrap";
import styles from "../component.module.css";

import { EditCredential } from "./EditCredential";

const checkAttestation = (credential) => {
  const credAtt =
    credential.attestationMetadata?.value?.deviceProperties?.displayName;
  if (credAtt) return true;
  return false;
};

const getAttestationImage = (credential) => {
  const imgUrl =
    credential.attestationMetadata?.value?.deviceProperties?.imageUrl;
  console.log(imgUrl);
  if (imgUrl) return imgUrl;
  return "https://www.yubico.com/wp-content/uploads//2021/02/illus-shield-lock-r1-dkteal.svg";
};

const Credential = function ({ credential }) {
  return (
    <>
      <div className="d-flex justify-content-center align-items-center">
        <div className="p-2">
          <Image
            className={styles["security-key-image"]}
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
      <hr className={styles["section-divider"]} />
    </>
  );
};

export { Credential };
