import { combineReducers } from 'redux';

import { authentication as authentication } from './authentication.reducer';
import { registration as registration } from './registration.reducer';
import { users as users } from './users.reducer';
import { alert as alert } from './alert.reducer';
import { credentials as credentials } from './credentials.reducer';
import { recoveryCodes as recoveryCodes } from './recoveryCodes.reducer';

const rootReducer = combineReducers({
  authentication,
  registration,
  users,
  alert,
  credentials,
  recoveryCodes
});

export default rootReducer;