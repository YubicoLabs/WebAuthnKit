import React from "react";
import { useStep } from "react-hooks-helper";

import PasskeyLogin from "./PasskeyLogin";
import InitUserStep from "./InitUserStep";

const steps = [{ id: "PasskeyLogin" }, { id: "InitUserStep" }];

function PasskeyLoginPage() {
  const _initialStep = 0;
  const { step, navigation } = useStep({ initialStep: _initialStep, steps });

  const { id } = step;

  const props = { navigation };

  const renderSwitch = (id) => {
    switch (id) {
      // Step will be the default IF a trusted device is detected in the local application storage
      case "PasskeyLogin":
        return <PasskeyLogin {...props} />;
      // Primary login step, allowing the user to enter their username - Also allows for the use of recovery codes, and usernamless login
      case "InitUserStep":
        return <InitUserStep />;
      default:
        return null;
    }
  };

  return <>{renderSwitch(id)}</>;
}

export default PasskeyLoginPage;
