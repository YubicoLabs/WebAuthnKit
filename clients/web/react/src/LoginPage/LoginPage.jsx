import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col } from 'react-bootstrap';

import { userActions } from '../_actions';
import { history } from '../_helpers';
import validate from 'validate.js';

function LoginPage() {
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
            <h2>WebAuthn Starter Kit</h2>
            <label><em>Enter a username to create an account or sign in.</em></label>
            <form name="form" onSubmit={handleSubmit}>
                <div className="form-group">
                            <label>Username</label>
                            <input type="text" name="username" autoFocus value={username} onChange={handleChange} className={'form-control' + (submitted && invalidUsername ? ' is-invalid' : '')} />
                            {submitted && invalidUsername &&
                                <div className="invalid-feedback">{invalidUsername}</div>
                            }
                </div>
                <div className="form-group">
                            <button className="btn btn-primary">
                                {loggingIn && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                Next
                            </button>
                </div>
            </form>
            <label onClick={handleLoginWithoutUsername} className="btn btn-link">Usernameless Sign In</label>
        </>
    );
}

export { LoginPage };