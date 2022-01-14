import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { history } from "../_helpers";
import userService from "../_services/user.service";

const styles = require("../_components/component.module.css");

const InitUserStep = function ({ navigation }) {
  const [allow, setAllow] = useState(false);

  async function getUser() {
    await userService.getCurrentAuthenticatedUser();
    const checkUser = JSON.parse(localStorage.getItem("user"));
    if (checkUser.token) {
      setAllow(true);
    }
  }

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (allow) {
      navigation.go("RegisterTrustedDeviceStep");
    }
  }, [allow]);

  return (
    <div className={styles.default["textCenter"]}>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>Loading your profile</h2>
    </div>
  );
};

export default InitUserStep;
