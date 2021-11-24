import React from "react";
import { Card } from "react-bootstrap";

import { AddCredential } from "./AddCredential";
import { Credential } from "./Credential";

const CredentialList = function ({ credentialItems }) {
  return (
    <Card>
      <Card.Header>
        <h5>Security Keys</h5>
      </Card.Header>
      <Card.Body>
        {credentialItems.map((credential, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Credential key={index} credential={credential} />
        ))}
      </Card.Body>
      <AddCredential />
    </Card>
  );
};
export default CredentialList;
