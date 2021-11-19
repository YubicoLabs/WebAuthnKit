import React, { useEffect } from 'react';

import { Spinner } from 'react-bootstrap';

const LogOutStep = ({ navigation }) => {
  useEffect(() => {
    setTimeout(function () {
      console.log('Called into loader');
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
