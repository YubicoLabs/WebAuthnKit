import React from "react";
import { Image } from "react-bootstrap";
import styles from "../component.module.css";

import { EditCredential } from "./EditCredential";

const Credential = function ({ credential }) {
  return (
    <>
      <div className="d-flex justify-content-center align-items-center">
        <div className="p-2">
          <Image
            className={styles["security-key-image"]}
            src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png"
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
          <EditCredential credential={credential} />
        </div>
      </div>
      <hr className={styles["section-divider"]} />
    </>
  );
};

export { Credential };
