package com.yubicolabs;

import com.google.gson.Gson;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import java.io.IOException;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.Optional;

/**
 * Gson TypeAdapterFactory for java.util.Optional.
 *
 * Required because Java 17's module system blocks Gson's default reflection
 * approach from accessing java.util.Optional#value. This factory serializes
 * Optional.empty() as JSON null and Optional.of(x) as the serialized x,
 * and reverses the mapping on deserialization.
 */
public class OptionalTypeAdapterFactory implements TypeAdapterFactory {

    public static final OptionalTypeAdapterFactory INSTANCE = new OptionalTypeAdapterFactory();

    private OptionalTypeAdapterFactory() {}

    @Override
    @SuppressWarnings("unchecked")
    public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> type) {
        if (type.getRawType() != Optional.class) {
            return null;
        }
        Type innerType = (type.getType() instanceof ParameterizedType)
            ? ((ParameterizedType) type.getType()).getActualTypeArguments()[0]
            : Object.class;
        TypeAdapter<?> innerAdapter = gson.getAdapter(TypeToken.get(innerType));
        return (TypeAdapter<T>) new OptionalTypeAdapter<>(innerAdapter);
    }

    private static class OptionalTypeAdapter<E> extends TypeAdapter<Optional<E>> {
        private final TypeAdapter<E> innerAdapter;

        OptionalTypeAdapter(TypeAdapter<E> innerAdapter) {
            this.innerAdapter = innerAdapter;
        }

        @Override
        public void write(JsonWriter out, Optional<E> value) throws IOException {
            if (value == null || !value.isPresent()) {
                out.nullValue();
            } else {
                // Preserve the {"value": x} format that the React app expects
                // (matches the old Gson reflection-based serialization of Optional)
                out.beginObject();
                out.name("value");
                innerAdapter.write(out, value.get());
                out.endObject();
            }
        }

        @Override
        public Optional<E> read(JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return Optional.empty();
            }
            if (in.peek() == JsonToken.BEGIN_OBJECT) {
                in.beginObject();
                in.nextName(); // "value"
                E val = innerAdapter.read(in);
                in.endObject();
                return Optional.of(val);
            }
            return Optional.of(innerAdapter.read(in));
        }
    }
}
