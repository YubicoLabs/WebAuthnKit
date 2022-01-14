const TrustedDeviceEnum = {
  NEVER: "never",
  CONFIRMED: "confirmed",
};

function setTrustedDevice(deviceEnum, deviceID) {
  localStorage.setItem("trustedDevice", deviceEnum);
  localStorage.setItem("trustedDeviceID", deviceID);
}

const TrustedDeviceHelper = {
  TrustedDeviceEnum,
  setTrustedDevice,
};

export { TrustedDeviceHelper };
