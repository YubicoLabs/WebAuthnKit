import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { userActions } from '../_actions';

import { Spinner } from 'react-bootstrap';

const LogOutStep = ({ navigation }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    setTimeout(function () {
      console.log('Called into logout');
      dispatch(userActions.logout());
      navigation.go('LogInStep');
    }, 1000);
  }, []);

  return (
    <>
      <center>
        <Spinner animation='border' role='status' variant='primary'></Spinner>
        <h2>Thank you for joining us!</h2>
      </center>
    </>
  );
};

export default LogOutStep;
