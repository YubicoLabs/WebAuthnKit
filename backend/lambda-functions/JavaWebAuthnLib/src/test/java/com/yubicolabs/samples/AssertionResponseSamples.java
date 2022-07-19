package com.yubicolabs.samples;

import com.google.gson.JsonObject;

public class AssertionResponseSamples {

  public JsonObject create_sampleAssertionResponse_noAT_pass(String requestId) {
    JsonObject response = new JsonObject();
    response.addProperty("clientDataJSON",
        "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiX00zN0NVbDRIYXNMMU5yRE9mcnB4ZVFmWHZ3cmhCZE9yQy1Pei1zR1hmcyIsIm9yaWdpbiI6Imh0dHBzOi8vZGV2LmQyYTR6YTRnMzF4eWF3LmFtcGxpZnlhcHAuY29tIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ");
    response.addProperty("authenticatorData", "T3EXqK_t1dr3_5sU8VWBpqC_7_J_0qDH-hXkmXxws4cFAAAAAg");
    response.addProperty("signature",
        "MEUCIQDR8rWjCgODkGJzxHNEZW-XDrzkUnzIc0ucKVxdCmsj_gIgefZetxsK-JxtmG-gkyofCN3090t-2u9aSWxqa_yOX8s");
    response.addProperty("userHandle", "ddd2-11ec-9d64-0242ac120002");

    JsonObject credential = new JsonObject();
    credential.addProperty("type", "public-key");
    credential.addProperty("id", "A353nl__9OMX4sUT4QznvSAQubrCyi6-yZRRnQ68-j0");
    credential.addProperty("rawId", "A353nl__9OMX4sUT4QznvSAQubrCyi6-yZRRnQ68-j0");

    credential.add("response", response);
    credential.add("clientExtensionResults", new JsonObject());

    JsonObject sampleObject = new JsonObject();
    sampleObject.addProperty("type", "finishAuthentication");
    sampleObject.addProperty("requestId", requestId);
    sampleObject.add("credential", credential);

    return sampleObject;

  }
}
