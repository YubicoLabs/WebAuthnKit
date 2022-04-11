import { get, create } from "@github/webauthn-json";
import base64url from "base64url";
import cbor from "cbor";
import { Auth } from "aws-amplify";
import axios from "axios";
import credentialService from "../_services/credential.service";
import { TrustedDeviceHelper } from "./TrustedDevices/TrustedDeviceHelper";
import { i18n } from "../i18n";

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

const { t } = i18n;

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

/**
 * Used to directly request a challenge from the RP to be used to validate a credential for usernameless login
 * @returns challenge request to be signed by the user of a discoverable credential
 */
async function getPublicKeyRequestOptions(): Promise<any> {
  try {
    const response = await axios.get("/users/credentials/fido2/authenticate");
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getPublicKeyRequestOptions()",
        LOG_REASON: t("console.reason.webauthnClient2"),
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getPublicKeyRequestOptions",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    throw error;
  }
}

/**
 * Method to invoke the usernamless sign in of a user - handles the full process including:
 * 1) Request challenge response
 * 2) Calls to the RP to get a challenge to sign
 * 3) Attempts to locate a discoverable/resident credential using the rpId using WebAuth.get()
 * 4) Signs the challenge and presents it to the RP
 * Used to populate the user handle, and challenge in the SignIn() method if no username was provided by the user
 * @returns An object that contains
 */
async function getUsernamelessAuthChallegeResponse() {
  try {
    const requestOptions = await getPublicKeyRequestOptions();

    const publicKey = {
      publicKey: requestOptions.publicKeyCredentialRequestOptions,
    };
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getUsernamelessAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient3"),
      }),
      publicKey
    );

    const assertionResponse = await get(publicKey);

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getUsernamelessAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient4"),
      }),
      assertionResponse
    );

    const userhandle = assertionResponse.response.userHandle; // Sign in to Amazon Cognito with userhandle as the `username`

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getUsernamelessAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient5"),
      }),
      userhandle
    );

    const challengeResponse = {
      credential: assertionResponse,
      requestId: requestOptions.requestId,
      pinCode: defaultInvalidPIN,
    };

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getUsernamelessAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient6"),
      }),
      challengeResponse
    );

    return { challengeResponse, userhandle };
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getUsernamelessAuthChallegeResponse",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    throw error;
  }
}

/**
 * Wrapper to run the WebAuthn.get() method
 * Accepts the challenge issued by the Relying Party - Will attempt to sign the challenge using one of the credentials that are contained in the PublicKeyCredential options
 * This method is only used to Sign In the user, this works under the assumption that a credential has been registered to an account
 * More information can be found here: https://www.w3.org/TR/webauthn-2/#publickeycredential
 * @param cognitoChallenge Object containing the PublicKeyCredential object, which includes the RP challenge
 * @returns The signed challenge to return to the RP
 * An error may be returned if the get() method is cancelled, or there are no registered credentials to sign in the user
 */
async function getAuthChallegeResponse(cognitoChallenge) {
  try {
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient7"),
      }),
      JSON.stringify(cognitoChallenge, null, 2)
    );

    const request = JSON.parse(
      cognitoChallenge.publicKeyCredentialRequestOptions
    );
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient8"),
      }),
      request
    );

    const publicKey = { publicKey: request.publicKeyCredentialRequestOptions };
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient3"),
      }),
      publicKey
    );

    const assertionResponse = await get(publicKey);
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient3"),
      }),
      assertionResponse
    );

    const challengeResponse = {
      credential: assertionResponse,
      requestId: request.requestId,
      pinCode: defaultInvalidPIN,
    };
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getAuthChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient6"),
      }),
      challengeResponse
    );

    return challengeResponse;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getAuthChallegeResponse",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    throw error;
  }
}

/**
 * Wrapper to run the WebAuthn.create() method
 * Accepts a PublicKeyCredential object from the RP that contains the metadata necessary to generate a new credential on an authenticator
 * This method is only used on initial user registration
 * This method also has special logic for different registration flows for browsers and platforms leveraging WebKit from Apple - IOS and MacOS devices require an additional user prompt to generate the credential
 * @param cognitoChallenge PublicKeyCredential from the RP containing the initial challenge to sign, RP name and ID, userhandles, and authenticator options when creating the credential
 * @param registerWebKit Callback method sent by the parent component to display an additional prompt to adhere to WebKit's requirement to generate credentials only on user gesture
 * @returns Challenge response containing the new credential that was generated by the create() method
 */
async function getCreateCredentialChallegeResponse(
  cognitoChallenge,
  registerWebKit
) {
  try {
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getCreateCredentialChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient7"),
      }),
      JSON.stringify(cognitoChallenge, null, 2)
    );

    const request = JSON.parse(
      cognitoChallenge.publicKeyCredentialCreationOptions
    );

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getCreateCredentialChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient8"),
      }),
      request
    );

    const publicKey = { publicKey: request.publicKeyCredentialCreationOptions };
    publicKey.publicKey.authenticatorSelection.residentKey =
      publicKey.publicKey.authenticatorSelection.residentKey.toLowerCase();

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getCreateCredentialChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient3"),
      }),
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
      attestationResponse = await create(publicKey);
    } else if (handleCreateOption === 1) {
      // Mac + Safari request, trigger promise with TouchID
      attestationResponse = await registerWebKit("macos", publicKey);
    } else if (handleCreateOption === 2) {
      // iPhone + Safari request, trigger promise with FaceID
      attestationResponse = await registerWebKit("ios", publicKey);
    }

    /** Come back right here, and add the undercase treatment to the resident key value */
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getCreateCredentialChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient3"),
      }),
      attestationResponse
    );

    const challengeResponse = {
      credential: attestationResponse,
      requestId: request.requestId,
      pinCode: defaultInvalidPIN,
    };

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getCreateCredentialChallegeResponse()",
        LOG_REASON: t("console.reason.webauthnClient6"),
      }),
      challengeResponse
    );

    return challengeResponse;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "getCreateCredentialChallegeResponse()",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    throw error;
  }
}

function getUVFromAssertion(authenticatorData) {
  const buffer = base64url.toBuffer(authenticatorData);

  return getUV(buffer);
}

/**
 * Method used to determine if UV was present when attempting to use the credential
 * @param attestationObject Authenticator data which can signal if UV was present during the credential ceremony
 * @returns True if UV was present, False otherwise
 */
function getUVFromAttestation(attestationObject) {
  const attestationBuffer = base64url.toBuffer(attestationObject);
  const attestationStruct = cbor.decodeAllSync(attestationBuffer)[0];
  const buffer = attestationStruct.authData;

  return getUV(buffer);
}

/**
 * Method used to determine if UV was present when attempting to use the credential
 * @param buffer Authenticator data which can signal if UV was present during the credential ceremony
 * @returns True if UV was present, False otherwise
 */
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

/**
 * Method used to sign in the user from the Login screen flow
 * @param name Username of the user to authenticate - may be undefined which will signal to the method to use usernameless authentication
 * @param requestUV Callback method to trigger a modal to prompt the user to provide a U2F Password if UV is not present during the WebAuthn.get() ceremony
 * @returns an object containing user credentials that can be used to access application resources
 */
async function signIn(name, requestUV) {
  console.info(
    t("console.info", {
      COMPONENT: "WebAuthnClient",
      METHOD: "signIn()",
      LOG_REASON: t("console.reason.webauthnClient5"),
    }),
    name
  );

  try {
    let username;
    let challengeResponse;

    if (name === undefined) {
      console.info(
        t("console.info", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signIn()",
          LOG_REASON: t("console.reason.webauthnClient9"),
        })
      );
      const userhandleChallengeResponse =
        await getUsernamelessAuthChallegeResponse();
      username = userhandleChallengeResponse.userhandle;
      challengeResponse = userhandleChallengeResponse.challengeResponse;
    } else {
      console.info(
        t("console.info", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signIn()",
          LOG_REASON: t("console.reason.webauthnClient10"),
        })
      );
      username = name.toLocaleLowerCase();
      localStorage.setItem("username", username);
    }

    const cognitoUser = await Auth.signIn(username);
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "signIn()",
        LOG_REASON: t("console.reason.webauthnClient11"),
      }),
      cognitoUser
    );

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
        challengeResponse = await getAuthChallegeResponse(
          cognitoUser.challengeParam
        );
      }
      const isUserVerified = getUVFromAssertion(
        challengeResponse.credential.response.authenticatorData
      );
      console.info(
        t("console.info", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signIn()",
          LOG_REASON: t("console.reason.webauthnClient12"),
        }),
        isUserVerified
      );

      let pin = defaultInvalidPIN;
      if (isUserVerified == false) {
        pin = await requestUV(challengeResponse);
      }

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
        t("console.error", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signIn()",
          REASON: t("console.reason.webauthnClient0"),
        })
      );
      throw WebAuthnClientException("Invalid server response");
    }
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "signIn()",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    // TODO move dispatch to UI logic
    // dispatch(alertActions.error(err.message));
    throw error;
  }
}

/**
 * Method used to send the challenge response back to the RP to prove that the user has a valid credential
 * @param cognitoUser Data on the user provided by the IAM
 * @param challengeResponse Contains data about the credential to send back to the RP to validate that it's valid
 * @param pin U2F Password to validate the user if their authenticator did not prompt for UV
 * @returns user data containing user credentials if the challenge was signed correctly, an error will be thrown if the signed challenge was not provided
 */
async function sendChallengeAnswer(
  cognitoUser,
  challengeResponse,
  pin = defaultInvalidPIN
) {
  challengeResponse.pinCode = parseInt(pin);

  console.info(
    t("console.info", {
      COMPONENT: "WebAuthnClient",
      METHOD: "sendChallengeAnswer()",
      LOG_REASON: t("console.reason.webauthnClient6"),
    }),
    challengeResponse
  );

  let userData;

  try {
    const user = await Auth.sendCustomChallengeAnswer(
      cognitoUser,
      JSON.stringify(challengeResponse)
    );

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "sendChallengeAnswer()",
        LOG_REASON: t("console.reason.webauthnClient11"),
      }),
      user
    );

    userData = {
      id: 1,
      username: user.username,
      credential: challengeResponse.credential,
    };
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "sendCustomChallengeAnswer()",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    // TODO move dispatch to UI logic
    // dispatch(alertActions.error(err.message));
    throw error;
  }
  return userData;
}

/**
 * Method used to register a new user. The process goes:
 * 1) Create the user in Cognito
 * 2) Sign in the user directly in Cognito to ensure the user was created
 * 3) Attempt to register the first user credential
 * 4) Create the credential, then attempt to authenticate by sending a signed challenge
 * @param name username of the user to create
 * @param requestUV callback used to trigger modal if UV is not present on the authenticator allowing the user to provide a U2F Password
 * @param registerWebKit Callback method sent by the parent component to display an additional prompt to adhere to WebKit's requirement to generate credentials only on user gesture
 * @returns user data containing user credentials if the challenge was signed correctly, an error will be thrown if the signed challenge was not provided
 */
async function signUp(name, requestUV, registerWebKit) {
  console.info(
    t("console.info", {
      COMPONENT: "WebAuthnClient",
      METHOD: "signUp()",
      LOG_REASON: t("console.reason.webauthnClient13"),
    }),
    name
  );

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
  } catch (error) {
    // A user can get here if they come back to register after the initial registration was interrupted
    if (error.code === "UsernameExistsException") {
      console.error(
        t("console.error", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signUp()",
          REASON: t("console.reason.webauthnClient1"),
        }),
        error
      );
      console.info(
        t("console.info", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signUp()",
          LOG_REASON: t("console.reason.webauthnClient14"),
        })
      );
    } else {
      throw error;
    }
  }

  // Second, register a webauthn credential associated with the user account
  try {
    const cognitoUser = await Auth.signIn(username);
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "signUp()",
        LOG_REASON: t("console.reason.webauthnClient11"),
      }),
      cognitoUser
    );

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

      const isUserVerified = getUVFromAttestation(
        challengeResponse.credential.response.attestationObject
      );
      console.info(
        t("console.info", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signUp()",
          LOG_REASON: t("console.reason.webauthnClient12"),
        }),
        isUserVerified
      );

      let pin = defaultInvalidPIN;
      if (isUserVerified == false) {
        pin = await requestUV(challengeResponse);
      }

      const userData = await sendChallengeAnswer(
        cognitoUser,
        challengeResponse,
        pin
      );
      console.info(
        t("console.info", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signUp()",
          LOG_REASON: t("console.reason.webauthnClient15"),
        }),
        userData
      );

      return userData;
    } else {
      console.error(
        t("console.error", {
          COMPONENT: "WebAuthnClient",
          METHOD: "signUp()",
          REASON: t("console.reason.webauthnClient0"),
        })
      );
      throw WebAuthnClientException("Invalid server response");
    }
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "signUp()",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    throw error;
  }
}

/**
 * Method used to create a new credential for a user that is 1) already created 2) already authenticated
 * @param nickname userhandle for the user
 * @param isResidentKey boolean used to indicate if a resident key should be created: https://www.w3.org/TR/webauthn-2/#enum-residentKeyRequirement (true is required, false is discouraged)
 * @param authenticatorAttachment used to indicate whether the new credential should be resolved as a cross-platform or platform authenticator
 * @param requestUV callback used to trigger modal if UV is not present on the authenticator allowing the user to provide a U2F Password
 */
async function registerNewCredential(
  nickname,
  isResidentKey,
  authenticatorAttachment = "CROSS_PLATFORM",
  requestUV
) {
  try {
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "registerNewCredential()",
        LOG_REASON: t("console.reason.webauthnClient16"),
      }),
      {
        nickname,
        isResidentKey,
        authenticatorAttachment,
      }
    );
    const startRegistrationResponse = await axios.post(
      "/users/credentials/fido2/register",
      {
        nickname,
        requireResidentKey: isResidentKey,
        requireAuthenticatorAttachment: authenticatorAttachment,
      }
    );

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "registerNewCredential()",
        LOG_REASON: t("console.reason.webauthnClient17"),
      }),
      startRegistrationResponse
    );

    const { requestId } = startRegistrationResponse.data;

    const publicKey = {
      publicKey:
        startRegistrationResponse.data.publicKeyCredentialCreationOptions,
    };
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "registerNewCredential()",
        LOG_REASON: t("console.reason.webauthnClient3"),
      }),
      publicKey
    );

    const makeCredentialResponse = await create(publicKey);

    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "registerNewCredential()",
        LOG_REASON: t("console.reason.webauthnClient18"),
      }),
      makeCredentialResponse
    );

    const uv = getUVFromAttestation(
      makeCredentialResponse.response.attestationObject
    );

    const challengeResponse = {
      credential: makeCredentialResponse,
      requestId,
      pinSet: startRegistrationResponse.data.pinSet,
      pinCode: defaultInvalidPIN,
      nickname,
    };
    console.info(
      t("console.info", {
        COMPONENT: "WebAuthnClient",
        METHOD: "registerNewCredential()",
        LOG_REASON: t("console.reason.webauthnClient6"),
      }),
      challengeResponse
    );

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
      challengeResponse.pinCode = uvPin;
      await credentialService.registerFinish(challengeResponse);
    }
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "WebAuthnClient",
        METHOD: "registerNewCredential()",
        REASON: t("console.reason.webauthnClient0"),
      }),
      error
    );
    throw error;
  }
}

export { WebAuthnClient };
