package com.yubicolabs.data;

import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Value;

@Value
@EqualsAndHashCode(callSuper = false) // I suspect the callSuper argument is unnecessary here, in which case @EqualsAndHashCode is implied by @Value
@AllArgsConstructor // This is implied by @Value
public class RegistrationRequest {
    public String type;
    public String username;
    public String displayName;
    public String credentialNickname;
    public boolean requireResidentKey;
    public ByteArray requestId;
    public PublicKeyCredentialCreationOptions publicKeyCredentialCreationOptions;
}