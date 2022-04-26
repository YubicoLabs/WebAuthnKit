package com.yubicolabs.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Set;

import com.yubico.fido.metadata.AttachmentHint;
import com.yubico.webauthn.data.AuthenticatorTransport;

import lombok.Builder;
import lombok.Value;
import lombok.With;

@Value
@Builder
@With
public class AttestationRegistration {
  @JsonInclude(JsonInclude.Include.NON_NULL)
  String aaguid;
  @JsonInclude(JsonInclude.Include.NON_NULL)
  String aaid;
  @JsonInclude(JsonInclude.Include.NON_NULL)
  Set<AttachmentHint> attachmentHint;
  @JsonInclude(JsonInclude.Include.NON_NULL)
  String icon;
  @JsonInclude(JsonInclude.Include.NON_NULL)
  String description;
  @JsonInclude(JsonInclude.Include.NON_NULL)
  Set<AuthenticatorTransport> authenticatorTransport;
}
