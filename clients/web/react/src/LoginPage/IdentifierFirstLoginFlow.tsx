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

const IdentifierFirstLoginFlow = () => {
  let trustedDevice = localStorage.getItem("trustedDevice");
  const _initialStep =
    trustedDevice === TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED ? 0 : 1;
  const { step, navigation } = useStep({ initialStep: _initialStep, steps });

  const { id } = step;

  const props = { navigation };

  const renderSwitch = (id) => {
    switch (id) {
      case "LogInTrustedDeviceStep":
        return <LogInTrustedDeviceStep {...props} />;
      case "LogInStep":
        return <LogInStep {...props} />;
      case "InitUserStep":
        return <InitUserStep {...props} />;
      case "ForgotStep":
        return <ForgotStep {...props} />;
      case "RegisterTrustedDeviceStep":
        return <RegisterTrustedDeviceStep {...props} />;
      case "RegisterDeviceSuccessStep":
        return <RegisterDeviceSuccessStep {...props} />;
      default:
        return null;
    }
  };

  return <>{renderSwitch(id)}</>;
};

export default IdentifierFirstLoginFlow;
