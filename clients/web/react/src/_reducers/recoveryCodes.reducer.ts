import { credentialConstants } from "../_constants";

export function recoveryCodes(state = {}, action) {
  switch (action.type) {
    case credentialConstants.LIST_CODES_REQUEST:
      return {
        loading: true,
      };
    case credentialConstants.LIST_CODES_SUCCESS:
      return {
        codesRemaining: action.count,
      };
    case credentialConstants.LIST_CODES_FAILURE:
      return {
        error: action.error,
      };
    case credentialConstants.GENERATE_CODES_REQUEST:
      return {
        generating: true,
      };
    case credentialConstants.GENERATE_CODES_SUCCESS:
      return {
        generated: true,
        codes: action.codes,
      };
    case credentialConstants.GENERATE_CODES_FAILURE:
      return {
        error: action.error,
      };
    default:
      return state;
  }
}
