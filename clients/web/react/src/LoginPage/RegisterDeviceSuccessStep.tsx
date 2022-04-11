import React from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

/**
 * Quick prompt shown to the user showing their trusted device was registered successfully
 * User can click continue to enter the home page
 */
const RegisterDeviceSuccessStep = function ({ navigation }) {
  const { t } = useTranslation();

  const accountSecurityStep = () => {
    history.push("/");
  };

  return (
    <>
      <div className={styles.default["textCenter"]}>
        <h2>{t("trusted-device.success-header")}</h2>
        <label>{t("trusted-device.success-message")}</label>
      </div>
      <div className="form mt-2">
        <div>
          <Button
            onClick={accountSecurityStep}
            variant="primary btn-block mt-3">
            {t("trusted-device.success-button")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default RegisterDeviceSuccessStep;
