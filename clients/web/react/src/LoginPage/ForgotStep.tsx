import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, InputGroup, FormControl, Form } from "react-bootstrap";

import { Auth } from "aws-amplify";

import { alertActions } from "../_actions";
import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

const ForgotStep = ({ navigation }) => {
  const [validated, setValidated] = useState(false);
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
      handleRecoveryCode(inputs.recoveryCode);
    }
  };

  async function handleRecoveryCode(code) {
    try {
      let cognitoUser = await Auth.signIn(inputs.username);
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
              let userData = {
                id: 1,
                username: user.attributes.name,
                token: data.getAccessToken().getJwtToken(),
              };
              localStorage.setItem("user", JSON.stringify(userData));
              console.log("userData ", localStorage.getItem("user"));
              history.push("/");
            })
            .catch((err) => {
              console.log("currentSession error: ", err);
              const errorAlert = "Something went wrong. " + err.message;
              dispatch(alertActions.error(errorAlert));
            });
        })
        .catch((err) => {
          console.log("sendCustomChallengeAnswer error: ", err);
          let msg = "Invalid recovery code";
          dispatch(alertActions.error(msg));
        });
    } catch (error) {
      console.error("recovery code error");
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
        <Button type="submit" variant="primary" block>
          Continue
        </Button>
      </Form>
      <div className="mt-5">
        <hr></hr>
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
};

export default ForgotStep;
