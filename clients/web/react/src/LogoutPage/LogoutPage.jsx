import React, { useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { history } from "../_helpers";

const LogoutPage = function () {
  const logoutUser = async () => {
    console.log("Called into loader");
    try {
      await Auth.signOut();
      localStorage.removeItem("username");
      localStorage.removeItem("user");
      history.push("/");
    } catch (err) {
      console.error("There was an error signing out the user: ", err);
    }
  };

  useEffect(() => {
    setTimeout(logoutUser, 1000);
  }, []);

  return (
    <center>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>Thank you for joining us!</h2>
    </center>
  );
};

export default LogoutPage;
