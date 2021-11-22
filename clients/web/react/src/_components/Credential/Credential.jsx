import React from 'react';
import axios from 'axios';
import aws_exports from '../../aws-exports';

import { EditCredential } from './EditCredential'
import { Image } from 'react-bootstrap';

axios.defaults.baseURL = aws_exports.apiEndpoint;

function Credential(credential) {

  return (
    <>
      <div className='d-flex justify-content-center align-items-center'>
        <div className='p-2'>
          <Image
            className={styles['security-key-image']}
            src='https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png'
            roundedCircle
          />
        </div>
        <div className='p-2 flex-grow-1'>
          <h5>{credential.credentialNickname.value}</h5>
          <h6>YubiKey 5NFC</h6>
          <p>{credential.lastUsedTime}</p>
        </div>
        <div className='m-2'>
          <EditCredential />
        </div>
      </div>
      <hr className={styles['section-divider']} />
    </>
  );
}

export { Credential };
