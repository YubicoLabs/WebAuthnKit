package com.yubicolabs.samples;

import com.google.gson.JsonObject;

public class RegistrationResultSamples {

  private String type = "finishRegistration";

  /**
   * Create a sample registrationResult object that will successfully register
   * This item will not contain an attestation response - this should be verified
   * in the unit test
   * 
   * @param requestId identifier for the challenge request to be signed
   * @return mock registration result that mimics the result of a create() request
   */
  public JsonObject create_sampleRegistrationResult_noAT_pass(String requestId) {
    /**
     * Create response portion of the create() method result
     */
    JsonObject response = new JsonObject();
    response.addProperty("clientDataJSON",
        "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYlU0MXNzTUwyTTBHQTNEOHQ2SlRWWTVQX1pmZUlzSlZ4WTlGWWVwS09JbyIsIm9yaWdpbiI6Imh0dHBzOi8vZGV2LmQyYTR6YTRnMzF4eWF3LmFtcGxpZnlhcHAuY29tIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ");
    response.addProperty("attestationObject",
        "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YVikT3EXqK_t1dr3_5sU8VWBpqC_7_J_0qDH-hXkmXxws4dFAAAAAQAAAAAAAAAAAAAAAAAAAAAAIAN-d55f__TjF-LFE-EM570gELm6wsouvsmUUZ0OvPo9pQECAyYgASFYILrDg6mp1kqCtvL01huCzO6-MswRVB-8MN-HstboOC_6Ilgg-413uferr-ZHKnq_Cf10rJx6wo10qrUUVmiyfj8-iEw");

    /**
     * Create the credential portion of the create() method result
     */
    JsonObject credential = new JsonObject();
    credential.addProperty("type", "public-key");
    credential.addProperty("id", "A353nl__9OMX4sUT4QznvSAQubrCyi6-yZRRnQ68-j0");
    credential.addProperty("rawId", "A353nl__9OMX4sUT4QznvSAQubrCyi6-yZRRnQ68-j0");
    /**
     * These invoke add rather than addProperty as the value is structured as an
     * object, and not a direct value
     */
    credential.add("response", response);
    credential.add("clientExtensionResults", new JsonObject());

    /**
     * Create the top layer o the create() method result
     */
    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("type", type);
    sampleObject.addProperty("requestId", requestId);
    sampleObject.add("credential", credential);

    return sampleObject;
  }
}
