import React from "react";
import { useStep } from "react-hooks-helper";

import LogInStep from "./LogInStep";
import ForgotStep from "./ForgotStep";
import PromptSvPinStep from "./PromptSvPinStep";
import RegisterTrustedDeviceStep from "./RegisterTrustedDeviceStep";
import LogInTrustedDeviceStep from "./LogInTrustedDeviceStep";
import RegisterDeviceSuccessStep from "./RegisterDeviceSuccessStep";

const steps = [
    { id: "LogInTrustedDeviceStep" },
    { id: "LogInStep" },
    { id: "ForgotStep" },
    { id: "PromptSvPinStep" },
    { id: "RegisterTrustedDeviceStep" },
    { id: "RegisterDeviceSuccessStep" }
];

export const IdentifierFirstLoginFlow = ({ images }) => {
    let trustedDevice = localStorage.getItem('trustedDevice');
    const _initialStep = trustedDevice === "true" ? 0 : 1;
    const { step, navigation } = useStep({ initialStep: _initialStep, steps });

    const { id } = step;

    const props = { navigation };

    const renderSwitch = (id) => {
        switch (id) {
            case "LogInTrustedDeviceStep":
                return <LogInTrustedDeviceStep {...props} />;
            case "LogInStep":
                return <LogInStep {...props} />;
            case "ForgotStep":
                return <ForgotStep {...props} />;
            case "PromptSvPinStep":
                return <PromptSvPinStep {...props} />;
            case "RegisterTrustedDeviceStep":
                return <RegisterTrustedDeviceStep {...props} />;
            case "RegisterDeviceSuccessStep":
                return <RegisterDeviceSuccessStep {...props} />;
            default:
                return null;
        }
    };

    return (
        <>    
            {renderSwitch(id)}    
        </>
    );

}