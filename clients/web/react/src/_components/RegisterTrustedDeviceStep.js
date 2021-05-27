import React, { useState, useEffect, useRef } from 'react';
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';

import styles from "./component.module.css";

const RegisterTrustedDeviceStep = ({ setForm, formData, navigation }) => {

  const setTrustedDevice = (value) => {
    localStorage.setItem('trustedDevice', value);
    registerDeviceSuccessStep();
  }

  const registerDeviceSuccessStep = () => {
    navigation.go('RegisterDeviceSuccessStep');
  }

  const accountSecurityStep = () => {
    navigation.go('AccountSecurityStep');
  }

  return (
    <>
        <center>
          <h2>Log In Faster on This Device</h2>
          <label>Trust this device? This will allow you to log in next time using this device's fingerprint or face recognition.</label>
        </center>
        <div className="form mt-2">
          <div>
            <Button onClick={() => setTrustedDevice(true)} variant="primary btn-block mt-3">Add this device now</Button>
            <hr></hr>
            <center><label>Already registered this device before?</label></center>
            <Button onClick={() => setTrustedDevice(true)} variant="secondary btn-block mt-2">Confirm Trusted Device</Button>
          </div>
          <div className="mt-3">
            <hr></hr>
          </div>
          <div>
              Don't want to register this device?
              <ul>
                <li><span onClick={accountSecurityStep} className="btn-link">Ask me later</span></li>
                <li><span onClick={() => setTrustedDevice(false)} className="btn-link">Never ask me to register this device</span></li>
              </ul>
          </div>
        </div>
    </>
  );
};

export default RegisterTrustedDeviceStep;