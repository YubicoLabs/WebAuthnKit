import React from "react";
import { Card } from "react-bootstrap";

import AddCredential from "./AddCredential";
import Credential from "./Credential";

const styles = require("../component.module.css");

/**
 * Lists all credentials, passed from the home page after a getAll() call
 * If passed from the home page, then these items will only be non-platform authenticators
 * @param credentialItems List of credentials
 * @returns
 */
const CredentialList = function ({ credentialItems }) {
  return (
    <Card className={styles.default["cardSpacing"]}>
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
