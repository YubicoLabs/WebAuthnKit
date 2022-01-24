import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  InputGroup,
  FormControl,
  Form,
  Spinner,
} from "react-bootstrap";

import { Auth } from "aws-amplify";

import { alertActions } from "../_actions";

const styles = require("../_components/component.module.css");

function ForgotStep({ navigation }) {
  const [validated, setValidated] = useState(false);
  const [continueSubmitted, setContinueSubmitted] = useState(false);

  const dispatch = useDispatch();

  const [inputs, setInputs] = useState({
    username: localStorage.getItem("username"),
    recoveryCode: undefined,
  });

  const LogInStep = () => {
    navigation.go("LogInStep");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));

    setValidated(false);
  };

  const handleSubmit = (event) => {
    const form = event.currentTarget;

    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    setValidated(true);

    if (inputs.recoveryCode) {
      setContinueSubmitted(true);
      handleRecoveryCode(inputs.recoveryCode);
    }
  };

  async function handleRecoveryCode(code) {
    try {
      const cognitoUser = await Auth.signIn(inputs.username);
      console.log("CognitoUser: ", cognitoUser);

      Auth.sendCustomChallengeAnswer(
        cognitoUser,
        JSON.stringify({ recoveryCode: code })
      )
        .then((user) => {
          console.log(user);

          Auth.currentSession()
            .then((data) => {
              dispatch(alertActions.success("Authentication successful"));
              const userData = {
                id: 1,
                username: user.attributes.name,
                token: data.getAccessToken().getJwtToken(),
              };
              localStorage.setItem("user", JSON.stringify(userData));
              console.log("userData ", localStorage.getItem("user"));
              navigation.go("InitUserStep");
            })
            .catch((err) => {
              console.log("currentSession error: ", err);
              const errorAlert = `Something went wrong. ${err.message}`;
              dispatch(alertActions.error(errorAlert));
            });
        })
        .catch((err) => {
          console.log("sendCustomChallengeAnswer error: ", err);
          setContinueSubmitted(false);
          const msg = "Invalid recovery code";
          dispatch(alertActions.error(msg));
        });
    } catch (error) {
      console.error("recovery code error");
      setContinueSubmitted(false);
      console.error(error);
      dispatch(alertActions.error(error.message));
    }
  }

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>Forgot Your Security Key?</h2>
        <label>Enter a recovery code to continue.</label>
      </div>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroup.Text id="basic-addon1">Username</InputGroup.Text>
          <FormControl
            placeholder={localStorage.getItem("username")}
            aria-label="Username"
            aria-describedby="basic-addon1"
            disabled
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">Recovery Code</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            name="recoveryCode"
            placeholder="Enter Recovery Code"
            aria-label="Recovery Code"
            aria-describedby="basic-addon1"
            type="password"
            onChange={handleChange}
            required
          />
          <Form.Control.Feedback type="invalid">
            Please provide a recover code.
          </Form.Control.Feedback>
        </InputGroup>
        <Button
          type="submit"
          value="continue"
          variant="primary"
          block
          disabled={continueSubmitted}>
          {continueSubmitted && (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className={styles.default["loaderSpan"]}>
                Fetching your profile
              </span>
            </>
          )}
          {!continueSubmitted && <span>Continue</span>}
        </Button>
      </Form>
      <div className="mt-5">
        <hr />
      </div>
      <div>
        <div className={styles.default["textCenter"]}>
          <span onClick={LogInStep} className="btn-link">
            Back to Log In
          </span>
        </div>
      </div>
    </>
  );
}

export default ForgotStep;
