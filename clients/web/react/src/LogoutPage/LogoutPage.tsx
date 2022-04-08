import React, { useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { useTranslation } from "react-i18next";
import { history } from "../_helpers";

const styles = require("../_components/component.module.css");

/**
 * Transitionary page that is used to log out the user and remove any lingering items in the local storage
 * @returns User is routed back to the login screen, with all credentials removed from the browser
 */
const LogoutPage = function () {
  const { t } = useTranslation();

  const logoutUser = async () => {
    try {
      await Auth.signOut();
      localStorage.removeItem("username");
      localStorage.removeItem("user");
      localStorage.removeItem("credential");
      history.push("/");
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      console.error(
        t("console.error", {
          COMPONENT: "LogoutPage",
          METHOD: "logoutUser",
          REASON: t("console.reason.logout0"),
        }),
        err
      );
    }
  };

  useEffect(() => {
    setTimeout(logoutUser, 1000);
  }, []);

  return (
    <div className={styles.default["textCenter"]}>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>{t("logout")}</h2>
    </div>
  );
};

export default LogoutPage;
