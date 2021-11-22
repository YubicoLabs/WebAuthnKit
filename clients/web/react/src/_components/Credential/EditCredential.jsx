import React, { useState, useRef } from 'react';

import { credentialActions } from '../../_actions';

import { Button, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import validate from 'validate.js';

axios.defaults.baseURL = aws_exports.apiEndpoint;

function EditCredential(credential) {
  const [show, setShow] = useState(false);
  const [nickname, setNickname] = useState('');
  const [invalidNickname, setInvalidNickname] = useState(undefined);
  const [submitted, setSubmitted] = useState(false);
  const handleClose = () => setShowAdd(false);
  const handleShow = () => {
    setNickname(credential.credentialNickname.value);
    setCredential(credential);
    setAttestationMetadata(credential.attestationMetadata.value);
    setShow(true);
  };
  const handleDelete = () => {
    setShow(false);
    dispatch(
      credentialActions.delete(credential.credential.credentialId.base64)
    );
  };
  var constraints = {
    nickname: {
      length: {
        maximum: 20,
      },
    },
  };

  const handleSave = () => {
    setSubmitted(true);
    let result = validate({ nickname: nickname }, constraints);
    if (result) {
      setInvalidNickname(result.nickname.join('. '));
      return result;
    } else {
      setInvalidNickname(undefined);
    }

    setShow(false);
    credential.credentialNickname.value = nickname;
    dispatch(credentialActions.update(credential));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNickname(value);
  };
  const inputRef = useRef(null);

  return (
    <>
      <Button variant='secondary' onClick={handleShow}>
        Edit
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit your security key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>
            Nickname{' '}
            <input
              type='text'
              name='nickname'
              autoFocus
              value={nickname}
              ref={inputRef}
              onChange={handleChange}
              className={
                'form-control' +
                (submitted && invalidNickname ? ' is-invalid' : '')
              }
              onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                  handleSave();
                  ev.preventDefault();
                }
              }}
            />
          </label>
          <br />
          {invalidNickname ? (
            <Alert variant='danger'>{invalidNickname}</Alert>
          ) : null}
          <img
            src={
              attestationMetadata && attestationMetadata.deviceProperties
                ? attestationMetadata.deviceProperties.imageUrl
                : ''
            }
            width='25'
            height='25'
          />
          &nbsp;&nbsp;
          <label>
            {attestationMetadata && attestationMetadata.deviceProperties
              ? attestationMetadata.deviceProperties.displayName
              : ''}
          </label>
          <br />
          <label>
            <em>Usernameless a.k.a. Client-Side Discoverable Credential:</em>{' '}
            {credential.registrationRequest
              ? credential.registrationRequest.requireResidentKey.toString()
              : ''}
          </label>
          <br />
          <label>
            <em>Last Used Time:</em>{' '}
            {credential.lastUsedTime
              ? new Date(
                  credential.lastUsedTime.seconds * 1000
                ).toLocaleString()
              : ''}
          </label>
          <br />
          <label>
            <em>Last Updated Time:</em>{' '}
            {credential.lastUpdatedTime
              ? new Date(
                  credential.lastUpdatedTime.seconds * 1000
                ).toLocaleString()
              : ''}
          </label>
          <br />
          <label>
            <em>Registration Time:</em>{' '}
            {credential.registrationTime
              ? new Date(
                  credential.registrationTime.seconds * 1000
                ).toLocaleString()
              : ''}
          </label>
          <br />
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant='danger' onClick={handleDelete}>
            Delete
          </Button>
          <Button variant='primary' onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export { EditCredential };