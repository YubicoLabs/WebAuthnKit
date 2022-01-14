import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

import AddTrustedDevice from "./AddTrustedDevice";
import TrustedDevice from "./TrustedDevice";
import { TrustedDeviceHelper } from "./TrustedDeviceHelper";
const styles = require("../component.module.css");

const TrustedDeviceList = function ({ credentialItems }) {
  const [showAddTrustedDevice, setShowAddTrustedDevice] = useState(false);

  useEffect(() => {
    checkSetShowAddButton();
  }, []);

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

  console.log("Printing the credentials, ", credentialItems);
  const AddTrustedDeviceProps = { continueStep: function () {} };

  return (
    <Card className={styles.default["cardSpacing"]}>
      <Card.Header>
        <h5>Trusted Devices</h5>
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
