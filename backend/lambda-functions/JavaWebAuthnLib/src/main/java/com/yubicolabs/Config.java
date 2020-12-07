package com.yubicolabs;

import com.yubico.webauthn.data.RelyingPartyIdentity;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;


@Slf4j
public class Config {

    private static final int DEFAULT_PORT = 8080;

    private final Set<String> origins;
    private final int port;
    private final RelyingPartyIdentity rpIdentity;

    private Config(Set<String> origins, int port, RelyingPartyIdentity rpIdentity) {
        this.origins = origins;
        this.port = port;
        this.rpIdentity = rpIdentity;
    }

    private static Config instance;
    private static synchronized Config getInstance() {
        if (instance == null) {
            instance = new Config(computeOrigins(), computePort(), computeRpIdentity());
        }
        return instance;
    }

    public static Set<String> getOrigins() {
        return getInstance().origins;
    }

    public static int getPort() {
        return getInstance().port;
    }

    public static RelyingPartyIdentity getRpIdentity() {
        return getInstance().rpIdentity;
    }

    private static Set<String> computeOrigins() {
        // RVW: Remove the YUBICO_ prefix from env vars? Maybe even YUBICO_WEBAUTHN_ ?
        final Set<String> result = Stream.of(getEnv("YUBICO_WEBAUTHN_ALLOWED_ORIGINS").split(","))
            .collect(Collectors.toSet());

        log.info("Origins: {}", result);

        return result;
    }

    private static int computePort() {
        return getOptionalEnv("YUBICO_WEBAUTHN_PORT")
            .map(Integer::parseInt)
            .orElse(DEFAULT_PORT);
    }

    private static RelyingPartyIdentity computeRpIdentity() {
        final RelyingPartyIdentity result = RelyingPartyIdentity.builder()
            .id(getEnv("YUBICO_WEBAUTHN_RP_ID"))
            .name(getEnv("YUBICO_WEBAUTHN_RP_NAME"))
            .build();
        log.info("RP identity: {}", result);
        return result;
    }

    private static String getEnv(final String name) {
        final String result = System.getenv(name);
        log.debug("{}: {}", name, result);
        if (result == null || "".equals(result)) {
            final String msg = "Missing required environment variable: " + name;
            log.error(msg);
            throw new RuntimeException(msg);
        }
        return result;
    }

    private static Optional<String> getOptionalEnv(final String name) {
        final String result = System.getenv(name);
        log.debug("{}: {}", name, result);
        return Optional.ofNullable(result);
    }

}
