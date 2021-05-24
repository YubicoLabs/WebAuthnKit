import React from "react";
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const RegisterTrustedDeviceStep = ({ setForm, formData, navigation }) => {

  const LogInStep = (step) => {
    navigation.go('LogInStep');
  }
  const registerSvPinStep = (step) => {
    navigation.go('RegisterSvPinStep');
  }

  return (
    <>
      <div style={styles['rcourners']}>
        <img src="https://avatars.githubusercontent.com/u/25739468?s=100&v=4" alt="YubicoLabs" className="rounded mx-auto d-block" />
        <center>
          <h2>Log In Faster on This Device</h2>
          <label>Trust this device? This will allow you to log in next time using this device's fingerprint or face recognition.</label>
        </center>
        <div className="form mt-2">
          <div>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1"><img src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg" width="20" height="20"></img>&nbsp;&nbsp;Device Name</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Jan's iPhone"
                aria-label="Device Nickname"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
          </div>
          <div>
            <Button variant="primary btn-block mt-3">Add this device now</Button>
            <hr></hr>
            <center><label>Already registered this device before?</label></center>
            <Button variant="light btn-block mt-2">Confirm Trusted Device</Button>
          </div>
          <div className="mt-3">
            <hr></hr>
          </div>
          <div>
              Don't want to register this device?
              <ul>
                <li><span className="btn-link">Ask me later</span></li>
                <li><span className="btn-link">Never ask me to register this device</span></li>
              </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterTrustedDeviceStep;