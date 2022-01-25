import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { history } from "../_helpers";
import { WebAuthnClient } from "../_components";
import { alertActions } from "../_actions";
import AddTrustedDevice from "../_components/TrustedDevices/AddTrustedDevice";
import { TrustedDeviceHelper } from "../_components/TrustedDevices/TrustedDeviceHelper";

const styles = require("../_components/component.module.css");

/**
 * Prompt allowing the user to register a trusted device
 * Options include -
 * Add Trusted Device - Allows the user to register their platform authenticator if available to the browser + platform
 * Confirm Device - If the platform authenticator for the device has been registered, this will allow the user to confirm it's registrations and set local storage values
 * Never Ask - Stops this prompt from appearing ot the user on every login
 * Ask again - Will allow this prompt to appear to the user again
 * NOTE - This confirmation is set on a browser to browser basis - If you add a trusted device using Chrome on your laptop, you will be able to login with that on Edge - but you will need to confirm the device
 */
function RegisterTrustedDeviceStep({ navigation }) {
  const [allowAdd, setAllowAdd] = useState(false);
  const [continueSubmitted, setContinueSubmitted] = useState(false);
  const dispatch = useDispatch();

  /**
   * If the user has declared never to be asked for this step, then allow them to continue to the home page
   * If the users Auth Token hasn't been set, then don't allow them to register a device
   */
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

  /**
   * Used by the confirmation button
   * If a user is able to authenticate with their platform authenticator, then it has been registered
   * Otherwise send an error and instruct the user to add their device
   */
  async function authenticate() {
    console.log("authenticate");
    setContinueSubmitted(true);
    const username = localStorage.getItem("username");
    try {
      const options = "";
      const userData = await WebAuthnClient.signIn(username, options);
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
    }
  }

  /**
   * Declares on this browser instance not to ask the user to register a trusted device
   * @param value uses the TrustedDeviceHelper Enums, this method should expect a value of NEVER
   */
  const clickNeverAsk = (value) => {
    TrustedDeviceHelper.setTrustedDevice(value, undefined);
    history.push("/");
  };

  /**
   * If the user successfully registers a device, then show them the success prompt
   */
  const continueStep = () => {
    navigation.go("RegisterDeviceSuccessStep");
  };

  /**
   * Do nothing if the user selects Ask Later, route the user to the home page
   */
  const askLaterStep = () => {
    history.push("/");
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
          <hr />
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
          <hr />
        </div>
        <div>
          Don't want to register this device?
          <ul>
            <li>
              <span onClick={askLaterStep} className="btn-link">
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
}

export default RegisterTrustedDeviceStep;
