import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col } from 'react-bootstrap';

import { userActions } from '../_actions';
import { history } from '../_helpers';
import validate from 'validate.js';

import { IdentifierFirstFlow } from '../_components';

function IdentifierFirstFlowProto() {
    const [inputs, setInputs] = useState({
        username: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [invalidUsername, setInvalidUsername] = useState(undefined);
    const { username } = inputs;
    const loggingIn = useSelector(state => state.authentication.loggingIn);
    const dispatch = useDispatch();
    var constraints = {
        username: {
            presence: true,
            format: {
                pattern: "[a-z0-9_\-]+",
                flags: "i",
                message: "can only contain a-z, 0-9, or _-"
            },
            length: {
                minimum: 3,
                maximum: 20
            }
        }
    };

    // reset login status
    useEffect(() => { 
        dispatch(userActions.logout()); 
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setInputs(inputs => ({ ...inputs, [name]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        setSubmitted(true);

        const result = validate({username: username}, constraints)
        if(result){
            console.error("invalid username: ", result);
            setInvalidUsername(result.username.join(". "));
            return;
        } else {
            setInvalidUsername(undefined);
        }

        dispatch(userActions.exists(username.toLocaleLowerCase()));
   
    }

    function handleLoginWithoutUsername() {
        localStorage.removeItem('username');
        history.push('/loginWithSecurityKey');
    }

    return (
        <>
            <IdentifierFirstFlow/>
        </>
    );
}

export { IdentifierFirstFlowProto };