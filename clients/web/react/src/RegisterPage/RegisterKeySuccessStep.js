import React from "react";
import { Button, InputGroup, FormControl, } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { history } from '../_helpers';
import { WebAuthnClient } from '../_components';
import { userActions, credentialActions, alertActions } from '../_actions';


const RegisterKeySuccessStep = ({ setForm, formData, navigation }) => {

  const dispatch = useDispatch();

  const { username, pin, nickname, credential } = formData;

  async function continueStep() {
    let result = WebAuthnClient.validateCredentialNickname(nickname);

    if(result) {

      console.error("RegisterKeySuccessStep validateCredentialNickname error");
      let message = result.nickname.join(". ");
      console.error(message);
      dispatch(alertActions.error(message));

    } else {
      try {
        await WebAuthnClient.getCurrentAuthenticatedUser();
        let ls_credential = JSON.parse(localStorage.getItem('credential'));

        let credentialToUpdate = {
          credential: { 
            credentialId: { 
              base64: ls_credential.id
            }
          }, 
          credentialNickname: { 
            value: nickname 
          }
        }

        dispatch(credentialActions.update(credentialToUpdate));

      } catch (err) {

        console.error("RegisterKeySuccessStep continueStep() error");
        console.error(err);
        dispatch(alertActions.error(err.message));

      }
    }
    localStorage.removeItem('credential');
    history.push('/');
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
                name="nickname"
                placeholder="Security Key"
                aria-label="Nickname"
                aria-describedby="basic-addon1"
                onChange={setForm}
              />
            </InputGroup>
          </div>
          <div>
            <Button onClick={() => continueStep()} variant="primary btn-block mt-3">Continue</Button>
          </div>
        </div>
    </>
  );
};

export default RegisterKeySuccessStep;