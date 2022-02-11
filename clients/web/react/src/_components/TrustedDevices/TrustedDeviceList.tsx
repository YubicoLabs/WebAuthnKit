import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import AddTrustedDevice from "./AddTrustedDevice";
import TrustedDevice from "./TrustedDevice";
import { TrustedDeviceHelper } from "./TrustedDeviceHelper";

const styles = require("../component.module.css");

/**
 * Displays a list of trusted devices
 * Typically will be passed from the Home page after a getAll() request
 * @param credentialItems list of trusted device items
 */
const TrustedDeviceList = function ({ credentialItems }) {
  const { t } = useTranslation();

  const [showAddTrustedDevice, setShowAddTrustedDevice] = useState(false);

  /**
   * Calls to method to determine if the button should appear to register a trusted device
   */
  useEffect(() => {
    checkSetShowAddButton();
  }, []);

  /**
   * Calls to the isUserVerifyingPlatformAuthenticatorAvailable() API to determine if
   * a user should be allowed to register a trusted device
   * Will also hide the button if a trusted device has already been confirmed on this browser
   */
  async function checkSetShowAddButton() {
    const hasPlatformAuth =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    const currTrustedDevice = localStorage.getItem("trustedDevice");
    if (
      hasPlatformAuth &&
      currTrustedDevice !== TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED
    ) {
      setShowAddTrustedDevice(true);
    }
  }

  const AddTrustedDeviceProps = { continueStep() {} };

  return (
    <Card className={styles.default["cardSpacing"]}>
      <Card.Header>
        <h5>{t("trusted-device.trusted-devices")}</h5>
      </Card.Header>
      <Card.Body>
        {credentialItems.map((credential, index) => (
          <TrustedDevice key={index} credential={credential} />
        ))}
        {showAddTrustedDevice && (
          <AddTrustedDevice {...AddTrustedDeviceProps} />
        )}
      </Card.Body>
    </Card>
  );
};
export default TrustedDeviceList;
