import React from "react";
import { useForm, useStep } from "react-hooks-helper";
import SignUpStep from "./SignUpStep";
import RegisterKeySuccessStep from "./RegisterKeySuccessStep";
import InitUserStep from "./InitUserStep";

const steps = [
  { id: "SignUpStep" },
  { id: "RegisterKeySuccessStep" },
  { id: "InitUserStep" },
];

const defaultData = {
  username: localStorage.getItem("username"),
  pin: -1,
  nickname: "Security Key",
  credential: localStorage.getItem("credential"),
};

function IdentifierFirstSignUpFlow() {
  const [formData, setForm] = useForm(defaultData);
  const _initialStep = defaultData.credential == null ? 0 : 2;
  const { step, navigation } = useStep({ initialStep: _initialStep, steps });
  const { id } = step;
  const props = { formData, setForm, navigation };

  const renderSwitch = (id) => {
    switch (id) {
      // Step where the user is first registering a new account
      case "SignUpStep":
        return <SignUpStep {...props} />;
      // Step to allow the user to rename their first key after a successful registration
      case "RegisterKeySuccessStep":
        return <RegisterKeySuccessStep {...props} />;
      // Transitionary page initializing the users credentials and auth tokens for APIs
      case "InitUserStep":
        return <InitUserStep {...props} />;
      default:
        return null;
    }
  };

  return <>{renderSwitch(id)}</>;
}

export default IdentifierFirstSignUpFlow;
