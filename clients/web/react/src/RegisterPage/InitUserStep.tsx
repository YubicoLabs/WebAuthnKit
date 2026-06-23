import React, { useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { history } from "../_helpers";
import { userActions } from "../_actions";

const styles = require("../_components/component.module.css");

/**
 * Transitionary page that is used to log in the user and to set auth tokens used for APIs - This step should only be reached after a successful registration
 * @returns User is routed back to the login screen, with all credentials removed from the browser
 */
const InitUserStep = function ({ navigation }) {
  const { t } = useTranslation();

  const user = useSelector((state: RootStateOrAny) => state.users);

  const dispatch = useDispatch();

  /**
   * Once the page renders, send a dispatch to useractions to get the currently logged in user
   */
  useEffect(() => {
    dispatch(userActions.getCurrentAuthenticatedUser());
  }, []);

  /**
   * Once a user is configured, navigate to the dashboard.
   * Users can name their security key from the dashboard credential management UI.
   */
  useEffect(() => {
    const token = user?.token;

    if (token !== undefined) {
      history.push("/");
    }
  }, [user]);

  return (
    <div className={styles.default["textCenter"]}>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>{t("init-user")}</h2>
    </div>
  );
};

export default InitUserStep;
