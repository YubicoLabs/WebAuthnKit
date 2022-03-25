package com.yubicolabs.data;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.yubico.fido.metadata.AAGUID;
import com.yubico.fido.metadata.AttachmentHint;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.UserIdentity;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import lombok.Builder;
import lombok.Value;
import lombok.With;

@Value
@Builder
@With
public class AttestationResult {
  Optional<AAGUID> aaguid;
  Optional<Set<AttachmentHint>> attachmentHint;
  Optional<String> icon;
}
