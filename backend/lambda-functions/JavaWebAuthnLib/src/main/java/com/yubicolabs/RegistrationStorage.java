package com.yubicolabs;

import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.data.ByteArray;
import com.yubicolabs.data.CredentialRegistration;
import java.util.Collection;
import java.util.Optional;

// RVW: This interface can probably be eliminated since there's only one implementation
public interface RegistrationStorage extends CredentialRepository {
    boolean addRegistrationByUsername(String username, CredentialRegistration reg);

    Collection<CredentialRegistration> getRegistrationsByUsername(String username);
    Optional<CredentialRegistration> getRegistrationByUsernameAndCredentialId(String username, ByteArray userHandle);
    Collection<CredentialRegistration> getRegistrationsByUserHandle(ByteArray userHandle);

    default boolean userExists(String username) {
        return !getRegistrationsByUsername(username).isEmpty();
    }

    boolean removeRegistrationByUsername(String username, CredentialRegistration credentialRegistration);
    boolean removeAllRegistrations(String username);

    void updateSignatureCount(AssertionResult result);
    
    void updateCredentialNickname(String username, ByteArray credentialId, String nickname);
}