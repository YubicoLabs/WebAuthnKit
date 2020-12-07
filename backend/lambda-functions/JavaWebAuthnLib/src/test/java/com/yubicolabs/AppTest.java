package com.yubicolabs;

import com.yubico.webauthn.data.*;
import com.yubico.webauthn.*;
import com.yubicolabs.data.*;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

import com.google.gson.Gson;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.security.SecureRandom;


public class AppTest {
    private static final SecureRandom random = new SecureRandom();
    Gson gson = new Gson();
    private String username = "foo-user";
    private String displayName = "Foo User";
    private String credentialNickname = "My Lovely Credential";
    private boolean requireResidentKey = false;
    private ByteArray requestId = null;
    private RelyingPartyIdentity rpId = RelyingPartyIdentity.builder().id("localhost").name("Test party").build();
    private String origins = "localhost";
    //private val appId = Optional.empty[AppId]

    @BeforeEach
    void initAll() {
        try {
            requestId = ByteArray.fromBase64Url("request1");
        } catch (Exception e) {
            //System.out.println("error: ", e);
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
