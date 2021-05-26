import React from "react";
import { Button, InputGroup, FormControl, } from 'react-bootstrap';

import styles from "./component.module.css";

const RegisterDeviceSuccessStep = ({ setForm, formData, navigation }) => {

  return (
    <>
      <div style={styles['rcourners']}>
        <img src="https://avatars.githubusercontent.com/u/25739468?s=100&v=4" alt="YubicoLabs" className="rounded mx-auto d-block" />
        <center>
          <h2>Device Added</h2>
          <label>You have successfully registered your trusted device.</label>
        </center>
        <div className="form mt-2">
          <div>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1"><img src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg" width="20" height="20"></img></InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Browser + OS + Registration DateTimestamp"
                aria-label="Nickname"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
          </div>
          <div>
            <Button variant="primary btn-block mt-3">Continue</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterDeviceSuccessStep;