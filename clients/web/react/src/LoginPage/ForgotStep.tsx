import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  InputGroup,
  FormControl,
  Form,
  Spinner,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Auth } from "aws-amplify";
import { alertActions } from "../_actions";

const styles = require("../_components/component.module.css");

/**
 * Step to allow the user to login with a recovery code if they do not possess any of their authentication devices
 * @returns Routes the user to the Home Page if the recovery code is valid
 */
const ForgotStep = function ({ navigation }) {
  const { t } = useTranslation();

  const [validated, setValidated] = useState(false);

  const [continueSubmitted, setContinueSubmitted] = useState(false);

  const dispatch = useDispatch();

  const [inputs, setInputs] = useState({
    username: localStorage.getItem("username"),
    recoveryCode: undefined,
  });

  // Returns the user to the initial login page
  const LogInStep = () => {
    navigation.go("LogInStep");
  };

  /**
   * Validates the recovery code input by the user
   * @param e Event sent by the button in the render code below
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));

    setValidated(false);
  };

  /**
   * Submits the code for review to determine if the user should be logged in
   * @param e Event sent by the button in the render code below
   */
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

  /**
   * Primary logic of this component, handles the review of the recovery code, adn determines if the user should be authenticated
   */
  async function handleRecoveryCode(code) {
    try {
      // Signs in the user with their current username
      const cognitoUser = await Auth.signIn(inputs.username);
      console.info(
        t("console.info", {
          COMPONENT: "ForgotStep",
          METHOD: "handleRecoveryCode",
          LOG_REASON: t("console.reason.forgotStep0"),
        }),
        cognitoUser
      );

      // Sends the challenge answer from the login, along with the recoery code input by the user
      Auth.sendCustomChallengeAnswer(
        cognitoUser,
        JSON.stringify({ recoveryCode: code })
      )
        .then((user) => {
          Auth.currentSession()
            .then((data) => {
              dispatch(alertActions.success(t("alerts.auth-successful")));
              const userData = {
                id: 1,
                username: user.attributes.name,
                token: data.getAccessToken().getJwtToken(),
              };
              localStorage.setItem("user", JSON.stringify(userData));
              navigation.go("InitUserStep");
            })
            .catch((err) => {
              console.error(
                t("console.error", {
                  COMPONENT: "ForgotStep",
                  METHOD: "handleRecoveryCode",
                  REASON: t("console.reason.forgotStep1"),
                }),
                err
              );

              const errorAlert = `${t("alerts.something-went-wrong")}. ${
                err.message
              }`;
              dispatch(alertActions.error(errorAlert));
            });
        })
        .catch((err) => {
          // Error with the recovery code
          console.error(
            t("console.error", {
              COMPONENT: "ForgotStep",
              METHOD: "handleRecoveryCode",
              REASON: t("console.reason.forgotStep2"),
            }),
            err
          );
          setContinueSubmitted(false);
          dispatch(alertActions.error(t("alerts.invalid-rec-code")));
        });
    } catch (error) {
      // Error with the recovery code
      setContinueSubmitted(false);
      console.error(
        t("console.error", {
          COMPONENT: "ForgotStep",
          METHOD: "handleRecoveryCode",
          REASON: t("console.reason.forgotStep3"),
        }),
        error
      );

      dispatch(alertActions.error(error.message));
    }
  }

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>{t("forgot-step.header")}</h2>
        <label>{t("forgot-step.instructions")}</label>
      </div>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroup.Text id="basic-addon1">
            {t("forgot-step.form-label-username")}
          </InputGroup.Text>
          <FormControl
            placeholder={localStorage.getItem("username")}
            aria-label="Username"
            aria-describedby="basic-addon1"
            disabled
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">
              {t("forgot-step.form-label-recoverycode")}
            </InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            name="recoveryCode"
            placeholder={t("forgot-step.form-hint-recoverycode")}
            aria-label="Recovery Code"
            aria-describedby="basic-addon1"
            type="password"
            onChange={handleChange}
            required
          />
          <Form.Control.Feedback type="invalid">
            {t("forgot-step.alert-1")}
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
                {t("forgot-step.primary-button-loading")}
              </span>
            </>
          )}
          {!continueSubmitted && <span>{t("forgot-step.primary-button")}</span>}
        </Button>
      </Form>
      <div className="mt-5">
        <hr />
      </div>
      <div>
        <div className={styles.default["textCenter"]}>
          <span onClick={LogInStep} className="btn-link">
            {t("forgot-step.login-return")}
          </span>
        </div>
      </div>
    </>
  );
};

export default ForgotStep;
