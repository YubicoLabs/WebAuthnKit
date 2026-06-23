package com.yubicolabs;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import java.io.IOException;
import java.time.Instant;

public class InstantTypeAdapter extends TypeAdapter<Instant> {

    public static final InstantTypeAdapter INSTANCE = new InstantTypeAdapter();

    private InstantTypeAdapter() {}

    @Override
    public void write(JsonWriter out, Instant value) throws IOException {
        if (value == null) {
            out.nullValue();
        } else {
            // Produce {seconds: N, nanos: N} — the format the React frontend expects
            // (matches Gson's default reflection-based serialization of Instant)
            out.beginObject();
            out.name("seconds").value(value.getEpochSecond());
            out.name("nanos").value(value.getNano());
            out.endObject();
        }
    }

    @Override
    public Instant read(JsonReader in) throws IOException {
        if (in.peek() == JsonToken.NULL) {
            in.nextNull();
            return null;
        }
        if (in.peek() == JsonToken.STRING) {
            return Instant.parse(in.nextString());
        }
        // Read from {seconds, nanos} object format
        long seconds = 0;
        int nanos = 0;
        in.beginObject();
        while (in.hasNext()) {
            String name = in.nextName();
            switch (name) {
                case "seconds": seconds = in.nextLong(); break;
                case "nanos": nanos = in.nextInt(); break;
                default: in.skipValue(); break;
            }
        }
        in.endObject();
        return Instant.ofEpochSecond(seconds, nanos);
    }
}
