# Changelog

## [3.0.0] - 2026-06-09

### Breaking Changes
- Java Lambda runtime upgraded from `java8.al2` to `java17`
- Node.js Lambda runtime upgraded from `nodejs16.x` to `nodejs20.x`
- AWS SDK upgraded from v2 to v3 across all Node.js Lambda functions
- Yubico `webauthn-server-core` upgraded from 2.0.0 to 2.9.0

### Added
- **Passkey autofill (conditional mediation)**: New `/passkey` route enables browser-native passkey autofill for returning users with discoverable credentials
- **`autoComplete="username webauthn"`** hint on the login page username field for passkey autofill integration
- **Custom Gson TypeAdapters** for Java 17 compatibility:
  - `ByteArrayTypeAdapter`: Serializes Yubico `ByteArray` as `{base64, base64url}` for frontend consumption
  - `InstantTypeAdapter`: Serializes `java.time.Instant` as `{seconds, nanos}` for JavaScript `Date` construction
  - `OptionalTypeAdapterFactory`: Handles `java.util.Optional` serialization blocked by Java 17 module system
- **`parseResidentKey()` method**: Supports both modern `residentKey` string values (`"discouraged"`, `"preferred"`, `"required"`) and legacy boolean `requireResidentKey` for backward compatibility
- **BDD test suite**: 24 Cucumber.js + Playwright end-to-end scenarios covering registration, authentication, credential management, recovery codes, usernameless login, passkey autofill, account deletion, server-verified PIN, and recovery code exhaustion

### Changed
- **AWS SDK v2 → v3**: Migrated `VerifyAuth`, `CreateAuth`, `FIDO2KitAPI`, and `DatabaseController` from `aws-sdk` monolith to `@aws-sdk/client-lambda` and `@aws-sdk/client-cognito-identity-provider`
- **Double-parse handling**: Node.js Lambda callers now handle Gson-serialized strings that get double-wrapped in quotes by the Lambda runtime
- **ByteArray unpacking**: `FIDO2KitAPI` extracts `.base64url` from Gson `ByteArray` objects for challenge IDs, request IDs, and credential IDs
- **`finishAuthentication()`** now returns `gson.toJson(result, AssertionResult.class)` for consistent serialization
- **Homepage**: Fixed `credentials === {}` object comparison bug (always returned `false`)

### Removed
- **FIDO Metadata Service (MDS)** integration: Removed `FidoMetadataService`, AAGUID lookup, and `AttestationRegistration` from the Java backend (simplifies deployment, removes external download dependency)
- **`JacksonCodecs.json()`** internal API usage: Replaced with standard `ObjectMapper` constructor
- **Unused dependencies**: Removed `yubico-util`, `guava`, `jackson-core/annotations/jdk8/jsr310/cbor`, `cbor`, `cose-java` from pom.xml

### Dependencies
- `webauthn-server-core`: 2.0.0 → 2.9.0
- `webauthn-server-attestation`: 2.0.0 → 2.9.0
- `aws-java-sdk-rdsdata`: 1.12.135 → 1.12.500
- `jackson-databind`: updated to 2.22.0
- `gson`: 2.8.9 → 2.10.1
- `lombok`: 1.18.22 → 1.18.38
- `maven-compiler-plugin`: updated to 3.11.0
- `log4j-slf4j18-impl` → `log4j-slf4j2-impl` 2.20.0
