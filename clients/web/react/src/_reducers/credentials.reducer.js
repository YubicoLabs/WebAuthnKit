import { credentialConstants } from '../_constants';

export function credentials(state = {}, action) {
  switch (action.type) {
    case credentialConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case credentialConstants.GETALL_SUCCESS:
      return {
        items: action.credentials.fido,
        recoveryCodesViewed: action.credentials.recoveryCodesViewed,
        allRecoveryCodesUsed: action.credentials.allRecoveryCodesUsed
      };
    case credentialConstants.GETALL_FAILURE:
      return { 
        error: action.error
      };
    case credentialConstants.GETUV_REQUEST:
      return { 
        finishUVRequest: action.uvRequest
      };
    case credentialConstants.GETUV_COMPLETE:
      return { 
        finishUVRequest: undefined
      };
    case credentialConstants.DELETE_REQUEST:
      // add 'deleting:true' property to credential being deleted
      return {
        ...state,
        items: state.items.map(credential =>
          credential.id === action.id
            ? { ...credential, deleting: true }
            : credential
        )
      };
    case credentialConstants.DELETE_SUCCESS:
      // remove deleted credential from state
      return {
        items: state.items.filter(credential => credential.id !== action.id)
      };
    case credentialConstants.DELETE_FAILURE:
      // remove 'deleting:true' property and add 'deleteError:[error]' property to credential 
      return {
        ...state,
        items: state.items.map(credential => {
          if (credential.id === action.id) {
            // make copy of credential without 'deleting:true' property
            const { deleting, ...credentialCopy } = credential;
            // return copy of credential with 'deleteError:[error]' property
            return { ...credentialCopy, deleteError: action.error };
          }

          return credential;
        })
      };
    case credentialConstants.REGISTER_START_REQUEST:
      return {
        registering: true
      };
    case credentialConstants.REGISTER_START_SUCCESS:
      return {
        registrationResponse: action.registration
      };
    case credentialConstants.REGISTER_START_FAILURE:
      return { 
        error: action.error
      };
    case credentialConstants.REGISTER_FINISH_REQUEST:
      return {
        registering: true
      };
    case credentialConstants.REGISTER_FINISH_SUCCESS:
      return {
        registrationResponse: action.registration
      };
    case credentialConstants.REGISTER_FINISH_FAILURE:
      return { 
        error: action.error
      };
    default:
      return state
  }
}