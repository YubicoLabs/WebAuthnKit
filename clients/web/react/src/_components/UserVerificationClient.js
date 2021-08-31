import React, { useState, useEffect, useRef, Profiler } from 'react';
import { Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import validate from 'validate.js';

export function UserVerificationClient(props) {
    const cognitoUser = props.cognitoUser;
    const finishUVRequest = useSelector(state => state.credentials.finishUVRequest);
    const svpinDispatchProps = { type: "dispatch", saveCallback: finishUVResponse, showSelector: finishUVRequest };


    function finishUVResponse(fields) {
        let challengeResponse = finishUVRequest;
        console.log("sending authenticator response with sv-pin: ", challengeResponse);
        challengeResponse.pinCode = parseInt(fields.pin);

        Auth.sendCustomChallengeAnswer(cognitoUser, JSON.stringify(challengeResponse))
            .then(user => {
                console.log("uv sendCustomChallengeAnswer: ", user);

                Auth.currentSession()
                    .then(data => {
                        dispatch(alertActions.success('Authentication successful'));
                        let userData = {
                            id: 1,
                            username: user.attributes.name,
                            token: data.getAccessToken().getJwtToken()
                        }
                        localStorage.setItem('user', JSON.stringify(userData));
                        console.log("userData ", localStorage.getItem('user'));
                        history.push('/');
                    })
                    .catch(err => {
                        console.log("currentSession error: ", err);
                        dispatch(alertActions.error("Something went wrong. ", err.message));
                        setContinueSubmitted(false);
                    });

            })
            .catch(err => {
                console.log("sendCustomChallengeAnswer error: ", err);
                let message = "Invalid PIN";
                dispatch(alertActions.error(message));
                setContinueSubmitted(false);
            });
        dispatch(credentialActions.completeUV());
    }

    return (
        <>
            <ServerVerifiedPin {...svpinDispatchProps} />
        </>
    );
}