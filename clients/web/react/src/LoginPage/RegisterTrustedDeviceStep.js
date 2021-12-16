import React, { useState, useEffect, useRef } from 'react';
import { Button, InputGroup, FormControl, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { history } from '../_helpers';
import { WebAuthnClient } from '../_components';
import { userActions, credentialActions, alertActions } from '../_actions';

const RegisterTrustedDeviceStep = ({ navigation }) => {

  const dispatch = useDispatch();

  async function register() {
    console.log("register");
    alert("Hi from the registration stub. This feature is still under construction.")
    /*
    //TODO: get username from formData
    let username = localStorage.getItem('username');
    try {
      // TODO: add hint to request authentication with an internal authenticator
      let options = "";
      let userData = await WebAuthnClient.signUp(username, options, uv);
      console.log("RegisterTrustedDevice register userData: ", userData);

      if (userData === undefined) {
        console.error("RegisterTrustedDeviceStep register error: userData undefined");
        dispatch(alertActions.error("Something went wrong. Please try again."));
      } else {
        dispatch(alertActions.success('Registration successful'));
        setTrustedDevice(true);
      }
      
    } catch (err) {
      console.error("RegisterTrustedDeviceStep register error");
      console.error(err);
      dispatch(alertActions.error(err.message));
      return;
    }
    */
    registerDeviceSuccessStep();
  }

  function uv() {
    //This is a user verifying platform. Skipping UV check.
  }

  async function authenticate() {
    console.log("authenticate");
    //TODO: get username from formData
    let username = localStorage.getItem('username');
    try {
      // TODO: add hint to request authentication with an internal authenticator
      let options = "";
      let userData = await WebAuthnClient.signIn(username, options, uv);
      console.log("RegisterTrustedDevice authenticate userData: ", userData);

      if (userData === undefined) {
        console.error("RegisterTrustedDeviceStep authenticate error: userData undefined");
        dispatch(alertActions.error("Something went wrong. Please try again."));
      } else {
        dispatch(alertActions.success('Authentication successful'));
        setTrustedDevice(true);
      }
      
    } catch (err) {
      console.error("RegisterTrustedDeviceStep authenticate error");
      console.error(err);
      dispatch(alertActions.error(err.message));
      return;
    }

    continueStep();
  }

  const setTrustedDevice = (value) => {
    localStorage.setItem('trustedDevice', value);
  }

  const registerDeviceSuccessStep = () => {
    navigation.go('RegisterDeviceSuccessStep');
  }

  const continueStep = () => {
    history.push('/');
  }

  return (
    <>
      <center>
        <h2>Log In Faster on This Device</h2>
        <label>Trust this device? This will allow you to log in next time using this device's fingerprint or face recognition.</label>
      </center>
      <div className="form mt-2">
        <div>
          <Button onClick={register} variant="primary btn-block mt-3">Add this device now</Button>
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
            <li><span onClick={() => setTrustedDevice(false)} className="btn-link">Never ask me to register this device</span></li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default RegisterTrustedDeviceStep;