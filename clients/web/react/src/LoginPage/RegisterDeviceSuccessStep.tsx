import React from "react";
import { Button } from "react-bootstrap";

import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

/**
 * Quick prompt shown to the user showing their trusted device was registered successfully
 * User can click continue to enter the home page
 */
function RegisterDeviceSuccessStep({ navigation }) {
  const accountSecurityStep = () => {
    history.push("/");
  };

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>Device Added</h2>
        <label>You have successfully registered your trusted device.</label>
      </div>
      <div className="form mt-2">
        <div>
          <Button
            onClick={accountSecurityStep}
            variant="primary btn-block mt-3">
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}

export default RegisterDeviceSuccessStep;
