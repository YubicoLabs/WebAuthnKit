import React from "react";
import { Card } from "react-bootstrap";

import { AddCredential } from "./AddCredential";
import { Credential } from "./Credential";
import styles from "../component.module.css";

const CredentialList = function ({ credentialItems }) {
  console.log("Printing the credentials, ", credentialItems);

  return (
    <Card className={styles.cardSpacing}>
      <Card.Header>
        <h5>Security Keys</h5>
      </Card.Header>
      <Card.Body>
        {credentialItems.map((credential, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Credential key={index} credential={credential} />
        ))}
        <AddCredential />
      </Card.Body>
    </Card>
  );
};
export default CredentialList;
