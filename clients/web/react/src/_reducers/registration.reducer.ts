import { userConstants } from '../_constants';

export function registration(state = {}, action) {
  switch (action.type) {
    case userConstants.REGISTER_START_REQUEST:
      return {
        registering: true
      };
    case userConstants.REGISTER_START_SUCCESS:
      return {
        ISignUpResult: action.registration
      };
    case userConstants.REGISTER_START_FAILURE:
      return {
        error: action.error
      };
    case userConstants.REGISTER_FINISH_REQUEST:
      return {
        registering: true
      };
    case userConstants.REGISTER_FINISH_SUCCESS:
      return {
        ISignUpResult: action.registration
      };
    case userConstants.REGISTER_FINISH_FAILURE:
      return {
        error: action.error
      };
    default:
      return state
  }
}