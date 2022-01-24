import React, { useEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Spinner } from "react-bootstrap";
import { history } from "../_helpers";
import { userActions } from "../_actions";

const styles = require("../_components/component.module.css");

const InitUserStep = function ({ navigation }) {
  const user = useSelector((state: RootStateOrAny) => state.users);
  const dispatch = useDispatch();

  function registerTrustedDeviceOrContinue() {
    const trustedDevice = localStorage.getItem("trustedDevice");

    if (trustedDevice === null) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(function (available) {
          if (available) {
            navigation.go("RegisterTrustedDeviceStep");
          } else {
            history.push("/");
          }
        })
        .catch(function (err) {
          console.error(err);
          history.push("/");
        });
    } else {
      history.push("/");
    }
  }

  useEffect(() => {
    dispatch(userActions.getCurrentAuthenticatedUser());
  }, []);

  useEffect(() => {
    const token = user?.token;

    if (token !== undefined) {
      registerTrustedDeviceOrContinue();
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
