import { Auth } from "aws-amplify";
import axios from "axios";
import { i18n } from "../i18n";
import aws_exports from "../aws-exports";

axios.defaults.baseURL = aws_exports.apiEndpoint;

const userService = {
  webAuthnStart,
  logout,
  exists,
  delete: _delete,
  getCurrentAuthenticatedUser,
};

const { t } = i18n;

async function webAuthnStart() {
  try {
    const response = await axios.get("/users/credentials/fido2/authenticate");
    console.info(
      t("console.info", {
        COMPONENT: "user.service",
        METHOD: "webAuthnStart()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "user.service",
        METHOD: "webAuthnStart()",
        REASON: "Authentication error",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function logout() {
  // remove user from local storage to log user out
  localStorage.removeItem("user");
  try {
    await Auth.signOut();
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "user.service",
        METHOD: "logout()",
        REASON: "Error signing out",
      }),
      error
    );
  }
}

async function exists(username) {
  const _username = username.toLowerCase();
  try {
    const cognitoUser = await Auth.signIn(_username);
    if (
      cognitoUser.challengeName === "CUSTOM_CHALLENGE" &&
      cognitoUser.challengeParam.type === "webauthn.get"
    ) {
      return cognitoUser;
    }
    // user exists but no credentials, registration may have been interrupted
    return _error(cognitoUser);
  } catch (error) {
    return _error(error);
  }
}

// prefixed function name with underscore because delete is a reserved word in javascript
async function _delete(jwt) {
  axios.defaults.headers.common["Authorization"] = jwt;
  try {
    const response = await axios.delete("/users");
    console.info(
      t("console.info", {
        COMPONENT: "user.service",
        METHOD: "_delete()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "user.service",
        METHOD: "logout()",
        REASON: "Error deleting user",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function getCurrentAuthenticatedUser() {
  try {
    const currentUser = await Auth.currentAuthenticatedUser({
      bypassCache: true, // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    });
    console.info(
      t("console.info", {
        COMPONENT: "user.service",
        METHOD: "getCurrentAuthenticatedUser()",
        LOG_REASON: "current user",
      }),
      currentUser
    );

    const data = await Auth.currentSession();
    console.info(
      t("console.info", {
        COMPONENT: "user.service",
        METHOD: "getCurrentAuthenticatedUser()",
        LOG_REASON: "current user data",
      }),
      data
    );
    const userData = {
      id: 1,
      username: currentUser.username,
      displayname: currentUser.attributes.name,
      credential: JSON.parse(localStorage.getItem("credential")),
      token: data.getIdToken().getJwtToken(),
    };
    localStorage.setItem("user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = userData.token;
    return userData;
  } catch (error) {
    Promise.reject(error);
  }
}

function _error(response) {
  return Promise.reject(JSON.stringify(response));
}

export default userService;
