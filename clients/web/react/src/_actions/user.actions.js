import { userConstants } from '../_constants';
import { userService } from '../_services';
import { alertActions } from './';
import { history } from '../_helpers';

export const userActions = {
    webAuthnStart,
    logout,
    exists,
    delete: _delete,
    getCurrentAuthenticatedUser
};

function webAuthnStart() {
    return dispatch => {
        dispatch(request());

        userService.webAuthnStart()
            .then(
                response => { 
                    dispatch(success(response));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request() { return { type: userConstants.WEBAUTHN_START_REQUEST } }
    function success(response) { return { type: userConstants.WEBAUTHN_START_SUCCESS, response } }
    function failure(error) { return { type: userConstants.WEBAUTHN_START_FAILURE, error } }
}

function exists(username) {
    return dispatch => {
        dispatch(request({ username }));

        localStorage.setItem('username', username);

        userService.exists(username)
            .then(
                user => { 
                    // Exists in cognito
                    dispatch(success(user));
                    history.push('/loginWithSecurityKey');
                },
                error => {
                    // Does not exist in cognito
                    dispatch(failure(error));
                    history.push('/register');
                }
            );
    };

    function request(user) { return { type: userConstants.EXISTS_REQUEST, user } }
    function success(user) { return { type: userConstants.EXISTS_SUCCESS, user } }
    function failure(error) { return { type: userConstants.EXISTS_FAILURE, error } }
}

function logout() {
    userService.logout();
    return { type: userConstants.LOGOUT };
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(jwt) {
    return dispatch => {
        dispatch(request());

        userService.delete(jwt)
            .then(
                user => dispatch(success()),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: userConstants.DELETE_REQUEST } }
    function success() { return { type: userConstants.DELETE_SUCCESS } }
    function failure(error) { return { type: userConstants.DELETE_FAILURE, error } }
}

function getCurrentAuthenticatedUser() {
    return dispatch => {
        dispatch(request());

        userService.getCurrentAuthenticatedUser()
            .then(
                user => { 
                    dispatch(success(user));
                },
                error => {
                    dispatch(failure(error));
                }
            );
    };

    function request() { return { type: userConstants.CURRENT_USER_REQUEST } }
    function success(user) { return { type: userConstants.CURRENT_USER_SUCCESS, user } }
    function failure(error) { return { type: userConstants.CURRENT_USER_FAILURE, error } }
}