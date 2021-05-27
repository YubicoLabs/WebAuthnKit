import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col } from 'react-bootstrap';

import { userActions } from '../_actions';
import { history } from '../_helpers';
import validate from 'validate.js';

import { IdentifierFirstFlow } from '../_components';

function IdentifierFirstFlowProto() {

    return (
        <>
            <IdentifierFirstFlow/>
        </>
    );
}

export { IdentifierFirstFlowProto };