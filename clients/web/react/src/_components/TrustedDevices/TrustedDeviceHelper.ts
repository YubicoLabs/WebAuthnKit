/**
 * This class is used to set common methods to be used across the different trusted device
 * operations through the application
 */

// Enums to consistently check the status of Trusted Device State
// Never indicates to never ask the user to register a trusted device on signin
// Confirmed indicates that the user has registered or confirmed a trusted device on this browser
const TrustedDeviceEnum = {
  NEVER: "never",
  CONFIRMED: "confirmed",
};

/**
 * Sets the trusted device in the local storage of the browser
 * @param deviceEnum The Enum (see above) that should be set in storage
 * @param deviceID If a confirmed trusted device, pass the ID to hide the add device button
 */
function setTrustedDevice(deviceEnum, deviceID) {
  localStorage.setItem("trustedDevice", deviceEnum);
  localStorage.setItem("trustedDeviceID", deviceID);
}

const TrustedDeviceHelper = {
  TrustedDeviceEnum,
  setTrustedDevice,
};

export { TrustedDeviceHelper };
