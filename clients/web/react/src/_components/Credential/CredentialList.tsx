import React from "react";
import { Card } from "react-bootstrap";

import AddCredential from "./AddCredential";
import Credential from "./Credential";

const styles = require("../component.module.css");

const CredentialList = function ({ credentialItems }) {
  console.log("Printing the credentials, ", credentialItems);

  return (
    <Card className={styles.cardSpacing}>
      <Card.Header>
        <h5>Security Keys</h5>
      </Card.Header>
      <Card.Body>
        {credentialItems.map((credential, index) => (
          <Credential key={index} credential={credential} />
        ))}
        <AddCredential />
      </Card.Body>
    </Card>
  );
};
export default CredentialList;
