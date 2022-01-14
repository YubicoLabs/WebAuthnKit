import React, { useState, useEffect, useRef } from 'react';
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { history } from '../_helpers';
import { WebAuthnClient } from '../_components';
import { userActions, credentialActions, alertActions } from '../_actions';
import userService from '../_services/user.service'
import AddTrustedDevice from '../_components/TrustedDevices/AddTrustedDevice';
import { Auth } from 'aws-amplify';
import { TrustedDeviceHelper } from '../_components/TrustedDevices/TrustedDeviceHelper';

const RegisterTrustedDeviceStep = ({ navigation }) => {
  const [allowAdd, setAllowAdd] = useState(false);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const localTrustedDevice = localStorage.getItem("trustedDevice");
    console.log("Local TD: ", localTrustedDevice);
    if(localTrustedDevice === TrustedDeviceHelper.TrustedDeviceEnum.NEVER) {
      continueStep();
    }
    const checkUser = JSON.parse(localStorage.getItem("user"));
    if(checkUser.token) {
      setAllowAdd(true);
    }
  }, []);

  async function authenticate() {
    console.log("authenticate");
    //TODO: get username from formData
    let username = localStorage.getItem('username');
    try {
      // TODO: add hint to request authentication with an internal authenticator
      let options = "";
      let userData = await WebAuthnClient.signIn(username, options, null);
      console.log("RegisterTrustedDevice authenticate userData: ", userData);

      if (userData === undefined) {
        console.error("RegisterTrustedDeviceStep authenticate error: userData undefined");
        dispatch(alertActions.error("Something went wrong. Please try again."));
      } else {
        dispatch(alertActions.success('Authentication successful'));
        TrustedDeviceHelper.setTrustedDevice(TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED);
        continueStep();
      }
      
    } catch (err) {
      console.error("RegisterTrustedDeviceStep authenticate error");
      dispatch(alertActions.error(err.message));
      return;
    }
  }

  const setTrustedDevice = (value) => {
    localStorage.setItem('trustedDevice', value);
  }

  const registerDeviceSuccessStep = () => {
    navigation.go('RegisterDeviceSuccessStep');
  }

  const clickNeverAsk = (value) => {
    TrustedDeviceHelper.setTrustedDevice(value);
    continueStep();
  }

  const continueStep = () => {
    history.push('/');
  }

  const AddTrustedDeviceProps = { continueStep };

  return (
    <>
      <center>
        <h2>Log In Faster on This Device</h2>
        <label>Trust this device? This will allow you to log in next time using this device's fingerprint or face recognition.</label>
      </center>
      <div className="form mt-2">
        <div>
        {allowAdd ? (
          <AddTrustedDevice {...AddTrustedDeviceProps} />
        ) : (
          <Button variant="primary btn-block mt-3" disabled>
            Add this device now
          </Button>
        )}
          <hr></hr>
          <center><label>Already registered this device before?</label></center>
          <Button onClick={authenticate} variant="secondary btn-block mt-2">Confirm Trusted Device</Button>
        </div>
        <div className="mt-3">
          <hr></hr>
        </div>
        <div>
          Don't want to register this device?
          <ul>
            <li><span onClick={continueStep} className="btn-link">Ask me later</span></li>
            <li><span onClick={() => clickNeverAsk(TrustedDeviceHelper.TrustedDeviceEnum.NEVER)} className="btn-link">Never ask me to register this device</span></li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default RegisterTrustedDeviceStep;