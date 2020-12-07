import { combineReducers } from 'redux';

import { authentication } from './authentication.reducer';
import { registration } from './registration.reducer';
import { users } from './users.reducer';
import { alert } from './alert.reducer';
import { credentials } from './credentials.reducer';
import { recoveryCodes } from './recoveryCodes.reducer';

const rootReducer = combineReducers({
  authentication,
  registration,
  users,
  alert,
  credentials,
  recoveryCodes
});

export default rootReducer;