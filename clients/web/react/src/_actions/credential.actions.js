import { credentialConstants } from '../_constants';
import { credentialService } from '../_services';
import { alertActions } from '.';
import validate from 'validate.js';

export const credentialActions = {
    generateRecoveryCodes,
    listRecoveryCodes,
    update,
    updatePin,
    registerStart,
    registerFinish,
    getAll,
    getUV,
    completeUV,
    delete: _delete,
    validateCredentialNickname
};

const constraints = {
    nickname: {
        length: {
            maximum: 20
        }
    }
  };

function generateRecoveryCodes() {
    return dispatch => {
        dispatch(request());

        credentialService.generateRecoveryCodes()
            .then(
                data => { 
                    dispatch(success(data));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request() { return { type: credentialConstants.GENERATE_CODES_REQUEST } }
    function success(codes) { return { type: credentialConstants.GENERATE_CODES_SUCCESS, codes } }
    function failure(error) { return { type: credentialConstants.GENERATE_CODES_FAILURE, error } }
}

function listRecoveryCodes() {
    return dispatch => {
        dispatch(request());

        credentialService.listRecoveryCodes()
            .then(
                count => { 
                    dispatch(success(count));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request() { return { type: credentialConstants.LIST_CODES_REQUEST } }
    function success(count) { return { type: credentialConstants.LIST_CODES_SUCCESS, count } }
    function failure(error) { return { type: credentialConstants.LIST_CODES_FAILURE, error } }
}

function update(credential) {
    return dispatch => {
        dispatch(request({ credential }));

        credentialService.update(credential)
            .then(
                credential => { 
                    dispatch(success(credential));
                    dispatch(alertActions.success('Update successful'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(credential) { return { type: credentialConstants.UPDATE_REQUEST, credential } }
    function success(credential) { return { type: credentialConstants.UPDATE_SUCCESS, credential } }
    function failure(error) { return { type: credentialConstants.UPDATE_FAILURE, error } }
}

function updatePin(fields) {
    return dispatch => {
        dispatch(request({ fields }));

        credentialService.updatePin(fields)
            .then(
                response => { 
                    dispatch(success(response));
                    dispatch(alertActions.success('Update successful'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(response) { return { type: credentialConstants.UPDATE_REQUEST, response } }
    function success(response) { return { type: credentialConstants.UPDATE_SUCCESS, response } }
    function failure(error) { return { type: credentialConstants.UPDATE_FAILURE, error } }
}

function registerStart(registration) {
    return dispatch => {
        dispatch(request(registration));

        credentialService.registerStart(registration)
            .then(
                registration => { 
                    dispatch(success(registration));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(registration) { return { type: credentialConstants.REGISTER_START_REQUEST, registration } }
    function success(registration) { return { type: credentialConstants.REGISTER_START_SUCCESS, registration } }
    function failure(error) { return { type: credentialConstants.REGISTER_START_FAILURE, error } }
}

function registerFinish(registration) {
    return dispatch => {
        dispatch(request(registration));

        credentialService.registerFinish(registration)
            .then(
                registration => { 
                    console.log("credential.actions registerFinish registration: ", registration);
                    if (registration === undefined) {
                        dispatch(failure('Registration failed'));
                        dispatch(alertActions.error('Registration failed'));
                    } else {
                        dispatch(success(registration));
                        dispatch(alertActions.success('Registration successful'));
                    }
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(registration) { return { type: credentialConstants.REGISTER_FINISH_REQUEST, registration } }
    function success(registration) { return { type: credentialConstants.REGISTER_FINISH_SUCCESS, registration } }
    function failure(error) { return { type: credentialConstants.REGISTER_FINISH_FAILURE, error } }
}

function getAll(id) {
    return dispatch => {
        dispatch(request());

        credentialService.getAll(id)
            .then(
                credentials => dispatch(success(credentials)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: credentialConstants.GETALL_REQUEST } }
    function success(credentials) { return { type: credentialConstants.GETALL_SUCCESS, credentials } }
    function failure(error) { return { type: credentialConstants.GETALL_FAILURE, error } }
}

function getUV(uvRequest) {
    return dispatch => {
        dispatch(request(uvRequest));

        /*credentialService.getAll(id)
            .then(
                credentials => dispatch(success(credentials)),
                error => dispatch(failure(error.toString()))
            );*/
    };

    function request(uvRequest) { return { type: credentialConstants.GETUV_REQUEST, uvRequest } }
    //function success(credentials) { return { type: credentialConstants.GETALL_SUCCESS, credentials } }
    //function failure(error) { return { type: credentialConstants.GETALL_FAILURE, error } }
}

function completeUV() {
    return dispatch => {
        dispatch(success());

        /*credentialService.getAll(id)
            .then(
                credentials => dispatch(success(credentials)),
                error => dispatch(failure(error.toString()))
            );*/
    };

    //function request(uvRequest) { return { type: credentialConstants.GETUV_REQUEST, uvRequest } }
    function success() { return { type: credentialConstants.GETUV_COMPLETE } }
    //function failure(error) { return { type: credentialConstants.GETALL_FAILURE, error } }
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    return dispatch => {
        dispatch(request(id));

        credentialService.delete(id)
            .then(
                credentials => {
                    dispatch(success(id));
                    dispatch(alertActions.success('Delete credential successful'));
                },
                error => {
                    dispatch(failure(id, error.toString()));
                }
            );
    };

    function request(id) { return { type: credentialConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: credentialConstants.DELETE_SUCCESS, id } }
    function failure(id, error) { return { type: credentialConstants.DELETE_FAILURE, id, error } }
}

function validateCredentialNickname(nickname) {
    return dispatch => {
        dispatch(request(nickname));

        let result = validate({nickname: nickname}, constraints);

        if(result) {

            let error = result.nickname.join(". ");
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
      
          } else {
            dispatch(success(nickname));
          }

    };

    function request(nickname) { return { type: credentialConstants.NICKNAME_REQUEST, nickname } }
    function success(nickname) { return { type: credentialConstants.NICKNAME_SUCCESS, nickname } }
    function failure(nickname, error) { return { type: credentialConstants.NICKNAME_FAILURE, nickname, error } }
}
