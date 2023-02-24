import React, { Suspense } from "react";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import { useSelector, RootStateOrAny } from "react-redux";
import { Jumbotron, Row, Col, Card, Spinner } from "react-bootstrap";
import Amplify from "aws-amplify";
import { changeLanguage, initI18n } from "../i18n";

import { history } from "../_helpers";
import { PrivateRoute } from "../_components";
import HomePage from "../HomePage/HomePage";
import IdentifierFirstLoginFlowPage from "../LoginPage/IdentifierFirstLoginFlowPage";
import IdentifierFirstSignUpFlowPage from "../RegisterPage/IdentifierFirstSignUpFlowPage";
import LogoutPage from "../LogoutPage/LogoutPage";
import PasskeyLoginFlowPage from "../Passkey/PasskeyLoginFlowPage";

import aws_exports from "../aws-exports";

const styles = require("../_components/component.module.css");

Amplify.configure(aws_exports);

/**
 * Configurations for Internationalization
 */
const defaultLanguage = "en-US";
initI18n(`public/i18n/{{lng}}.json`, defaultLanguage);
changeLanguage(defaultLanguage);

const App = function () {
  const alert = useSelector((state: RootStateOrAny) => state.alert);

  return (
    <Suspense
      fallback={
        <div className={styles.default["textCenter"]}>
          <Spinner animation="border" role="status" variant="primary" />
        </div>
      }>
      <Jumbotron>
        <Row className="justify-content-md-center">
          <Col md={12} lg={6}>
            {alert.message && (
              <div className={`alert ${alert.type}`}>{alert.message}</div>
            )}
            <Card>
              <Card.Body>
                <img
                  src="https://avatars.githubusercontent.com/u/25739468?s=100&v=4"
                  alt="YubicoLabs"
                  className="rounded mx-auto d-block"
                />
                <Router history={history}>
                  <Switch>
                    <PrivateRoute exact path="/" component={HomePage} />
                    <Route
                      path="/login"
                      component={IdentifierFirstLoginFlowPage}
                    />
                    <Route
                      path="/register"
                      component={IdentifierFirstSignUpFlowPage}
                    />
                    <Route path="/passkey" component={PasskeyLoginFlowPage} />
                    <Route path="/logout" component={LogoutPage} />
                    <Redirect from="*" to="/" />
                  </Switch>
                </Router>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Jumbotron>
    </Suspense>
  );
};

export default App;
