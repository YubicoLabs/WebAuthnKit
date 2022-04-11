import axios from "axios";
import aws_exports from "../aws-exports";
import { i18n } from "../i18n";

axios.defaults.baseURL = aws_exports.apiEndpoint;

const credentialService = {
  generateRecoveryCodes,
  listRecoveryCodes,
  update,
  updatePin,
  registerStart,
  registerFinish,
  getAll,
  delete: _delete,
};

const { t } = i18n;

async function generateRecoveryCodes() {
  try {
    const response = await axios.delete("/users/credentials/codes");
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "generateRecoveryCodes()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "generateRecoveryCodes()",
        REASON: "Error generating recovery code",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function listRecoveryCodes() {
  try {
    if (axios.defaults.headers.common["Authorization"] === undefined) {
      return;
    }
    const response = await axios.get("/users/credentials/codes");
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "listRecoveryCodes()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "listRecoveryCodes()",
        REASON: "Error listing recovery code",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function update(credential) {
  try {
    const response = await axios.put("/users/credentials/fido2", credential);
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "update()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "update()",
        REASON: "Error updating credential",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function updatePin(fields) {
  try {
    const response = await axios.post("/users/credentials/pin", fields);
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "update()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "updatePin()",
        REASON: "Error updating PIN",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function getAll(jwt) {
  axios.defaults.headers.common["Authorization"] = jwt;
  try {
    const response = await axios.get("/users/credentials");
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "getAll()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "getAll()",
        REASON: "Error getting credentials",
      }),
      error
    );
    Promise.reject(error);
    throw Error(error);
  }
}

async function registerStart(registration) {
  console.log("registraiton: ", registration);
  try {
    const response = await axios.post(
      "/users/credentials/fido2/register",
      registration
    );
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "registerStart()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "registerStart()",
        REASON: "Error beginning registration",
      }),
      error
    );
    Promise.reject(error);
  }
}

async function registerFinish(registration) {
  try {
    const response = await axios.post(
      "/users/credentials/fido2/register/finish",
      registration
    );
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "registerFinish()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "registerFinish()",
        REASON: "Error registering credentials",
      }),
      error.response
    );
    Promise.reject(error.response.data);

    throw new Error(error.response.data);
  }
}

// prefixed function name with underscore because delete is a reserved word in javascript
async function _delete(id) {
  try {
    const response = await axios.delete(`/users/credentials/fido2?id=${id}`);
    console.info(
      t("console.info", {
        COMPONENT: "credential.service",
        METHOD: "_delete()",
        LOG_REASON: "Success",
      }),
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      t("console.error", {
        COMPONENT: "credential.service",
        METHOD: "_delete()",
        REASON: "Error deleting credentials",
      }),
      error
    );
    Promise.reject(error);
  }
}

export default credentialService;
