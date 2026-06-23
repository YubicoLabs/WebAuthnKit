package com.yubicolabs;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.exception.Base64UrlException;
import java.io.IOException;

/**
 * Gson TypeAdapter for Yubico ByteArray.
 *
 * Serializes as {"base64":"...","base64url":"..."} so the React frontend
 * can access credential.credentialId.base64url for delete/update operations.
 */
public class ByteArrayTypeAdapter extends TypeAdapter<ByteArray> {

    public static final ByteArrayTypeAdapter INSTANCE = new ByteArrayTypeAdapter();

    private ByteArrayTypeAdapter() {}

    @Override
    public void write(JsonWriter out, ByteArray value) throws IOException {
        if (value == null) {
            out.nullValue();
        } else {
            out.beginObject();
            out.name("base64").value(value.getBase64());
            out.name("base64url").value(value.getBase64Url());
            out.endObject();
        }
    }

    @Override
    public ByteArray read(JsonReader in) throws IOException {
        if (in.peek() == JsonToken.NULL) {
            in.nextNull();
            return null;
        }
        try {
            if (in.peek() == JsonToken.STRING) {
                return ByteArray.fromBase64Url(in.nextString());
            }
            // Read from object format
            String base64url = null;
            String base64 = null;
            in.beginObject();
            while (in.hasNext()) {
                String name = in.nextName();
                switch (name) {
                    case "base64url":
                        base64url = in.nextString();
                        break;
                    case "base64":
                        base64 = in.nextString();
                        break;
                    default:
                        in.skipValue();
                        break;
                }
            }
            in.endObject();
            if (base64url != null) {
                return ByteArray.fromBase64Url(base64url);
            } else if (base64 != null) {
                return ByteArray.fromBase64(base64);
            }
            throw new IOException("ByteArray JSON object must contain 'base64url' or 'base64' field");
        } catch (Base64UrlException e) {
            throw new IOException("Invalid Base64Url in ByteArray", e);
        }
    }
}
