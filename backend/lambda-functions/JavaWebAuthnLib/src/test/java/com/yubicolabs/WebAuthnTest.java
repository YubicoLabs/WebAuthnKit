package com.yubicolabs;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.data.AuthenticatorAttachment;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import com.yubicolabs.data.AssertionRequestWrapper;
import com.yubicolabs.data.CredentialRegistration;
import com.yubicolabs.data.RegistrationRequest;
import com.yubicolabs.samples.AssertionResponseSamples;
import com.yubicolabs.samples.RegistrationRequestSamples;
import com.yubicolabs.samples.RegistrationResultSamples;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class WebAuthnTest {
  Map<String, String> tempEnv;

  private App app = new App();
  private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
  RegistrationRequestSamples registrationRequestSamples = new RegistrationRequestSamples();
  RegistrationResultSamples registrationResultSamples = new RegistrationResultSamples();
  AssertionResponseSamples assertionResponseSamples = new AssertionResponseSamples();
  String challengeExample_1 = "bU41ssML2M0GA3D8t6JTVY5P_ZfeIsJVxY9FYepKOIo"; // "iQM8qEujwd98ia2Uccm4emouYFHMl2C0qJULinGI6y0";
  String challengeExample_2 = "_M37CUl4HasL1NrDOfrpxeQfXvwrhBdOrC-Oz-sGXfs";

  /**
   * ==================================================
   * Tests for startRegistrationRequest
   * ==================================================
   */

  /**
   * Test to ensure that startRegistration returns a valid RegistrationRequest
   * object
   * 
   * Test to ensure that the username sent is retained in the request
   * 
   * Test to ensure that the username sent is retained in the
   * PublicKeyCreateOptions
   */
  //// @Disabled
  @Test
  public void testStartRegistration_pass() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    assertEquals(RegistrationRequest.class, finalReq.getClass());
    assertEquals("unittest", finalReq.username);
    assertEquals("unittest", finalReq.publicKeyCredentialCreationOptions.getUser().getName());

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);

  }

  /**
   * Test to ensure that prompting the method for a cross-platform authenticator
   * attachment to will result in a Registration Request with
   * authenticatorAttachment as cross-platform
   */
  // @Disabled
  @Test
  public void testStartRegistration_PlatAuth_CP() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_PlatAuth_CP());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    assertEquals(AuthenticatorAttachment.CROSS_PLATFORM,
        finalReq.publicKeyCredentialCreationOptions.getAuthenticatorSelection().get()
            .getAuthenticatorAttachment().get());

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);
  }

  /**
   * Test to ensure that prompting the method for a platform authenticator
   * attachment to will result in a Registration Request with
   * authenticatorAttachment as platform
   */
  // @Disabled
  @Test
  public void testStartRegistration_PlatAuth_P() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_PlatAuth_P());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    assertEquals(AuthenticatorAttachment.PLATFORM,
        finalReq.publicKeyCredentialCreationOptions.getAuthenticatorSelection().get()
            .getAuthenticatorAttachment().get());

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);

  }

  /**
   * Test to ensure that prompting the method for a platform authenticator
   * attachment to will result in a Registration Request with
   * authenticatorAttachment as platform
   */
  // @Disabled
  @Test
  public void testStartRegistration_PlatAuth_Empty() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_PlatAuth_Empty());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    assertThrows(NoSuchElementException.class, () -> finalReq.publicKeyCredentialCreationOptions
        .getAuthenticatorSelection().get().getAuthenticatorAttachment().get());

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);

  }

  /**
   * Test to ensure that not sending a username will result in an error
   */
  // @Disabled
  @Test
  public void testStartRegistration_MissingUsername() {
    assertThrows(NullPointerException.class,
        () -> app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_MissingUsername()));
  }

  /**
   * ==================================================
   * Tests for finishRegistrationRequest
   * ==================================================
   */

  /**
   * Test to ensure that finishRegistration creates and stores a valid
   * registration object
   */
  @Test
  // @Disabled
  public void testFinishRegistration_pass() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_1), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    app.invalidateRegistrationRequest(finalReq.requestId);
    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    Object res = app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));

    CredentialRegistration finalRes = CredentialRegistration.class.cast(res);

    assertEquals(CredentialRegistration.class, finalRes.getClass());

    JsonObject deleteObj = new JsonObject();
    deleteObj.addProperty("username", finalRes.getUsername());
    app.removeAllRegistrations(deleteObj);

  }

  /**
   * Test to ensure that finishRegistration returns an error if an attempt to
   * duplicate credentialIDs for a user
   * The main use case for this test is to ensure that a registration request that
   * was not invalidated does not allow a repeat registration
   * Though it should be noted that your logic should remove the registration
   * request if a credential can be made
   */
  @Test
  // @Disabled
  public void testFinishRegistration_fail_duplicate() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_1), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    app.invalidateRegistrationRequest(finalReq.requestId);
    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    Object res = app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));
    CredentialRegistration finalRes = CredentialRegistration.class.cast(res);

    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    Object res2 = app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));
    RegistrationFailedException finalRes2 = RegistrationFailedException.class.cast(res2);

    assertEquals(finalRes2.getClass(), RegistrationFailedException.class);

    JsonObject deleteObj = new JsonObject();
    deleteObj.addProperty("username", finalRes.getUsername());
    app.removeAllRegistrations(deleteObj);

  }

  /**
   * Test to ensure that finishRegistration returns an error if an attempt is made
   * to create a new registration when no registration request was created
   * matching the PublicKey sent by the client
   */
  @Test
  // @Disabled
  public void testFinishRegistration_fail_noRegistrationRequest() {
    assertThrows(Exception.class,
        () -> app.finishRegistration(
            registrationResultSamples
                .create_sampleRegistrationResult_noAT_pass("iQM8qEujwd98ia2Uccm4emouYFHMl2C0qJULinGI6y0")));
  }

  /**
   * Test to ensure that finishRegistration is not created when the
   * registrationRequest challenge does not match what is sent by the client
   * application.
   * The registration result sample is taken from a static registration request,
   * so there should be an extremely low chance that the registration result
   * created for this test will match the static example
   */
  @Test
  // @Disabled
  public void testFinishRegistration_noMatchingRegistrationRequest() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    Object res = app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));
    Exception result = Exception.class.cast(res);

    assertEquals(RegistrationFailedException.class, result.getClass());

  }

  /**
   * ==================================================
   * Tests for startAuthentication
   * ==================================================
   */

  /**
   * Test to ensure that startAuthentication returns a valid
   * PublicKeyRequestOptions
   * With a valid list of allowed credentials for the user
   */
  @Test
  // @Disabled
  public void testStartAuthentication_pass_username() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_1), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    app.invalidateRegistrationRequest(finalReq.requestId);
    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));

    JsonObject authObj = new JsonObject();
    authObj.addProperty("username", "unittest");
    Object authResult = app.startAuthentication(authObj);
    String assertionReq = String.class.cast(authResult);
    JsonObject jsonAssertionReq = JsonParser.parseString(assertionReq).getAsJsonObject();
    AssertionRequestWrapper finalAssertionReq = gson.fromJson(jsonAssertionReq, AssertionRequestWrapper.class);

    assertEquals(AssertionRequestWrapper.class, finalAssertionReq.getClass());

    /**
     * Test to ensure the allow list only includes the one credential belonging to
     * the user
     */
    List<PublicKeyCredentialDescriptor> allowCredentials = finalAssertionReq.getPublicKeyCredentialRequestOptions()
        .getAllowCredentials().get();
    assertEquals(1, allowCredentials.size());

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);

    JsonObject deleteObj = new JsonObject();
    deleteObj.addProperty("username", finalReq.getUsername());
    app.removeAllRegistrations(deleteObj);

  }

  /**
   * Test to ensure that startAuthentication returns a valid
   * PublicKeyRequestOptions
   * Without a credential allow list for usernameless sign in
   */
  @Test
  // @Disabled
  public void testStartAuthentication_pass_usernameless() {
    /**
     * This should be empty to simulate a usernameless flow where a username field
     * is
     * NOT included
     * Sending an empty username will result in a "user does not exist" error
     */
    JsonObject authObj = new JsonObject();
    Object authResult = app.startAuthentication(authObj);
    String assertionReq = String.class.cast(authResult);
    JsonObject jsonAssertionReq = JsonParser.parseString(assertionReq).getAsJsonObject();
    AssertionRequestWrapper finalAssertionReq = gson.fromJson(jsonAssertionReq, AssertionRequestWrapper.class);

    assertEquals(AssertionRequestWrapper.class, finalAssertionReq.getClass());

    /**
     * Test to ensure the allow list is not present
     */
    boolean allowCredentials = finalAssertionReq.getPublicKeyCredentialRequestOptions()
        .getAllowCredentials().isPresent();
    assertEquals(false, allowCredentials);

  }

  /**
   * Test to ensure that startAuthentication method returns an error if there were
   * no credentials found for the user
   */
  @Test
  // @Disabled
  public void testStartAuthentication_fail_invalidUsername() {

    JsonObject authObj = new JsonObject();
    authObj.addProperty("username", "unittest");
    Object authResult = app.startAuthentication(authObj);

    assertEquals(Exception.class, authResult.getClass());
  }

  /**
   * ==================================================
   * Tests for finishAuthentication
   * ==================================================
   */
  /**
   * Test to ensure that finishAuthentication allows a user to authenticate
   * with a valid credential
   */
  @Test
  // @Disabled
  public void testFinishAuthentication_pass_username() {
    /**
     * Create the registration
     */
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_1), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    app.invalidateRegistrationRequest(finalReq.requestId);
    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));

    /*
     * Begin startAuthentication request
     */
    JsonObject authObj = new JsonObject();
    authObj.addProperty("username", "unittest");
    Object authResult = app.startAuthentication(authObj);
    String assertionReq = String.class.cast(authResult);
    JsonObject jsonAssertionReq = JsonParser.parseString(assertionReq).getAsJsonObject();

    /**
     * Edit the challenge to allow for a consistent signature with examples
     */
    try {
      jsonAssertionReq.get("publicKeyCredentialRequestOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_2), ByteArray.class))
              .getAsJsonObject());
      jsonAssertionReq.get("request").getAsJsonObject().get("publicKeyCredentialRequestOptions").getAsJsonObject().add(
          "challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_2), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    AssertionRequestWrapper assertReq = gson.fromJson(jsonAssertionReq, AssertionRequestWrapper.class);
    app.invalidateAssertionRequest(assertReq.getRequestId());
    app.addNewAssertionRequest(assertReq.getRequestId(), assertReq);

    Object res = app.finishAuthentication(
        assertionResponseSamples.create_sampleAssertionResponse_noAT_pass(assertReq.getRequestId().getBase64Url()));

    AssertionResult finalRes = AssertionResult.class.cast(res);
    assertEquals(true, finalRes.isSuccess());

    app.invalidateRegistrationRequest(finalReq.requestId);
    JsonObject deleteObj = new JsonObject();
    deleteObj.addProperty("username", finalReq.getUsername());
    app.removeAllRegistrations(deleteObj);

  }

  /**
   * Test to ensure that finishAuthentication allows a user to authenticate
   * with a valid credential with a startAuthentication usernameless request
   */
  @Test
  // @Disabled
  public void testFinishAuthentication_pass_usernameless() {
    /**
     * Create the registration
     */
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_1), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    app.invalidateRegistrationRequest(finalReq.requestId);
    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));

    /*
     * Begin startAuthentication request
     */
    JsonObject authObj = new JsonObject();
    Object authResult = app.startAuthentication(authObj);
    String assertionReq = String.class.cast(authResult);
    JsonObject jsonAssertionReq = JsonParser.parseString(assertionReq).getAsJsonObject();

    /**
     * Edit the challenge to allow for a consistent signature with examples
     */
    try {
      jsonAssertionReq.get("publicKeyCredentialRequestOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_2), ByteArray.class))
              .getAsJsonObject());
      jsonAssertionReq.get("request").getAsJsonObject().get("publicKeyCredentialRequestOptions").getAsJsonObject().add(
          "challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_2), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    AssertionRequestWrapper assertReq = gson.fromJson(jsonAssertionReq, AssertionRequestWrapper.class);
    app.invalidateAssertionRequest(assertReq.getRequestId());
    app.addNewAssertionRequest(assertReq.getRequestId(), assertReq);

    Object res = app.finishAuthentication(
        assertionResponseSamples.create_sampleAssertionResponse_noAT_pass(assertReq.getRequestId().getBase64Url()));

    AssertionResult finalRes = AssertionResult.class.cast(res);
    assertEquals(true, finalRes.isSuccess());

    app.invalidateRegistrationRequest(finalReq.requestId);
    JsonObject deleteObj = new JsonObject();
    deleteObj.addProperty("username", finalReq.getUsername());
    app.removeAllRegistrations(deleteObj);

  }

  /**
   * Test to ensure that finishAuthentication allows a user to authenticate
   * with a valid credential
   */
  @Test
  // //@Disabled
  public void testFinishAuthentication_fail_invalidAssertion() {
    /**
     * Create the registration
     */
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url(challengeExample_1), ByteArray.class))
              .getAsJsonObject());
    } catch (Base64UrlException e) {
      System.out.println(e);
    }

    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    app.invalidateRegistrationRequest(finalReq.requestId);
    app.addNewRegistrationRequest(finalReq.requestId, finalReq);

    app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));

    /*
     * Begin startAuthentication request
     */
    JsonObject authObj = new JsonObject();
    authObj.addProperty("username", "unittest");
    Object authResult = app.startAuthentication(authObj);
    String assertionReq = String.class.cast(authResult);
    JsonObject jsonAssertionReq = JsonParser.parseString(assertionReq).getAsJsonObject();

    AssertionRequestWrapper assertReq = gson.fromJson(jsonAssertionReq, AssertionRequestWrapper.class);

    Object res = app.finishAuthentication(
        assertionResponseSamples.create_sampleAssertionResponse_noAT_pass(assertReq.getRequestId().getBase64Url()));

    assertEquals(AssertionFailedException.class, res.getClass());

    app.invalidateRegistrationRequest(finalReq.requestId);
    JsonObject deleteObj = new JsonObject();
    deleteObj.addProperty("username", finalReq.getUsername());
    app.removeAllRegistrations(deleteObj);

  }

}
