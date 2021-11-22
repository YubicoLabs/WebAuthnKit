import React from 'react';
import axios from 'axios';
import aws_exports from '../../aws-exports';

import { AddCredential } from './AddCredential'
import { Credential } from './Credential'
import { Card } from 'react-bootstrap';

axios.defaults.baseURL = aws_exports.apiEndpoint;

function CredentialList({credentials}) {
  return (
    <Card>
        <Card.Header><h5>Security Keys</h5></Card.Header>
        <Card.Body>
            {credentials.map((credential, index) => 
            <Credential key={'credDisp' + index} {...credential}/>
            )}
            <AddCredential />
        </Card.Body>
    </Card>
  );
}

export { CredentialList };
