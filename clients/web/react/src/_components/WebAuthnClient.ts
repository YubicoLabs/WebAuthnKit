import { get, create } from "@github/webauthn-json";
import base64url from "base64url";
import cbor from "cbor";
import { Auth } from "aws-amplify";
import axios from "axios";
import credentialService from "../_services/credential.service";
import { TrustedDeviceHelper } from "./TrustedDevices/TrustedDeviceHelper";

import aws_exports from "../aws-exports";

axios.defaults.baseURL = aws_exports.apiEndpoint;

const WebAuthnClient = {
  getAuthChallegeResponse,
  getPublicKeyRequestOptions,
  // getUsernamelessAuthChallegeResponse,
  getUVFromAssertion,
  sendChallengeAnswer,
  signIn,
  signUp,
  registerNewCredential,
};

const defaultInvalidPIN = "-1";
const webAuthnClientExceptionName = "WebAuthnClientException";
const ERROR_CODE = "ERROR_CODE";
const INVALID_CHALLENGE_TYPE = "INVALID_CHALLENGE_TYPE";

function WebAuthnClientException(message, code = ERROR_CODE) {
  const formattedError = {
    message,
    code,
    name: webAuthnClientExceptionName,
  };
  return formattedError;
}

async function getPublicKeyRequestOptions(): Promise<any> {
  try {
    const response = await axios.get("/users/credentials/fido2/authenticate");
    console.log(
      "WebAuthnClient getPublicKeyRequestOptions() response: ",
      response
    );
    return response.data;
  } catch (error) {
    console.error("WebAuthnClient getPublicKeyRequestOptions() error: ", error);
    throw error;
  }
}

async function getUsernamelessAuthChallegeResponse() {
  try {
    const requestOptions = await getPublicKeyRequestOptions();

    const publicKey = {
      publicKey: requestOptions.publicKeyCredentialRequestOptions,
    };
    console.log(
      "WebAuthnClient getUsernamelessAuthChallegeResponse() publicKey: ",
      publicKey
    );

    const assertionResponse = await get(publicKey);
    console.log(
      "WebAuthnClient getUsernamelessAuthChallegeResponse() assertionResponse: ",
      assertionResponse
    );

    const userhandle = assertionResponse.response.userHandle; // Sign in to Amazon Cognito with userhandle as the `username`
    console.log(
      "WebAuthnClient getUsernamelessAuthChallegeResponse() userhandle: ",
      userhandle
    );

    const challengeResponse = {
      credential: assertionResponse,
      requestId: requestOptions.requestId,
      pinCode: defaultInvalidPIN,
    };
    console.log(
      "WebAuthnClient getUsernamelessAuthChallegeResponse() challengeResponse: ",
      challengeResponse
    );

    return { challengeResponse, userhandle };
  } catch (error) {
    console.error(
      "WebAuthnClient getUsernamelessAuthChallegeResponse() error: ",
      error
    );
    throw error;
  }
}

async function getAuthChallegeResponse(cognitoChallenge) {
  try {
    console.log(
      `WebAuthnClient getAuthChallegeResponse() cognitoChallenge response: ${JSON.stringify(
        cognitoChallenge,
        null,
        2
      )}`
    );

    const request = JSON.parse(
      cognitoChallenge.publicKeyCredentialRequestOptions
    );
    console.log("WebAuthnClient getAuthChallegeResponse() request: ", request);

    const publicKey = { publicKey: request.publicKeyCredentialRequestOptions };
    console.log(
      "WebAuthnClient getAuthChallegeResponse() publicKey: ",
      publicKey
    );

    const assertionResponse = await get(publicKey);
    console.log(
      `WebAuthnClient getAuthChallegeResponse() assertion response: ${JSON.stringify(
        assertionResponse
      )}`
    );

    const challengeResponse = {
      credential: assertionResponse,
      requestId: request.requestId,
      pinCode: defaultInvalidPIN,
    };
    console.log(
      "WebAuthnClient getAuthChallegeResponse() challengeResponse: ",
      challengeResponse
    );

    return challengeResponse;
  } catch (error) {
    console.error("WebAuthnClient getAuthChallegeResponse() error: ", error);
    throw error;
  }
}

async function getCreateCredentialChallegeResponse(
  cognitoChallenge,
  registerWebKit
) {
  try {
    console.log(
      `WebAuthnClient getCreateCredentialChallegeResponse() cognitoChallenge response: ${JSON.stringify(
        cognitoChallenge,
        null,
        2
      )}`
    );

    const request = JSON.parse(
      cognitoChallenge.publicKeyCredentialCreationOptions
    );
    console.log(
      "WebAuthnClient getCreateCredentialChallegeResponse() request: ",
      request
    );

    const publicKey = { publicKey: request.publicKeyCredentialCreationOptions };
    publicKey.publicKey.authenticatorSelection.residentKey =
      publicKey.publicKey.authenticatorSelection.residentKey.toLowerCase();
    console.log(
      "WebAuthnClient getCreateCredentialChallegeResponse() publicKey: ",
      publicKey
    );

    /**
     * The following section needs to be considered for devices that use Mac or iPhone on Safari
     * WebKit requires a user gesture to trigger the create() method
     * This section of code determines if the device is an iPhone or Mac using Safari
     * Mac and iPhone are split to change the wording between FaceID or TouchID
     * If the current device is not a device + browser combo above, then the create() api is called
     * within this method
     * Otherwise, a promise is triggered to display a button that will generate a user gesture to trigger the create() method
     */
    const { userAgent } = navigator;
    let handleCreateOption;

    if (userAgent.indexOf("Macintosh") !== -1) {
      if (
        userAgent.indexOf("Edg") === -1 &&
        userAgent.indexOf("Chrome") === -1 &&
        userAgent.indexOf("Safari") !== -1
      ) {
        handleCreateOption = 1;
      } else {
        handleCreateOption = -1;
      }
    } else if (userAgent.indexOf("iPhone") !== -1) {
      if (
        userAgent.indexOf("Edg") === -1 &&
        userAgent.indexOf("Chrome") === -1 &&
        userAgent.indexOf("Safari") !== -1
      ) {
        handleCreateOption = 2;
      } else {
        handleCreateOption = -1;
      }
    } else {
      handleCreateOption = -1;
    }

    let attestationResponse;

    if (handleCreateOption === -1) {
      // Non Apple + Safari request, proceed as normal
      console.log(
        "WebAuthnClient getCreateCredentialChallegeResponse() handleCreationOption: Handling non-Apple/non-Safari login"
      );
      attestationResponse = await create(publicKey);
    } else if (handleCreateOption === 1) {
      // Mac + Safari request, trigger promise with TouchID
      console.log(
        "WebAuthnClient getCreateCredentialChallegeResponse() handleCreationOption: Handling Mac Safari login"
      );
      attestationResponse = await registerWebKit("macos", publicKey);
    } else if (handleCreateOption === 2) {
      // iPhone + Safari request, trigger promise with FaceID
      console.log(
        "WebAuthnClient getCreateCredentialChallegeResponse() handleCreationOption: Handling iPhone Safari login"
      );
      attestationResponse = await registerWebKit("ios", publicKey);
    }

    /** Come back right here, and add the undercase treatment to the resident key value */

    console.log(
      `WebAuthnClient getCreateCredentialChallegeResponse() attestationResponse: ${JSON.stringify(
        attestationResponse
      )}`
    );

    const challengeResponse = {
      credential: attestationResponse,
      requestId: request.requestId,
      pinCode: defaultInvalidPIN,
    };
    console.log(
      "WebAuthnClient getCreateCredentialChallegeResponse() challengeResponse: ",
      challengeResponse
    );

    return challengeResponse;
  } catch (error) {
    console.error(
      "WebAuthnClient getCreateCredentialChallegeResponse() error: ",
      error
    );
    throw error;
  }
}

function getUVFromAssertion(authenticatorData) {
  const buffer = base64url.toBuffer(authenticatorData);

  return getUV(buffer);
}

function getUVFromAttestation(attestationObject) {
  const attestationBuffer = base64url.toBuffer(attestationObject);
  const attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
  const buffer = attestationStruct.authData;

  return getUV(buffer);
}

function getUV(buffer) {
  const flagsBuf = buffer.slice(32, 33);
  const flagsInt = flagsBuf[0];
  const flags = {
    up: !!(flagsInt & 0x01),
    uv: !!(flagsInt & 0x04),
    at: !!(flagsInt & 0x40),
    ed: !!(flagsInt & 0x80),
    flagsInt,
  };
  return flags.uv;
}

async function signIn(name, requestUV) {
  console.log("WebAuthnClient signIn() name=", name);

  try {
    let username;
    let challengeResponse;

    if (name === undefined) {
      console.log("WebAuthnClient signIn() usernameless flow");
      // username = await getUsernamelessAuthChallegeResponse();
      const userhandleChallengeResponse =
        await getUsernamelessAuthChallegeResponse();
      username = userhandleChallengeResponse.userhandle;
      challengeResponse = userhandleChallengeResponse.challengeResponse;
    } else {
      console.log("WebAuthnClient signIn() username flow");
      username = name.toLocaleLowerCase();
      localStorage.setItem("username", username);
    }

    const cognitoUser = await Auth.signIn(username);
    console.log("WebAuthnClient signIn() CognitoUser: ", cognitoUser);

    if (
      cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
      cognitoUser.challengeParam.type === "webauthn.create"
    ) {
      throw WebAuthnClientException(
        "User not found. Please Sign Up.",
        INVALID_CHALLENGE_TYPE
      );
    } else if (
      cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
      cognitoUser.challengeParam.type === "webauthn.get"
    ) {
      if (challengeResponse === undefined) {
        console.log(
          "WebAuthnClient signIn() get challenge response for username flow"
        );
        challengeResponse = await getAuthChallegeResponse(
          cognitoUser.challengeParam
        );
      }
      console.log(
        "WebAuthnClient signIn() challengeResponse: ",
        challengeResponse
      );

      const isUserVerified = getUVFromAssertion(
        challengeResponse.credential.response.authenticatorData
      );
      console.log("WebAuthnClient signIn() isUserVerified: ", isUserVerified);

      let pin = defaultInvalidPIN;
      if (isUserVerified == false) {
        console.log("WebAuthnClient signIn() requesting UV: ");
        pin = await requestUV(challengeResponse);
      }

      console.log("WebAuthnClient signIn() sending challenge answer");
      const userData = await sendChallengeAnswer(
        cognitoUser,
        challengeResponse,
        pin
      );

      return userData;
    } else {
      // TODO move dispatch to UI logic
      // dispatch(alertActions.error("Invalid server response"));
      console.error(
        "WebAuthnClient signIn() error: throw WebAuthnClientException"
      );
      throw WebAuthnClientException("Invalid server response");
    }
  } catch (error) {
    console.error("WebAuthnClient signIn() error: ", error);
    // TODO move dispatch to UI logic
    // dispatch(alertActions.error(err.message));
    throw error;
  }
}

async function sendChallengeAnswer(
  cognitoUser,
  challengeResponse,
  pin = defaultInvalidPIN
) {
  challengeResponse.pinCode = parseInt(pin);
  console.log("WebAuthnClient sendChallengeAnswer(): ", challengeResponse);

  let userData;

  try {
    const user = await Auth.sendCustomChallengeAnswer(
      cognitoUser,
      JSON.stringify(challengeResponse)
    );

    console.log("WebAuthnClient sendChallengeAnswer user: ", user);

    userData = {
      id: 1,
      username: user.username,
      credential: challengeResponse.credential,
    };
    localStorage.setItem("user", JSON.stringify(userData));
    console.log(
      "WebAuthnClient sendChallengeAnswer userData: ",
      localStorage.getItem("user")
    );
  } catch (error) {
    console.error("WebAuthnClient sendCustomChallengeAnswer() error: ", error);
    // TODO move dispatch to UI logic
    // dispatch(alertActions.error(err.message));
    throw error;
  }
  return userData;
}

async function signUp(name, requestUV, registerWebKit) {
  console.log("WebAuthnClient signUp() name=", name);

  // Start Registration
  // First, Cognito needs to make an account for the user
  const randomString = (length) =>
    [...Array(length)]
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join("");
  const password = randomString(14);
  const username = name.toLocaleLowerCase();
  localStorage.setItem("username", username);
  const attributes = { name: username };

  try {
    const { user } = await Auth.signUp({
      username,
      password,
      attributes,
    });
    console.log("SignUp: ", user);
  } catch (error) {
    // A user can get here if they come back to register after the initial registration was interrupted
    console.log(error);
    throw error;
  }

  // Second, register a webauthn credential associated with the user account
  try {
    const cognitoUser = await Auth.signIn(username);
    console.log("WebAuthnClient signUp() CognitoUser: ", cognitoUser);

    if (
      cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
      cognitoUser.challengeParam.type === "webauthn.get"
    ) {
      throw WebAuthnClientException(
        "User already exists. Please Sign In.",
        INVALID_CHALLENGE_TYPE
      );
    } else if (
      cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
      cognitoUser.challengeParam.type === "webauthn.create"
    ) {
      const challengeResponse = await getCreateCredentialChallegeResponse(
        cognitoUser.challengeParam,
        registerWebKit
      );
      console.log(
        "WebAuthnClient signUp() challengeResponse: ",
        challengeResponse
      );

      const isUserVerified = getUVFromAttestation(
        challengeResponse.credential.response.attestationObject
      );
      console.log("WebAuthnClient signUp() isUserVerified: ", isUserVerified);

      let pin = defaultInvalidPIN;
      if (isUserVerified == false) {
        console.log("WebAuthnClient signUp() requesting UV: ");
        pin = await requestUV(challengeResponse);
      }

      console.log("WebAuthnClient signUp() sending challenge answer");
      const userData = await sendChallengeAnswer(
        cognitoUser,
        challengeResponse,
        pin
      );
      console.log("WebAuthnClient signUp() userData: ", userData);

      return userData;
    } else {
      console.error(
        "WebAuthnClient signUp() error: throw WebAuthnClientException"
      );
      throw WebAuthnClientException("Invalid server response");
    }
  } catch (error) {
    console.error("WebAuthnClient signUp() error: ", error);
    throw error;
  }
}

async function registerNewCredential(
  nickname,
  isResidentKey,
  authenticatorAttachment = "CROSS_PLATFORM",
  requestUV
) {
  try {
    console.log("WebAuthnClient registerNewCredential() begin: ", {
      nickname,
      isResidentKey,
      authenticatorAttachment,
    });
    const startRegistrationResponse = await axios.post(
      "/users/credentials/fido2/register",
      {
        nickname,
        requireResidentKey: isResidentKey,
        requireAuthenticatorAttachment: authenticatorAttachment,
      }
    );

    console.log(
      "WebAuthnClient registerNewCredential() Registration Response: ",
      startRegistrationResponse
    );

    const { requestId } = startRegistrationResponse.data;

    const publicKey = {
      publicKey:
        startRegistrationResponse.data.publicKeyCredentialCreationOptions,
    };
    console.log("publlicKey: ", publicKey);

    const makeCredentialResponse = await create(publicKey);
    console.log(
      "WebAuthnClient registerNewCredential() Make Credential: ",
      makeCredentialResponse
    );

    const uv = getUVFromAttestation(
      makeCredentialResponse.response.attestationObject
    );
    console.log("uv: ", uv);

    const challengeResponse = {
      credential: makeCredentialResponse,
      requestId,
      pinSet: startRegistrationResponse.data.pinSet,
      pinCode: defaultInvalidPIN,
      nickname,
    };
    console.log("challengeResponse: ", challengeResponse);

    if (uv === true) {
      await credentialService.registerFinish(challengeResponse);
      if (authenticatorAttachment === "PLATFORM") {
        TrustedDeviceHelper.setTrustedDevice(
          TrustedDeviceHelper.TrustedDeviceEnum.CONFIRMED,
          challengeResponse.credential.id
        );
      }
    } else {
      const uvPin = await requestUV(challengeResponse);
      console.log("AddCredential, new Key PIN is: ", uvPin);
      challengeResponse.pinCode = uvPin;
      await credentialService.registerFinish(challengeResponse);
    }
  } catch (error) {
    console.error("WebAuthnClient registerNewCredential() error: ", error);
    throw error;
  }
}

export { WebAuthnClient };
