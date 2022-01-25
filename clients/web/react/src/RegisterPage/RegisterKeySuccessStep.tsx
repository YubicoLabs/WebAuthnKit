import React, { useEffect } from "react";
import { Button, InputGroup, FormControl } from "react-bootstrap";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { history } from "../_helpers";
import { userActions, credentialActions, alertActions } from "../_actions";

const styles = require("../_components/component.module.css");

/**
 * Page to allow the user to rename their first security key before proceeding to the home page
 * If the user does not enter in a new name the default name will be kept as "Security Key"
 */
function RegisterKeySuccessStep({ setForm, formData, navigation }) {
  const dispatch = useDispatch();

  const validNickname = useSelector(
    (state: RootStateOrAny) => state.credentials.validNickname
  );
  const updateComplete = useSelector(
    (state: RootStateOrAny) => state.credentials.updateComplete
  );

  useEffect(() => {
    dispatch(userActions.getCurrentAuthenticatedUser()); // Get the jwt token after signup
  }, []);

  useEffect(() => {
    if (validNickname) {
      updateCredential(validNickname);
    }
  }, [validNickname]);

  useEffect(() => {
    if (updateComplete) {
      history.push("/");
    }
  }, [updateComplete]);

  const { username, pin, nickname, credential } = formData;

  async function updateCredential(nickname) {
    console.log(
      "RegisterKeySuccessStep updateCredential() nickname:",
      nickname
    );
    try {
      const ls_credential = JSON.parse(localStorage.getItem("credential"));
      console.log(
        "RegisterKeySuccessStep updateCredential() ls_credential:",
        ls_credential
      );

      const credentialToUpdate = {
        credential: {
          credentialId: {
            base64: ls_credential.id,
          },
        },
        credentialNickname: {
          value: nickname,
        },
      };

      dispatch(credentialActions.update(credentialToUpdate));
    } catch (err) {
      console.error("RegisterKeySuccessStep continueStep() error");
      console.error(err);
      dispatch(alertActions.error(err.message));
    }
    localStorage.removeItem("credential");
  }

  function continueStep() {
    dispatch(credentialActions.validateCredentialNickname(nickname));
  }

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>Security Key Added</h2>
        <label>You have successfully registered your security key.</label>
      </div>
      <div className="form mt-2">
        <div>
          <label>Give your security key a nickname.</label>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon1">
                <img
                  src="https://media.yubico.com/media/catalog/product/5/n/5nfc_hero_2021.png"
                  width="20"
                  height="20"
                />
              </InputGroup.Text>
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
          <Button
            onClick={() => continueStep()}
            variant="primary btn-block mt-3">
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}

export default RegisterKeySuccessStep;
