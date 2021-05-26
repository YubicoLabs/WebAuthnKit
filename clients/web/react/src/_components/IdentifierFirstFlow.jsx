import React from "react";
import { useStep } from "react-hooks-helper";

import LogInStep from "./LogInStep";
import SignUpStep from "./SignUpStep";
import RegisterSvPinStep from "./RegisterSvPinStep";
import ForgotStep from "./ForgotStep";
import PromptSvPinStep from "./PromptSvPinStep";
import RegisterTrustedDeviceStep from "./RegisterTrustedDeviceStep";
import LogInTrustedDeviceStep from "./LogInTrustedDeviceStep";
import RegisterKeySuccessStep from "./RegisterKeySuccessStep";
import RegisterDeviceSuccessStep from "./RegisterDeviceSuccessStep";

const steps = [
    { id: "LogInStep" },
    { id: "SignUpStep" },
    { id: "RegisterSvPinStep" },
    { id: "ForgotStep" },
    { id: "PromptSvPinStep" },
    { id: "RegisterTrustedDeviceStep" },
    { id: "LogInTrustedDeviceStep" },
    { id: "RegisterKeySuccessStep" },
    { id: "RegisterDeviceSuccessStep" }
];

export const IdentifierFirstFlow = ({ images }) => {
    let trustedDevice = localStorage.getItem('trustedDevice');
    const _initialStep = trustedDevice === "true" ? 6 : 0;
    const { step, navigation } = useStep({ initialStep: _initialStep, steps });

    const { id } = step;

    const props = { navigation };

    const renderSwitch = (id) => {
        switch (id) {
            case "LogInStep":
                return <LogInStep {...props} />;
            case "SignUpStep":
                return <SignUpStep {...props} />;
            case "RegisterSvPinStep":
                return <RegisterSvPinStep {...props} />;
            case "ForgotStep":
                return <ForgotStep {...props} />;
            case "PromptSvPinStep":
                return <PromptSvPinStep {...props} />;
            case "RegisterTrustedDeviceStep":
                return <RegisterTrustedDeviceStep {...props} />;
            case "LogInTrustedDeviceStep":
                return <LogInTrustedDeviceStep {...props} />;
            case "RegisterKeySuccessStep":
                return <RegisterKeySuccessStep {...props} />;
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