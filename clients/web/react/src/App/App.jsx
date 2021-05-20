import React, { useEffect } from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Jumbotron, Container, Row, Col } from 'react-bootstrap';

import { history } from '../_helpers';
import { alertActions } from '../_actions';
import { PrivateRoute } from '../_components';
import { HomePage } from '../HomePage';
import { LoginPage } from '../LoginPage';
import { LoginWithSecurityKeyPage } from '../LoginWithSecurityKeyPage';
import { RegisterPage } from '../RegisterPage';
import { IdentifierFirstFlowProto } from '../IdentifierFirstFlowProto';

import Amplify from 'aws-amplify';
import aws_exports from '../aws-exports';

const config = Amplify.configure(aws_exports);

function App() {
    const alert = useSelector(state => state.alert);
    const dispatch = useDispatch();

    //console.log(JSON.stringify(config));

    useEffect(() => {
        history.listen((location, action) => {
            // clear alert on location change
            dispatch(alertActions.clear());
        });
    }, []);

    return (
        <div className="jumbotron">
            <div className="container">
                <div className="col-md-6 offset-md-3">
                        {alert.message &&
                            <div className={`alert ${alert.type}`}>{alert.message}</div>
                        }
                        <Router history={history}>
                            <Switch>
                                <PrivateRoute exact path="/" component={HomePage} />
                                <Route path="/login" component={LoginPage} />
                                <Route path="/loginWithSecurityKey" component={LoginWithSecurityKeyPage} />
                                <Route path="/register" component={RegisterPage} />
                                <Route path="/identifierfirstflowproto" component={IdentifierFirstFlowProto} />
                                <Redirect from="*" to="/" />
                            </Switch>
                        </Router>
                
                </div>
            </div>
        </div>
    );
}

export { App };