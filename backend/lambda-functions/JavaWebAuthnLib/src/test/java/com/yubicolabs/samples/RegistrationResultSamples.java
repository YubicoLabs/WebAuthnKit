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
        "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiaVFNOHFFdWp3ZDk4aWEyVWNjbTRlbW91WUZITWwyQzBxSlVMaW5HSTZ5MCIsIm9yaWdpbiI6Imh0dHBzOi8vbG9jYWxob3N0OjgwODAiLCJjcm9zc09yaWdpbiI6ZmFsc2V9");
    response.addProperty("attestationObject",
        "o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhALwsTwuwir5Wm5qw3Y2PAA_VXM_PQJ75y0Oml4wZSaQgAiBBImkJK2AwmFRYl6kWZpnebP3fCRYZgIdM0re3Xe60WGN4NWOBWQHeMIIB2jCCAX2gAwIBAgIBATANBgkqhkiG9w0BAQsFADBgMQswCQYDVQQGEwJVUzERMA8GA1UECgwIQ2hyb21pdW0xIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xGjAYBgNVBAMMEUJhdGNoIENlcnRpZmljYXRlMB4XDTE3MDcxNDAyNDAwMFoXDTQyMDUyOTE1NTExN1owYDELMAkGA1UEBhMCVVMxETAPBgNVBAoMCENocm9taXVtMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMRowGAYDVQQDDBFCYXRjaCBDZXJ0aWZpY2F0ZTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABI1hfmXJUI5kvMVnOsgqZ5naPBRGaCwljEY__99Y39L6Pmw3i1PXlcSk3_tBme3Xhi8jq68CA7S4kRugVpmU4QGjJTAjMBMGCysGAQQBguUcAgEBBAQDAgUgMAwGA1UdEwEB_wQCMAAwDQYJKoZIhvcNAQELBQADSAAwRQIhANTqmBPmcVI6sVyomAZn-AN5dD_lQ91EAfaNOHtaedQtAiAaS9jxAumTGlPz2CtU_ybRNgYRzf8PrE4-Wi11zMJLJ2hhdXRoRGF0YVikSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAQECAwQFBgcIAQIDBAUGBwgAIG1KQLMln8Aw7Rxcq9Lri3ootB8c3E0yrlYQ2sen9iKkpQECAyYgASFYIDvcd8MvlOTgj6DHs8crO4pOykhEOLwt4ocmo8Br-Yr9IlggwKAO4MHzjTZW7yEl4lVhL7UWHYyDODP-lX5TctGSVm4");

    /**
     * Create the credential portion of the create() method result
     */
    JsonObject credential = new JsonObject();
    credential.addProperty("type", "public-key");
    credential.addProperty("id", "qKzHUw5fbkXQL3hP0eSA0HZYcp3WafKz8nQninDfqP8");
    credential.addProperty("rawId", "qKzHUw5fbkXQL3hP0eSA0HZYcp3WafKz8nQninDfqP8");
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
