import React from "react";
import { useStep } from "react-hooks-helper";

import LogInStep from "./LogInStep";
import ForgotStep from "./ForgotStep";
import RegisterTrustedDeviceStep from "./RegisterTrustedDeviceStep";
import LogInTrustedDeviceStep from "./LogInTrustedDeviceStep";
import RegisterDeviceSuccessStep from "./RegisterDeviceSuccessStep";
import InitUserStep from "./InitUserStep";
import { TrustedDeviceHelper } from "../_components/TrustedDevices/TrustedDeviceHelper";

const steps = [
  { id: "LogInTrustedDeviceStep" },
  { id: "LogInStep" },
  { id: "ForgotStep" },
  { id: "RegisterTrustedDeviceStep" },
  { id: "RegisterDeviceSuccessStep" },
  { id: "InitUserStep" },
];

function IdentifierFirstLoginFlow() {
  const trustedDevice = localStorage.getItem("trustedDevice");
  const _initialStep =
    trustedDevice === TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED ? 0 : 1;
  const { step, navigation } = useStep({ initialStep: _initialStep, steps });

  const { id } = step;

  const props = { navigation };

  const renderSwitch = (id) => {
    switch (id) {
      // Step will be the default IF a trusted device is detected in the local application storage
      case "LogInTrustedDeviceStep":
        return <LogInTrustedDeviceStep {...props} />;
      // Primary login step, allowing the user to enter their username - Also allows for the use of recovery codes, and usernamless login
      case "LogInStep":
        return <LogInStep {...props} />;
      // Transitionary page initializing the users credentials and auth tokens for APIs
      case "InitUserStep":
        return <InitUserStep {...props} />;
      // Allows the user to login with a recvoery code
      case "ForgotStep":
        return <ForgotStep {...props} />;
      // Step to prompt the user to add a platform authenticator (trusted device)
      case "RegisterTrustedDeviceStep":
        return <RegisterTrustedDeviceStep {...props} />;
      // Step indicating to the user that the registration of their trusted device was successful
      case "RegisterDeviceSuccessStep":
        return <RegisterDeviceSuccessStep {...props} />;
      default:
        return null;
    }
  };

  return <>{renderSwitch(id)}</>;
}

export default IdentifierFirstLoginFlow;
