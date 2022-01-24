import React, { useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Spinner } from "react-bootstrap";
import { userActions } from "../_actions";

const styles = require("../_components/component.module.css");

const InitUserStep = function ({ navigation }) {
  const user = useSelector((state: RootStateOrAny) => state.users);
  const dispatch = useDispatch();

  function continueToRegisterKeySuccess() {
    navigation.go("RegisterKeySuccessStep");
  }

  useEffect(() => {
    dispatch(userActions.getCurrentAuthenticatedUser());
  }, []);

  useEffect(() => {
    const token = user?.token;

    if (token !== undefined) {
      continueToRegisterKeySuccess();
    }
  }, [user]);

  return (
    <div className={styles.default["textCenter"]}>
      <Spinner animation="border" role="status" variant="primary" />
      <h2>Loading your profile</h2>
    </div>
  );
};

export default InitUserStep;
