package com.yubicolabs;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.yubico.webauthn.data.AuthenticatorAttachment;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import com.yubicolabs.data.AssertionRequestWrapper;
import com.yubicolabs.data.CredentialRegistration;
import com.yubicolabs.data.RegistrationRequest;
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
  @Disabled
  @Test
  public void testStartRegistration_pass() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);
    assertEquals(finalReq.getClass(), RegistrationRequest.class);
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
  @Disabled
  @Test
  public void testStartRegistration_PlatAuth_CP() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_PlatAuth_CP());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    assertEquals(finalReq.publicKeyCredentialCreationOptions.getAuthenticatorSelection().get()
        .getAuthenticatorAttachment().get(), AuthenticatorAttachment.CROSS_PLATFORM);

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);
  }

  /**
   * Test to ensure that prompting the method for a platform authenticator
   * attachment to will result in a Registration Request with
   * authenticatorAttachment as platform
   */
  @Disabled
  @Test
  public void testStartRegistration_PlatAuth_P() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_PlatAuth_P());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    assertEquals(finalReq.publicKeyCredentialCreationOptions.getAuthenticatorSelection().get()
        .getAuthenticatorAttachment().get(), AuthenticatorAttachment.PLATFORM);

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);

  }

  /**
   * Test to ensure that prompting the method for a platform authenticator
   * attachment to will result in a Registration Request with
   * authenticatorAttachment as platform
   */
  @Disabled
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
  @Disabled
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
  @Disabled
  public void testFinishRegistration_pass() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url("iQM8qEujwd98ia2Uccm4emouYFHMl2C0qJULinGI6y0"), ByteArray.class))
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

    assertEquals(finalRes.getClass(), CredentialRegistration.class);

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
  @Disabled
  public void testFinishRegistration_fail_duplicate() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url("iQM8qEujwd98ia2Uccm4emouYFHMl2C0qJULinGI6y0"), ByteArray.class))
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
  @Disabled
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
  @Disabled
  public void testFinishRegistration_noMatchingRegistrationRequest() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();
    RegistrationRequest finalReq = gson.fromJson(jsonRegReq, RegistrationRequest.class);

    Object res = app.finishRegistration(
        registrationResultSamples.create_sampleRegistrationResult_noAT_pass(finalReq.requestId.getBase64Url()));
    Exception result = Exception.class.cast(res);

    assertEquals(result.getClass(), RegistrationFailedException.class);

  }

  /**
   * ==================================================
   * Tests for startAuthentication
   * ==================================================
   */

  /**
   * Test to ensure that finishRegistration creates and stores a valid
   * registration object
   */
  @Test
  @Disabled
  public void testStartAuthentication_pass_username() {
    Object reg = app.startRegistration(registrationRequestSamples.create_sampleStartRegistration_pass());
    String regReq = String.class.cast(reg);
    JsonObject jsonRegReq = JsonParser.parseString(regReq).getAsJsonObject();

    try {
      jsonRegReq.get("publicKeyCredentialCreationOptions").getAsJsonObject().add("challenge",
          JsonParser
              .parseString(
                  gson.toJson(ByteArray.fromBase64Url("iQM8qEujwd98ia2Uccm4emouYFHMl2C0qJULinGI6y0"), ByteArray.class))
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

    assertEquals(finalAssertionReq.getClass(), AssertionRequestWrapper.class);

    /**
     * Test to ensure the allow list only includes the one credential belonging to
     * the user
     */
    List<PublicKeyCredentialDescriptor> allowCredentials = finalAssertionReq.getPublicKeyCredentialRequestOptions()
        .getAllowCredentials().get();
    assertEquals(1, allowCredentials.size());

    // Clear registration request from the registration request storage
    app.invalidateRegistrationRequest(finalReq.requestId);
  }

  /**
   * Test to ensure that finishRegistration creates and stores a valid
   * registration object
   */
  @Test
  // @Disabled
  public void testStartAuthentication_pass_usernameless() {
    /**
     * This should be empty to simulate a usernaless flow where a username field is
     * NOT included
     * Sending an empty username will result in a "user does not exist" error
     */
    JsonObject authObj = new JsonObject();
    Object authResult = app.startAuthentication(authObj);
    String assertionReq = String.class.cast(authResult);
    JsonObject jsonAssertionReq = JsonParser.parseString(assertionReq).getAsJsonObject();
    AssertionRequestWrapper finalAssertionReq = gson.fromJson(jsonAssertionReq, AssertionRequestWrapper.class);

    assertEquals(finalAssertionReq.getClass(), AssertionRequestWrapper.class);

    /**
     * Test to ensure the allow list only includes the one credential belonging to
     * the user
     */
    List<PublicKeyCredentialDescriptor> allowCredentials = finalAssertionReq.getPublicKeyCredentialRequestOptions()
        .getAllowCredentials().get();
    System.out.println(allowCredentials);
  }

}
