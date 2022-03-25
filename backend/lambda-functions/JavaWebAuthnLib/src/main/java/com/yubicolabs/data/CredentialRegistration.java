package com.yubicolabs.data;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.UserIdentity;
import java.time.Instant;
import java.util.Optional;
import lombok.Builder;
import lombok.Value;
import lombok.With;

@Value
@Builder
@With
public class CredentialRegistration {

    long signatureCount;

    UserIdentity userIdentity;

    Optional<String> credentialNickname;

    @JsonIgnore
    Instant registrationTime;

    @JsonIgnore
    Instant lastUsedTime;

    @JsonIgnore
    Instant lastUpdatedTime;

    RegisteredCredential credential;

    Optional<AttestationResult> attestationMetadata;

    RegistrationRequest registrationRequest;

    @JsonProperty("registrationTime")
    public String getRegistrationTimestamp() {
        return registrationTime.toString();
    }

    @JsonProperty("lastUsedTime")
    public String getLastUsedTimestamp() {
        return lastUsedTime.toString();
    }

    @JsonProperty("lastUpdatedTime")
    public String getLastUpdatedTimestamp() {
        return lastUpdatedTime.toString();
    }

    public String getUsername() {
        return userIdentity.getName();
    }

}
