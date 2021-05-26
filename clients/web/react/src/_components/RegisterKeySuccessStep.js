import React from "react";
import { Button, InputGroup, FormControl, } from 'react-bootstrap';

import styles from "./component.module.css";

const RegisterKeySuccessStep = ({ setForm, formData, navigation }) => {

  const registerSvPinStep = () => {
    navigation.go('RegisterSvPinStep');
  }

  return (
    <>
        <center>
          <h2>Security Key Added</h2>
          <label>You have successfully registered your security key.</label>
        </center>
        <div className="form mt-2">
          <div>
            <label>Give your security key a nickname.</label>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1"><img src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png" width="20" height="20"></img></InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="Security Key Nickname"
                aria-label="Nickname"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
          </div>
          <div>
            <Button onClick={() => registerSvPinStep()} variant="primary btn-block mt-3">Continue</Button>
          </div>
        </div>
    </>
  );
};

export default RegisterKeySuccessStep;