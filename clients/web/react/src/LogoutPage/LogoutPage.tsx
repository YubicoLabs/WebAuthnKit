import React, { useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

const LogoutPage = function () {
  const logoutUser = async () => {
    try {
      await Auth.signOut();
      localStorage.removeItem("username");
      localStorage.removeItem("user");
      localStorage.removeItem("credential");
      history.push("/");
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      console.error("There was an error signing out the user: ", err);
    }
  };

  useEffect(() => {
    setTimeout(logoutUser, 1000);
  }, []);

  return (
    <div className={styles.default["textCenter"]}>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>Thank you for joining us!</h2>
    </div>
  );
};

export default LogoutPage;
