package com.yubicolabs.samples;

import com.google.gson.JsonObject;

public class RegistrationRequestSamples {

  private String username = "unittest";
  private String displayName = "unittest";
  private String requireResidentKey = "false";
  private String authAttachment_Plat = "PLATFORM";
  private String authAttachment_CP = "CROSS_PLATFORM";
  private String uid = "ddd2-11ec-9d64-0242ac120002";

  public JsonObject create_sampleStartRegistration_pass() {
    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("username", username);
    sampleObject.addProperty("displayName", displayName);
    sampleObject.addProperty("requireResidentKey", requireResidentKey);
    sampleObject.addProperty("requireAuthenticatorAttachment", "");
    sampleObject.addProperty("uid", uid);

    return sampleObject;
  }

  public JsonObject create_sampleStartRegistration_PlatAuth_CP() {
    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("username", username);
    sampleObject.addProperty("displayName", displayName);
    sampleObject.addProperty("requireResidentKey", requireResidentKey);
    sampleObject.addProperty("requireAuthenticatorAttachment", authAttachment_CP);
    sampleObject.addProperty("uid", uid);

    return sampleObject;
  }

  public JsonObject create_sampleStartRegistration_PlatAuth_P() {
    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("username", username);
    sampleObject.addProperty("displayName", displayName);
    sampleObject.addProperty("requireResidentKey", requireResidentKey);
    sampleObject.addProperty("requireAuthenticatorAttachment", authAttachment_Plat);
    sampleObject.addProperty("uid", uid);

    return sampleObject;
  }

  public JsonObject create_sampleStartRegistration_PlatAuth_Empty() {
    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("username", username);
    sampleObject.addProperty("displayName", displayName);
    sampleObject.addProperty("requireResidentKey", requireResidentKey);
    sampleObject.addProperty("uid", uid);

    return sampleObject;
  }

  public JsonObject create_sampleStartRegistration_MissingUsername() {
    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("displayName", displayName);
    sampleObject.addProperty("requireResidentKey", requireResidentKey);
    sampleObject.addProperty("uid", uid);

    return sampleObject;
  }

}
