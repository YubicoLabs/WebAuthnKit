package com.yubicolabs;

import com.yubico.webauthn.data.*;
import com.yubico.internal.util.JacksonCodecs;
import com.yubico.webauthn.*;
import com.yubicolabs.data.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.security.SecureRandom;


public class AppTest {
    private static final SecureRandom random = new SecureRandom();
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private String username = "foo-user";
    private String displayName = "Foo User";
    private String credentialNickname = "My Lovely Credential";
    private boolean requireResidentKey = false;
    private ByteArray requestId = null;
    private RelyingPartyIdentity rpId = RelyingPartyIdentity.builder().id("localhost").name("Test party").build();
    private String origins = "localhost";
    //private val appId = Optional.empty[AppId]
    private final ObjectMapper jsonMapper = JacksonCodecs.json();
    

    @BeforeEach
    void initAll() {
        jsonMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        try {
            requestId = ByteArray.fromBase64Url("request1");
        } catch (Exception e) {
            //System.out.println("error: ", e);
        }
    }

    @Test
    public void handleRequest_decodejson() {
        String input = "{\"type\":\"finishRegistration\",\"requestId\":\"YqtrUqVuH6Xm4l3Rd-nBmUaWHWVJLAgwqrAfW3mCqwY\",\"credential\":{\"type\":\"public-key\",\"id\":\"5tMHGvNM13Y3xWo5I2v7erJp7G7pGebOe6ke0RYDkGhbBqX5o98YTDieTK4m3jEoFrY5pC6oFvHB2pBib4hqkA\",\"rawId\":\"5tMHGvNM13Y3xWo5I2v7erJp7G7pGebOe6ke0RYDkGhbBqX5o98YTDieTK4m3jEoFrY5pC6oFvHB2pBib4hqkA\",\"response\":{\"clientDataJSON\":\"eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoieFI0YWJLTkQ2Q19GVFpKVkdKU2dTRDhSa3hLcDR6SmZoMlRDSDdjRXktYyIsIm9yaWdpbiI6Imh0dHBzOi8vZGV2LmRqczMwcTd3Z3Y1MnUuYW1wbGlmeWFwcC5jb20iLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ\",\"attestationObject\":\"o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhAPyyIlZC5IYIYBEuq3ra94xQLOYgF1OCKZ-KCUa5TDDAAiAZYAlyYq0Lq4_wr6zXvpYtmfJhF_shnHs7qxIqTmXBP2N4NWOBWQLBMIICvTCCAaWgAwIBAgIEGKxGwDANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgNDEzOTQzNDg4MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEeeo7LHxJcBBiIwzSP-tg5SkxcdSD8QC-hZ1rD4OXAwG1Rs3Ubs_K4-PzD4Hp7WK9Jo1MHr03s7y-kqjCrutOOqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjcwEwYLKwYBBAGC5RwCAQEEBAMCBSAwIQYLKwYBBAGC5RwBAQQEEgQQy2lIHo_3QDmT7AonKaFUqDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQCXnQOX2GD4LuFdMRx5brr7Ivqn4ITZurTGG7tX8-a0wYpIN7hcPE7b5IND9Nal2bHO2orh_tSRKSFzBY5e4cvda9rAdVfGoOjTaCW6FZ5_ta2M2vgEhoz5Do8fiuoXwBa1XCp61JfIlPtx11PXm5pIS2w3bXI7mY0uHUMGvxAzta74zKXLslaLaSQibSKjWKt9h-SsXy4JGqcVefOlaQlJfXL1Tga6wcO0QTu6Xq-Uw7ZPNPnrpBrLauKDd202RlN4SP7ohL3d9bG6V5hUz_3OusNEBZUn5W3VmPj1ZnFavkMB3RkRMOa58MZAORJT4imAPzrvJ0vtv94_y71C6tZ5aGF1dGhEYXRhWMQbryQXR7muZf6kijMdZ-GXxefmsOE1XX21TXeqdTmuwkUAAAIWy2lIHo_3QDmT7AonKaFUqABA5tMHGvNM13Y3xWo5I2v7erJp7G7pGebOe6ke0RYDkGhbBqX5o98YTDieTK4m3jEoFrY5pC6oFvHB2pBib4hqkKUBAgMmIAEhWCCBQa7SRfFIddrvyg5SqD1SqEmXcS-Nn-Q5N7YTrgn1HCJYID-LFrGHw9zjjIssZUC4lUiF_DaHH3wcd4L3yjUl2Kee\"},\"clientExtensionResults\":{}}}";

        try {
            JsonObject responseJson = gson.fromJson(input.toString(), JsonObject.class);
            RegistrationResponse response = jsonMapper.readValue(responseJson.toString(), RegistrationResponse.class);
            assertNotNull(response);
        } catch(Exception e) {
           System.out.println("JSON error. Failed to decode response object.");
           System.out.println(e);
           fail();
        }
    }

    /*@Test
    public void handleRequest_shouldReturnConstantValue() {
        App function = new App();
        Object result = function.handleRequest("{echo: true}", null);
        assertEquals("{echo: true}", result);
    }*/

    /*@Test
    public void handleRequest_register() {
        //
        //startRegistration
        //

        App function = new App();

        PublicKeyCredentialCreationOptions publicKey = null;

        RegistrationRequest r = new RegistrationRequest("startRegistration", username, displayName, credentialNickname, requireResidentKey, requestId, publicKey);
        
        Object startRegistrationResult = function.handleRequest(gson.toJson(r), null);

        System.out.println(gson.toJson(startRegistrationResult));

        //assertEquals(gson.toJson(r), gson.toJson(result));

        //
        //finishRegistration
        //
        //RegistrationRequest registerationRequest = (RegistrationRequest)result;

        //UserIdentity userId = UserIdentity.builder().name(username).displayName(displayName).id(ByteArray.fromBase64Url("NiBJtVMh4AmSpZYuJ--jnEWgFzZHHVbS6zx7HFgAjAc")).build();
        //ByteArray challenge = ByteArray.fromBase64Url("AAEBAgMFCA0VIjdZEGl5Yls");

        String authenticationAttestationResponseJson = "{\"attestationObject\":\"v2hhdXRoRGF0YVikSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NBAAAFOQABAgMEBQYHCAkKCwwNDg8AIIjjhj6nH3qL2QF3tkUogilFykuaXjJTw35O4m-0NSX0pSJYIA5Nt8eYkLco-NQfKPXaA6dD9UfX_SHaYo-L-YQb78HsAyYBAiFYIOuzRl1o1Hem2jVRYhjkbSeIydhqLln9iltAgsDYjXRTIAFjZm10aGZpZG8tdTJmZ2F0dFN0bXS_Y3g1Y59ZAekwggHlMIIBjKADAgECAgIFOTAKBggqhkjOPQQDAjBqMSYwJAYDVQQDDB1ZdWJpY28gV2ViQXV0aG4gdW5pdCB0ZXN0cyBDQTEPMA0GA1UECgwGWXViaWNvMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMQswCQYDVQQGEwJTRTAeFw0xODA5MDYxNzQyMDBaFw0xODA5MDYxNzQyMDBaMGcxIzAhBgNVBAMMGll1YmljbyBXZWJBdXRobiB1bml0IHRlc3RzMQ8wDQYDVQQKDAZZdWJpY28xIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xCzAJBgNVBAYTAlNFMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEJ-8bFED9TnFhaArujgB0foNaV4gQIulP1mC5DO1wvSByw4eOyXujpPHkTw9y5e5J2J3N9coSReZJgBRpvFzYD6MlMCMwIQYLKwYBBAGC5RwBAQQEEgQQAAECAwQFBgcICQoLDA0ODzAKBggqhkjOPQQDAgNHADBEAiB4bL25EH06vPBOVnReObXrS910ARVOLJPPnKNoZbe64gIgX1Rg5oydH45zEMEVDjNPStwv6Z3nE_isMeY-szlQhv3_Y3NpZ1hHMEUCIQDBs1nbSuuKQ6yoHMQoRp8eCT_HZvR45F_aVP6qFX_wKgIgMCL58bv-crkLwTwiEL9ibCV4nDYM-DZuW5_BFCJbcxn__w\",\"clientDataJSON\":\"eyJjaGFsbGVuZ2UiOiJBQUVCQWdNRkNBMFZJamRaRUdsNVlscyIsIm9yaWdpbiI6ImxvY2FsaG9zdCIsInR5cGUiOiJ3ZWJhdXRobi5jcmVhdGUiLCJ0b2tlbkJpbmRpbmciOnsic3RhdHVzIjoic3VwcG9ydGVkIn19\"}";
        String publicKeyCredentialJson = "{\"id\":\"iOOGPqcfeovZAXe2RSiCKUXKS5peMlPDfk7ib7Q1JfQ\",\"response\":"+authenticationAttestationResponseJson+",\"clientExtensionResults\":{},\"type\":\"public-key\"}";
        String responseJson = "{\"type\":\"finishRegistration\",\"requestId\":\"request1\",\"credential\":"+publicKeyCredentialJson+"}";

        Object finishRegistrationResult = function.handleRequest(responseJson, null);

        System.out.println(gson.toJson(finishRegistrationResult));
        //assertEquals("{echo: true}", result);
    }

    @Test
    public void handleRequest_auth() {
        App function = new App();
        //
        // startAuthentication
        //
        
        Object startAuthenticationResult = function.handleRequest("{\"type\": \"startAuthentication\", \"username\": "+username+"}", null);

        System.out.println(gson.toJson(startAuthenticationResult));

        //
        // finishAuthentication
        //
        try {
        ByteArray authenticatorData = ByteArray.fromHex("49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630100000539");
        String clientDataJson = "{\"challenge\":\"AAEBAgMFCA0VIjdZEGl5Yls\",\"origin\":\"localhost\",\"hashAlgorithm\":\"SHA-256\",\"type\":\"webauthn.get\",\"tokenBinding\":{\"status\":\"supported\"}}";
        ByteArray credentialId = ByteArray.fromBase64Url("ibE9wQddsF806g8uL9hDzgwLJipKhS9esD07Jmj0N98");
        ByteArray signature = ByteArray.fromHex("30450221008d478e4c24894d261c7fd3790363ba9687facf4dd1d59610933a2c292cffc3d902205069264c167833d239d6af4c7bf7326c4883fb8c3517a2c86318aa3060d8b441");

        // These values are defined by the attestationObject and clientDataJson above
        ByteArray clientDataJsonBytes = new ByteArray(clientDataJson.getBytes("UTF-8"));

        String authenticatorAssertionResponseJson = "{\"authenticatorData\":\"${authenticatorData.getBase64Url}\",\"signature\":\"${signature.getBase64Url}\",\"clientDataJSON\":\"${clientDataJsonBytes.getBase64Url}\"}";
        String publicKeyCredentialJson = "{\"id\":\"${credentialId.getBase64Url}\",\"response\":${authenticatorAssertionResponseJson},\"clientExtensionResults\":{},\"type\":\"public-key\"}";
        String responseJson = "{\"requestId\":\"${requestId.getBase64Url}\",\"credential\":${publicKeyCredentialJson}}";

        Object finishAuthenticationResult = function.handleRequest(responseJson, null);

        System.out.println(gson.toJson(startAuthenticationResult));
        } catch (Exception e) {
            System.out.println("error: " + e.getMessage());
        }

        //assertEquals("{echo: true}", result);
    }

    private static ByteArray generateRandom(int length) {
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return new ByteArray(bytes);
    }*/

}
