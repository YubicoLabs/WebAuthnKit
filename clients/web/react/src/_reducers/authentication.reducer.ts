import { userConstants } from '../_constants';

let user = JSON.parse(localStorage.getItem('user'));
const initialState = user ? { loggedIn: true, user } : {};

export function authentication(state = initialState, action) {
  switch (action.type) {
    case userConstants.WEBAUTHN_START_REQUEST:
      return {
        webAuthnReady: false,
      };
    case userConstants.WEBAUTHN_START_SUCCESS:
      return {
        webAuthnReady: true,
        webAuthnStartResponse: action.response
      };
    case userConstants.WEBAUTHN_START_FAILURE:
      return {
        error: action.error
      };
    case userConstants.WEBAUTHN_FINISH_REQUEST:
      return {
        loggingIn: true,
        webAuthnFinishResponse: action.assertion
      };
    case userConstants.WEBAUTHN_FINISH_SUCCESS:
      return {
        loggedIn: true,
        user: action.user
      };
    case userConstants.WEBAUTHN_FINISH_FAILURE:
      return {};
    case userConstants.LOGIN_REQUEST:
      return {
        loggingIn: true,
        user: action.user
      };
    case userConstants.LOGIN_SUCCESS:
      return {
        loggedIn: true,
        user: action.user
      };
    case userConstants.LOGIN_FAILURE:
      return {};
    case userConstants.LOGOUT:
      return {};
    case userConstants.EXISTS_REQUEST:
      return {
        signInResult: undefined
      };
    case userConstants.EXISTS_SUCCESS:
      return {
        signInResult: action.user
      };
    case userConstants.EXISTS_FAILURE:
      return {
        signInResult: action.error
      };
    default:
      return state
  }
}