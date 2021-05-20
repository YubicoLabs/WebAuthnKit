import React from "react";
import { useForm, useStep } from "react-hooks-helper";

import LoginStep from "./LoginStep";
import SignUpStep from "./SignUpStep";
import RegisterSvPinStep from "./RegisterSvPinStep";
import ForgotStep from "./ForgotStep";
import PromptSvPinStep from "./PromptSvPinStep";
import RegisterTrustedDeviceStep from "./RegisterTrustedDeviceStep";

const steps = [
    { id: "LoginStep" },
    { id: "SignUpStep" },
    { id: "RegisterSvPinStep" },
    { id: "ForgotStep" },
    { id: "PromptSvPinStep" },
    { id: "RegisterTrustedDeviceStep" }
];

const defaultData = {
    firstName: "Jane",
    lastName: "Doe",
    nickName: "Jan",
    address: "200 South Main St",
    city: "Anytown",
    state: "CA",
    zip: "90505",
    email: "email@domain.com",
    phone: "+61 4252 454 332"
};

export const IdentifierFirstFlow = ({ images }) => {
    const [formData, setForm] = useForm(defaultData);
    const { step, navigation } = useStep({ initialStep: 0, steps });
    const { id } = step;

    const props = { formData, setForm, navigation };

    const renderSwitch = (id) => {
        switch (id) {
            case "LoginStep":
                return <LoginStep {...props} />;
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