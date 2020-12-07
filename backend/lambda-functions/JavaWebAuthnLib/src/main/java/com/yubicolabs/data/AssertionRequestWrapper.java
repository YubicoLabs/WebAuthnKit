package com.yubicolabs.data;

import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialRequestOptions;
import java.util.Optional;
import lombok.NonNull;
import lombok.Value;

@Value
public class AssertionRequestWrapper {

    @NonNull
    private final ByteArray requestId;

    @NonNull
    private final PublicKeyCredentialRequestOptions publicKeyCredentialRequestOptions;

    @NonNull
    private final Optional<String> username;

    @NonNull
    private final com.yubico.webauthn.AssertionRequest request;

    public AssertionRequestWrapper(
        @NonNull
        ByteArray requestId,
        @NonNull
            com.yubico.webauthn.AssertionRequest request
    ) {
        this.requestId = requestId;
        this.publicKeyCredentialRequestOptions = request.getPublicKeyCredentialRequestOptions();
        this.username = request.getUsername();
        this.request = request;

    }
    
}