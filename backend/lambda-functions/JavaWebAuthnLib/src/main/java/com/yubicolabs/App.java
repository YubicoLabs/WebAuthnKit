package com.yubicolabs;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.cbor.CBORFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AttestationConveyancePreference;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.AuthenticatorAttachment;
import com.yubico.webauthn.data.ResidentKeyRequirement;
import com.yubico.webauthn.data.UserVerificationRequirement;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import com.yubicolabs.data.AssertionRequestWrapper;
import com.yubicolabs.data.AssertionResponse;
import com.yubicolabs.data.CredentialRegistration;
import com.yubicolabs.data.RegistrationRequest;
import com.yubicolabs.data.RegistrationResponse;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Collection;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

/**
 * Lambda function entry point. You can change to use other pojo type or implement
 * a different RequestHandler.
 *
 * @see <a href=https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html>Lambda Java Handler</a> for more information
 */
@Slf4j
public class App implements RequestHandler<Object, Object> {

    private static final SecureRandom random = new SecureRandom();

    private final Clock clock = Clock.systemDefaultZone();

    private final ObjectMapper jsonMapper = new ObjectMapper();
    private final Gson gson = new GsonBuilder()
        .setPrettyPrinting()
        .registerTypeAdapter(java.time.Instant.class, InstantTypeAdapter.INSTANCE)
        .registerTypeAdapter(ByteArray.class, ByteArrayTypeAdapter.INSTANCE)
        .registerTypeAdapterFactory(OptionalTypeAdapterFactory.INSTANCE)
        .create();

    private final AssertionRequestStorage assertRequestStorage = new AssertionRequestStorage();
    private final RegistrationRequestStorage registerRequestStorage = new RegistrationRequestStorage();
    private final RegistrationStorage userStorage = new RDSRegistrationStorage();

    private final RelyingParty rp = RelyingParty.builder()
        .identity(Config.getRpIdentity())
        .credentialRepository(this.userStorage)
        .origins(Config.getOrigins())
        .attestationConveyancePreference(Optional.of(AttestationConveyancePreference.DIRECT))
        .allowUntrustedAttestation(true)
        .validateSignatureCounter(true)
        .build();

    public App() {
        jsonMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    }

    @Override
    public Object handleRequest(final Object input, final Context context) {

        // Note: This is likely to contain secrets (like database credentials) in downstream apps
        //log.info("ENVIRONMENT VARIABLES: {}", gson.toJson(System.getenv()));

        log.info("CONTEXT: {}", gson.toJson(context));
        log.info("EVENT: {}", gson.toJson(input));

        final String type;
        final JsonObject object;
        try {
            log.debug("handleRequest() input: {}", input.toString());

            object = gson.fromJson(input.toString(), JsonObject.class);
            type = object.get("type").getAsString();
        } catch (JsonSyntaxException e) {
            log.error("JSON error in finishRegistration; input: {}", input, e);
            return e;
        }
        log.debug("type: {}", type);

        switch(type) {
            case "startRegistration":
                return startRegistration(object);
            case "finishRegistration":
                return finishRegistration(object);
            case "startAuthentication":
                return startAuthentication(object);
            case "finishAuthentication":
                return finishAuthentication(object);
            case "getCredentialIdsForUsername":
                return getCredentialIdsForUsername(object);
            case "getRegistrationsByUsername":
                return getRegistrationsByUsername(object);
            case "updateCredentialNickname":
                return updateCredentialNickname(object);
            case "removeRegistrationByUsername":
                return removeRegistrationByUsername(object);
            case "removeAllRegistrations":
                return removeAllRegistrations(object);
            default:
                return input;
        }
    }

    Object startRegistration(JsonObject jsonRequest) {

        String username = jsonRequest.get("username").getAsString();
        String displayName = jsonRequest.get("displayName").getAsString();
        String credentialNickname = jsonRequest.get("credentialNickname").getAsString();
        ResidentKeyRequirement residentKey = parseResidentKey(jsonRequest);
        Optional<AuthenticatorAttachment> authenticatorAttachment = parseAuthenticatorAttachment(jsonRequest);
        String uid = jsonRequest.get("uid").getAsString();

        log.trace("startRegistration username: {}, displayName: {}, credentialNickname: {}, residentKey: {}, uid {}", username, displayName, credentialNickname, residentKey, uid);

        ByteArray id;
        try {
            id = ByteArray.fromBase64Url(uid);
        } catch(Base64UrlException e) {
            log.error("ByteArray.fromBase64Url exception", e);
            return e;
        }

        final Collection<CredentialRegistration> registrations = userStorage.getRegistrationsByUsername(username);
        final Optional<UserIdentity> existingUser =
            registrations.stream().findAny().map(CredentialRegistration::getUserIdentity);

        final UserIdentity registrationUserId = existingUser.orElseGet(() ->
            UserIdentity.builder()
                .name(username)
                .displayName(displayName)
                .id(id)
                .build()
        );

        RegistrationRequest request = new RegistrationRequest(
            "startRegistration",
            username,
            displayName,
            credentialNickname,
            residentKey.getValue(),
            generateRandom(32),
            rp.startRegistration(
                StartRegistrationOptions.builder()
                    .user(registrationUserId)
                    .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                        .residentKey(residentKey)
                        .userVerification(UserVerificationRequirement.PREFERRED)
                        .authenticatorAttachment(authenticatorAttachment.orElse(null))
                        .build()
                    )
                    .build()
            )
        );
        log.debug("request: {}", request);
        registerRequestStorage.put(request.getRequestId(), request);

        String registerRequestJson = gson.toJson(request, RegistrationRequest.class);
        log.debug("registerRequestJson: {}", registerRequestJson);

        return registerRequestJson;
    }

    Object finishRegistration(JsonObject responseJson) {
        log.debug("finishRegistration responseJson: {}", responseJson);

        RegistrationResponse response;

        try {
            response = jsonMapper.readValue(responseJson.toString(), RegistrationResponse.class);
        } catch(Exception e) {
            log.error("JSON error in finishRegistration. Failed to decode response object.", e);
            return e;
        }

        log.debug("response: {}", response);

        RegistrationRequest request = registerRequestStorage.getIfPresent(response.getRequestId());
        log.debug("request: {}", request);
        registerRequestStorage.invalidate(response.getRequestId());

        if (request == null) {
            String msg = "fail finishRegistration - no such registration in progress: {}" + response.getRequestId();
            log.error(msg);
            return new Exception(msg);
        } else {
            try {
                com.yubico.webauthn.RegistrationResult registration = rp.finishRegistration(
                    FinishRegistrationOptions.builder()
                        .request(request.getPublicKeyCredentialCreationOptions())
                        .response(response.getCredential())
                        .build()
                );
                log.debug("registration: {}", registration);

                return addRegistration(
                    request.getPublicKeyCredentialCreationOptions().getUser(),
                    Optional.of(request.getCredentialNickname()),
                    response,
                    registration,
                    request.getResidentKey(),
                    request
                );
            } catch (RegistrationFailedException e) {
                log.error("Registration failed!", e);
                return e;
            } catch (Exception e) {
                log.error("Registration failed unexpectedly; this is likely a bug.", e);
                return e;
            }
        }
    }

    Object startAuthentication(JsonObject jsonRequest) {
        JsonElement jsonElement = jsonRequest.get("username");
        Optional<String> username = Optional.ofNullable(jsonElement).map(JsonElement::getAsString);

        log.debug("startAuthentication username: {}", username);

        if (username.isPresent() && !userStorage.userExists(username.get())) {
            String msg = "The username \"" + username + "\" is not registered.";
            return new Exception(msg);
        } else {
            AssertionRequestWrapper request = new AssertionRequestWrapper(
                generateRandom(32),
                rp.startAssertion(
                    StartAssertionOptions.builder()
                        .username(username)
                        .build()
                )
            );

            log.debug("request: {}", request);
            assertRequestStorage.put(request.getRequestId(), request);

            String authRequestJson = gson.toJson(request, AssertionRequestWrapper.class);
            log.debug("authRequestJson: {}", authRequestJson);

            return authRequestJson;
        }
    }

    Object finishAuthentication(JsonObject responseJson) {
        log.debug("finishAuthentication responseJson: {}", responseJson);

        final AssertionResponse response;
        try {
            response = jsonMapper.readValue(responseJson.toString(), AssertionResponse.class);
        } catch (Exception e) {
            log.error("Assertion failed! Failed to decode response object", e);
            return e;
        }
        log.debug("finishAuthentication response: {}", response);

        AssertionRequestWrapper request = assertRequestStorage.getIfPresent(response.getRequestId());
        log.debug("finishAuthentication request: {}", request);
        assertRequestStorage.invalidate(response.getRequestId());

        if (request == null) {
            String msg = "Assertion failed!" + "No such assertion in progress: " + response.getRequestId();
            log.error(msg);
            return new Exception(msg);
        } else {
            try {
                FinishAssertionOptions finishAssertionOptions = FinishAssertionOptions.builder()
                    .request(request.getRequest())
                    .response(response.getCredential())
                    .build();
                log.debug("finishAuthentication finishAssertionOptions: {}", finishAssertionOptions);

                AssertionResult result = rp.finishAssertion(
                    FinishAssertionOptions.builder()
                        .request(request.getRequest())
                        .response(response.getCredential())
                        .build()
                );

                if (result.isSuccess()) {
                    try {
                        userStorage.updateSignatureCount(result);
                    } catch (Exception e) {
                        log.error(
                            "Failed to update signature count for user \"{}\", credential \"{}\"",
                            result.getUsername(),
                            response.getCredential().getId(),
                            e
                        );
                    }

                    log.debug("result: {}", result);
                    return gson.toJson(result, AssertionResult.class);
                } else {
                    String msg = "Assertion failed: Invalid assertion.";
                    log.error(msg);
                    return new Exception(msg);
                }
            } catch (AssertionFailedException e) {
                log.debug("Assertion failed", e);
                return e;
            } catch (Exception e) {
                log.error("Assertion failed unexpectedly; this is likely a bug.", e);
                return e;
            }
        }
    }

    Object getCredentialIdsForUsername(JsonObject jsonRequest) {
        String username = jsonRequest.get("username").getAsString();
        log.trace("getCredentialIdsForUsername username: {}", username);

        Collection<PublicKeyCredentialDescriptor> credentials = userStorage.getCredentialIdsForUsername(username);
        log.debug("credentials: {}", credentials);

        String credentialsRequestJson = gson.toJson(credentials, Collection.class);
        log.debug("credentialsRequestJson: {}", credentialsRequestJson);

        return credentialsRequestJson;
    }

    Object getRegistrationsByUsername(JsonObject jsonRequest) {
        String username = jsonRequest.get("username").getAsString();
        log.trace("getRegistrationsByUsername username: {}", username);

        Collection<CredentialRegistration> credentials = userStorage.getRegistrationsByUsername(username);
        log.debug("credentials: {}", credentials);

        String credentialsRequestJson = gson.toJson(credentials, Collection.class);
        log.debug("credentialsRequestJson: {}", credentialsRequestJson);

        return credentialsRequestJson;

    }

    Object updateCredentialNickname(JsonObject jsonRequest) {
        String username = jsonRequest.get("username").getAsString();
        String credentialId = jsonRequest.get("credentialId").getAsString();
        String nickname = jsonRequest.get("nickname").getAsString();
        log.debug("updateCredentialNickname username: {}, credentialId: {} nickname: {}", username, credentialId, nickname);

        try {
            ByteArray id = ByteArray.fromBase64Url(credentialId);
            userStorage.updateCredentialNickname(username, id, nickname);
            return true;
        } catch (Exception e) {
            log.error("updateCredentialNickname error", e);
            return e;
        }
    }

    Object removeRegistrationByUsername(JsonObject jsonRequest) {
        String username = jsonRequest.get("username").getAsString();
        String credentialId = jsonRequest.get("credentialId").getAsString();
        log.trace("removeRegistrationByUsername username: {}", username);

        try {
            ByteArray id = ByteArray.fromBase64Url(credentialId);

            return userStorage.getRegistrationByUsernameAndCredentialId(username, id)
                .map(registration -> userStorage.removeRegistrationByUsername(username, registration))
                .orElse(false);
        } catch (Exception e) {
            log.error("removeRegistrationByUsername error", e);
            return e;
        }
    }

    Object removeAllRegistrations(JsonObject jsonRequest) {
        String username = jsonRequest.get("username").getAsString();
        log.trace("removeAllRegistrations username: {}", username);

        return userStorage.removeAllRegistrations(username);
    }

    /**
     * Parses the residentKey parameter from the request. Supports both the modern
     * string-valued "residentKey" field ("discouraged", "preferred", "required") and
     * the legacy boolean "requireResidentKey" for backward compatibility.
     */
    private static ResidentKeyRequirement parseResidentKey(JsonObject jsonRequest) {
        JsonElement residentKeyElem = jsonRequest.get("residentKey");
        if (residentKeyElem != null && !residentKeyElem.isJsonNull()) {
            String val = residentKeyElem.getAsString().toLowerCase();
            switch (val) {
                case "required": return ResidentKeyRequirement.REQUIRED;
                case "preferred": return ResidentKeyRequirement.PREFERRED;
                case "discouraged": return ResidentKeyRequirement.DISCOURAGED;
                default: return ResidentKeyRequirement.PREFERRED;
            }
        }
        // Legacy fallback: boolean requireResidentKey
        JsonElement legacyElem = jsonRequest.get("requireResidentKey");
        if (legacyElem != null && !legacyElem.isJsonNull()) {
            return legacyElem.getAsBoolean()
                ? ResidentKeyRequirement.REQUIRED
                : ResidentKeyRequirement.DISCOURAGED;
        }
        return ResidentKeyRequirement.PREFERRED;
    }

    /**
     * Parses the requireAuthenticatorAttachment parameter from the request.
     * Accepts "PLATFORM" or "platform" → AuthenticatorAttachment.PLATFORM.
     * Accepts "CROSS_PLATFORM" or "cross-platform" → AuthenticatorAttachment.CROSS_PLATFORM.
     * Returns Optional.empty() if absent or null (no attachment constraint).
     */
    private static Optional<AuthenticatorAttachment> parseAuthenticatorAttachment(JsonObject jsonRequest) {
        JsonElement elem = jsonRequest.get("requireAuthenticatorAttachment");
        if (elem == null || elem.isJsonNull()) {
            return Optional.empty();
        }
        String val = elem.getAsString().toUpperCase().replace("-", "_");
        switch (val) {
            case "PLATFORM": return Optional.of(AuthenticatorAttachment.PLATFORM);
            case "CROSS_PLATFORM": return Optional.of(AuthenticatorAttachment.CROSS_PLATFORM);
            default: return Optional.empty();
        }
    }

    private static ByteArray generateRandom(int length) {
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return new ByteArray(bytes);
    }

    private Object addRegistration(
        UserIdentity userIdentity,
        Optional<String> nickname,
        RegistrationResponse response,
        RegistrationResult result,
        String residentKey,
        RegistrationRequest request
    ) {
        long signatureCount = response.getCredential().getResponse().getParsedAuthenticatorData().getSignatureCounter();
        RegisteredCredential credential = RegisteredCredential.builder()
            .credentialId(result.getKeyId().getId())
            .userHandle(userIdentity.getId())
            .publicKeyCose(result.getPublicKeyCose())
            .signatureCount(signatureCount)
            .build();

        CredentialRegistration reg = CredentialRegistration.builder()
            .userIdentity(userIdentity)
            .credentialNickname(nickname)
            .registrationTime(clock.instant())
            .lastUsedTime(clock.instant())
            .lastUpdatedTime(clock.instant())
            .credential(credential)
            .signatureCount(signatureCount)
            .registrationRequest(request)
            .build();

        log.debug(
            "Adding registration: user: {}, nickname: {}, credential: {}",
            userIdentity,
            nickname,
            credential
        );
        userStorage.addRegistrationByUsername(userIdentity.getName(), reg);
        return gson.toJson(reg, CredentialRegistration.class);
    }
}
