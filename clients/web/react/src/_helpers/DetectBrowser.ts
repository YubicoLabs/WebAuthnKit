const platformEnums = {
  ANDROID_BIOMETRICS: {
    id: "ANDROID_BIOMETRICS",
    platName: "Andorid Biometrics",
  },
  WINDOWS_HELLO: {
    id: "WINDOWS_HELLO",
    platName: "Windows Hello",
  },
  TOUCH_ID: {
    id: "TOUCH_ID",
    platName: "Touch ID",
  },
  FACE_ID: {
    id: "FACE_ID",
    platName: "Face ID",
  },
  DEFAULT: {
    id: "DEFAULT",
    platName: "this device",
  },
};

const getPlatform = () => {
  const { userAgent } = navigator;
  if (userAgent.indexOf("Windows") !== -1) {
    return platformEnums.WINDOWS_HELLO;
  }
  if (userAgent.indexOf("Android") !== -1) {
    return platformEnums.ANDROID_BIOMETRICS;
  }
  if (
    userAgent.indexOf("Macintosh") !== -1 ||
    userAgent.indexOf("iPad") !== -1
  ) {
    return platformEnums.TOUCH_ID;
  }
  if (userAgent.indexOf("iPhone") !== -1) {
    return platformEnums.FACE_ID;
  }
  return platformEnums.DEFAULT;
};

const DetectBrowser = { getPlatform, platformEnums };

export default DetectBrowser;
