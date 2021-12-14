import React, { useEffect } from "react";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Jumbotron, Container, Row, Col, Card } from "react-bootstrap";

import Amplify from "aws-amplify";
import { history } from "../_helpers";
import { alertActions } from "../_actions";
import { PrivateRoute } from "../_components";
import HomePage from "../HomePage";
import { IdentifierFirstLoginFlowPage } from "../LoginPage";
import { LoginWithSecurityKeyPage } from "../LoginWithSecurityKeyPage";
import { RegisterPage, IdentifierFirstSignUpFlowPage } from "../RegisterPage";
import { IdentifierFirstFlowProto } from "../IdentifierFirstFlowProto";
import LogoutPage from "../LogoutPage";

import aws_exports from "../aws-exports";

const config = Amplify.configure(aws_exports);

const App = function () {
  const alert = useSelector((state) => state.alert);
  const dispatch = useDispatch();

  // console.log(JSON.stringify(config));

  useEffect(() => {
    history.listen((location, action) => {
      // clear alert on location change
      dispatch(alertActions.clear());
    });
  }, []);

  return (
    <Jumbotron>
      <Container>
        <Row className="justify-content-md-center">
          <Col md={6}>
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
                    <Route
                      path="/identifierfirstflowproto"
                      component={IdentifierFirstFlowProto}
                    />
                    <Route path="/logout" component={LogoutPage} />
                    <Redirect from="*" to="/" />
                  </Switch>
                </Router>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Jumbotron>
  );
};

export default App;
