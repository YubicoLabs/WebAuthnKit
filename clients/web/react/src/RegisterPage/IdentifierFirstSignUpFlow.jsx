import React from "react";
import { useForm, useStep } from "react-hooks-helper";

import SignUpStep from "./SignUpStep";
import RegisterSvPinStep from "./RegisterSvPinStep";
import RegisterKeySuccessStep from "./RegisterKeySuccessStep";

const steps = [
    { id: "SignUpStep" },
    { id: "RegisterSvPinStep" },
    { id: "RegisterKeySuccessStep" }
];

const defaultData = {
    username: localStorage.getItem('username'),
    pin: -1,
    nickname: "Security Key",
    credential: localStorage.getItem('credential')
  };

export const IdentifierFirstSignUpFlow = ({ images }) => {
    const [formData, setForm] = useForm(defaultData);
    const _initialStep = defaultData.credential == null ? 0 : 2;
    const { step, navigation } = useStep({ initialStep: _initialStep, steps });
    const { id } = step;
    const props = { formData, setForm, navigation };

    const renderSwitch = (id) => {
        switch (id) {
            case "SignUpStep":
                return <SignUpStep {...props} />;
            case "RegisterSvPinStep":
                return <RegisterSvPinStep {...props} />;
            case "RegisterKeySuccessStep":
                return <RegisterKeySuccessStep {...props} />;
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