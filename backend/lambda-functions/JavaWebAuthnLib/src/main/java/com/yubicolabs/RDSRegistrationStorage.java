package com.yubicolabs;

import com.amazon.rdsdata.client.RdsDataClient;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.services.rdsdata.AWSRDSData;
import com.amazonaws.services.rdsdata.AWSRDSDataClient;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.yubico.internal.util.CollectionUtil;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubicolabs.data.CredentialRegistration;
import com.yubicolabs.data.RegistrationDTO;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class RDSRegistrationStorage implements RegistrationStorage, CredentialRepository {

        private static final String RESOURCE_ARN = System.getenv("DBAuroraClusterArn");
        private static final String SECRET_ARN = System.getenv("DBSecretsStoreArn");
        private static final String DATABASE = System.getenv("DatabaseName");

        private final Clock clock = Clock.systemDefaultZone();
        private final Gson gson = new GsonBuilder().create();

        private final RdsDataClient client;

        public RDSRegistrationStorage() {
                AWSRDSData rdsData = AWSRDSDataClient.builder()
                                .withCredentials(new ProfileCredentialsProvider())
                                .build();
                client = RdsDataClient.builder()
                                .rdsDataService(rdsData)
                                .database(DATABASE)
                                .resourceArn(RESOURCE_ARN)
                                .secretArn(SECRET_ARN)
                                .build();
        }

        private Collection<CredentialRegistration> getByCredentialId(ByteArray credentialId) {

                String keyJsonOutput = gson.toJson(credentialId);

                final String SQL = "SELECT registration FROM credentialRegistrations WHERE credentialId = :keyJsonOutput";

                return client.forSql(SQL)
                                .withParamSets(new GetParams(keyJsonOutput))
                                .execute()
                                .mapToList(RegistrationDTO.class)
                                .stream()
                                .map(r -> gson.fromJson(r.registration, CredentialRegistration.class))
                                .collect(Collectors.toList());
        }

        private boolean updateRegistration(String username, ByteArray credentialId, CredentialRegistration reg) {
                String usernameJsonOutput = gson.toJson(username);
                String credentialIdJsonOutput = gson.toJson(credentialId);
                String registrationJsonOutput = gson.toJson(reg);

                String SQL = "UPDATE credentialRegistrations SET registration= :registrationJsonOutput WHERE username= :usernameJsonOutput AND credentialId= :credentialIdJsonOutput";

                client.forSql(SQL)
                                .withParamSets(new UpdateParams(registrationJsonOutput, usernameJsonOutput,
                                                credentialIdJsonOutput))
                                .execute();

                return true;
        }

        @Override
        public void updateCredentialNickname(String username, ByteArray credentialId, String nickname) {
                CredentialRegistration registration = getRegistrationByUsernameAndCredentialId(username, credentialId)
                                .orElseThrow(() -> new NoSuchElementException(String.format(
                                                "Credential \"%s\" is not registered to user \"%s\"",
                                                credentialId, username)));

                updateRegistration(
                                username,
                                credentialId,
                                registration
                                                .withCredentialNickname(Optional.of(nickname))
                                                .withLastUpdatedTime(clock.instant()));
        }

        @Override
        public boolean addRegistrationByUsername(String username, CredentialRegistration reg) {
                String usernameJsonOutput = gson.toJson(username);
                String userHandleJsonOutput = gson.toJson(reg.getUserIdentity().getId());
                String credentialIdJsonOutput = gson.toJson(reg.getCredential().getCredentialId());
                String registrationJsonOutput = gson.toJson(reg);

                final String SQL = "INSERT INTO credentialRegistrations (username, userHandle, credentialId, registration) VALUES(:usernameJsonOutput, :userHandleJsonOutput, :credentialIdJsonOutput, :registrationJsonOutput)";

                client.forSql(SQL)
                                .withParamSets(new AddParams(usernameJsonOutput, userHandleJsonOutput,
                                                credentialIdJsonOutput,
                                                registrationJsonOutput))
                                .execute();

                return true;
        }

        @Override
        public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
                return getRegistrationsByUsername(username).stream()
                                .map(registration -> PublicKeyCredentialDescriptor.builder()
                                                .id(registration.getCredential().getCredentialId())
                                                .build())
                                .collect(Collectors.toSet());
        }

        @Override
        public Collection<CredentialRegistration> getRegistrationsByUsername(String username) {
                String keyJsonOutput = gson.toJson(username);

                final String SQL = "SELECT registration FROM credentialRegistrations WHERE username = :keyJsonOutput";

                return client.forSql(SQL)
                                .withParamSets(new GetParams(keyJsonOutput))
                                .execute()
                                .mapToList(RegistrationDTO.class)
                                .stream()
                                .map(r -> gson.fromJson(r.registration, CredentialRegistration.class))
                                .collect(Collectors.toList());
        }

        @Override
        public Collection<CredentialRegistration> getRegistrationsByUserHandle(ByteArray userHandle) {
                String keyJsonOutput = gson.toJson(userHandle);

                final String SQL = "SELECT registration FROM credentialRegistrations WHERE userHandle = :keyJsonOutput";

                return client.forSql(SQL)
                                .withParamSets(new GetParams(keyJsonOutput))
                                .execute()
                                .mapToList(RegistrationDTO.class)
                                .stream()
                                .map(r -> gson.fromJson(r.registration, CredentialRegistration.class))
                                .collect(Collectors.toList());
        }

        @Override
        public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
                return getRegistrationsByUserHandle(userHandle).stream()
                                .findAny()
                                .map(CredentialRegistration::getUsername);
        }

        @Override
        public Optional<ByteArray> getUserHandleForUsername(String username) {
                return getRegistrationsByUsername(username).stream()
                                .findAny()
                                .map(reg -> reg.getUserIdentity().getId());
        }

        @Override
        public void updateSignatureCount(AssertionResult result) {
                CredentialRegistration registration = getRegistrationByUsernameAndCredentialId(result.getUsername(),
                                result.getCredentialId())
                                .orElseThrow(() -> new NoSuchElementException(String.format(
                                                "Credential \"%s\" is not registered to user \"%s\"",
                                                result.getCredentialId(), result.getUsername())));

                updateRegistration(
                                result.getUsername(),
                                result.getCredentialId(),
                                registration.withSignatureCount(result.getSignatureCount())
                                                .withLastUsedTime(clock.instant()));
        }

        @Override
        public Optional<CredentialRegistration> getRegistrationByUsernameAndCredentialId(String username,
                        ByteArray id) {
                return getRegistrationsByUsername(username).stream()
                                .filter(credReg -> id.equals(credReg.getCredential().getCredentialId()))
                                .findFirst();
        }

        @Override
        public boolean removeRegistrationByUsername(String username, CredentialRegistration credentialRegistration) {
                String usernameJsonOutput = gson.toJson(username);
                String credentialIdJsonOutput = gson.toJson(credentialRegistration.getCredential().getCredentialId());

                final String SQL = "DELETE FROM credentialRegistrations WHERE username= :usernameJsonOutput AND credentialId= :credentialIdJsonOutput";

                client.forSql(SQL)
                                .withParamSets(new DeleteRegistrationParams(usernameJsonOutput, credentialIdJsonOutput))
                                .execute();

                return true;
        }

        @Override
        public boolean removeAllRegistrations(String username) {
                String usernameJsonOutput = gson.toJson(username);

                final String SQL = "DELETE FROM credentialRegistrations WHERE username= :usernameJsonOutput";

                client.forSql(SQL)
                                .withParamSets(new DeleteAllParams(usernameJsonOutput))
                                .execute();

                return true;
        }

        @Override
        public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
                Optional<CredentialRegistration> registrationMaybe = getByCredentialId(credentialId).stream()
                                .findAny();

                log.debug("lookup credential ID: {}, user handle: {}; result: {}", credentialId, userHandle,
                                registrationMaybe);
                return registrationMaybe.flatMap(registration -> Optional.of(
                                RegisteredCredential.builder()
                                                .credentialId(registration.getCredential().getCredentialId())
                                                .userHandle(registration.getUserIdentity().getId())
                                                .publicKeyCose(registration.getCredential().getPublicKeyCose())
                                                .signatureCount(registration.getSignatureCount())
                                                .build()));
        }

        @Override
        public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
                return CollectionUtil.immutableSet(
                                getByCredentialId(credentialId).stream()
                                                .map(reg -> RegisteredCredential.builder()
                                                                .credentialId(reg.getCredential().getCredentialId())
                                                                .userHandle(reg.getUserIdentity().getId())
                                                                .publicKeyCose(reg.getCredential().getPublicKeyCose())
                                                                .signatureCount(reg.getSignatureCount())
                                                                .build())
                                                .collect(Collectors.toSet()));
        }

        @Data
        private static class GetParams {
                public final String keyJsonOutput;
        }

        @Data
        private static class AddParams {
                public final String usernameJsonOutput;
                public final String userHandleJsonOutput;
                public final String credentialIdJsonOutput;
                public final String registrationJsonOutput;
        }

        @Data
        private static class UpdateParams {
                public final String registrationJsonOutput;
                public final String usernameJsonOutput;
                public final String credentialIdJsonOutput;
        }

        @Data
        private static class DeleteRegistrationParams {
                public final String usernameJsonOutput;
                public final String credentialIdJsonOutput;
        }

        @Data
        private static class DeleteAllParams {
                public final String usernameJsonOutput;
        }

}
