import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useDispatch } from "react-redux";

import { WebAuthnClient } from "../_components";
import { alertActions } from "../_actions";
import AddTrustedDevice from "../_components/TrustedDevices/AddTrustedDevice";
import { TrustedDeviceHelper } from "../_components/TrustedDevices/TrustedDeviceHelper";

const styles = require("../_components/component.module.css");

const RegisterTrustedDeviceStep = ({ navigation }) => {
  const [allowAdd, setAllowAdd] = useState(false);
  const [continueSubmitted, setContinueSubmitted] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const localTrustedDevice = localStorage.getItem("trustedDevice");
    if (localTrustedDevice === TrustedDeviceHelper.TrustedDeviceEnum.NEVER) {
      continueStep();
    }
    const checkUser = JSON.parse(localStorage.getItem("user"));
    if (checkUser.token) {
      setAllowAdd(true);
    }
  }, []);

  async function authenticate() {
    console.log("authenticate");
    setContinueSubmitted(true);
    let username = localStorage.getItem("username");
    try {
      let options = "";
      let userData = await WebAuthnClient.signIn(username, options);
      console.log("RegisterTrustedDevice authenticate userData: ", userData);

      if (userData === undefined) {
        console.error(
          "RegisterTrustedDeviceStep authenticate error: userData undefined"
        );
        dispatch(alertActions.error("Something went wrong. Please try again."));
        setContinueSubmitted(false);
      } else {
        dispatch(alertActions.success("Authentication successful"));
        TrustedDeviceHelper.setTrustedDevice(
          TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED,
          userData.credential.id
        );
        continueStep();
      }
    } catch (err) {
      console.error("RegisterTrustedDeviceStep authenticate error");
      setContinueSubmitted(false);
      dispatch(alertActions.error(err.message));
      return;
    }
  }

  const clickNeverAsk = (value) => {
    TrustedDeviceHelper.setTrustedDevice(value, undefined);
    continueStep();
  };

  const continueStep = () => {
    navigation.go("RegisterDeviceSuccessStep");
  };

  const AddTrustedDeviceProps = { continueStep };

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>Log In Faster on This Device</h2>
        <label>
          Trust this device? This will allow you to log in next time using this
          device's fingerprint or face recognition.
        </label>
      </div>
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
          <div className={styles.default["textCenter"]}>
            <label>Already registered this device before?</label>
          </div>
          <Button
            type="submit"
            onClick={authenticate}
            value="continue"
            variant="secondary btn-block mt-2"
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
                  Confirming your device
                </span>
              </>
            )}
            {!continueSubmitted && <span>Confirm Trusted Device</span>}
          </Button>
        </div>
        <div className="mt-3">
          <hr></hr>
        </div>
        <div>
          Don't want to register this device?
          <ul>
            <li>
              <span onClick={continueStep} className="btn-link">
                Ask me later
              </span>
            </li>
            <li>
              <span
                onClick={() =>
                  clickNeverAsk(TrustedDeviceHelper.TrustedDeviceEnum.NEVER)
                }
                className="btn-link">
                Never ask me to register this device
              </span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default RegisterTrustedDeviceStep;
