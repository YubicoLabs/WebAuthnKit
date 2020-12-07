package com.yubicolabs;

import com.amazon.rdsdata.client.RdsDataClient;
import com.amazonaws.services.rdsdata.AWSRDSData;
import com.amazonaws.services.rdsdata.AWSRDSDataClient;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.yubico.webauthn.data.ByteArray;
import com.yubicolabs.data.AssertionRequestWrapper;
import com.yubicolabs.data.StorageDTO;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;


@Slf4j
public class AssertionRequestStorage {

    private static final String RESOURCE_ARN = System.getenv("DBAuroraClusterArn");
    private static final String SECRET_ARN = System.getenv("DBSecretsStoreArn");
    private static final String DATABASE = System.getenv("DatabaseName");

    private final Gson gson = new GsonBuilder().create();

    private final RdsDataClient client;

    public AssertionRequestStorage() {
        AWSRDSData rdsData = AWSRDSDataClient.builder().build();
        client = RdsDataClient.builder()
            .rdsDataService(rdsData)
            .database(DATABASE)
            .resourceArn(RESOURCE_ARN)
            .secretArn(SECRET_ARN)
            .build();
    }

    public boolean put(ByteArray key, AssertionRequestWrapper value) {

        String keyJsonOutput = gson.toJson(key);
        String valueJsonOutput = gson.toJson(value);
 
        final String SQL = "INSERT INTO assertionRequests (_key, _value) VALUES( :keyJsonOutput, :valueJsonOutput)";

        client.forSql(SQL)
            .withParamSets(new PutParams(keyJsonOutput, valueJsonOutput))
            .execute();

        return true;
    }

    public boolean invalidate(ByteArray key) {

        String keyJsonOutput = gson.toJson(key);

        final String SQL = "DELETE FROM assertionRequests WHERE _key = :keyJsonOutput";

        client.forSql(SQL)
            .withParamSets(new KeyParams(keyJsonOutput))
            .execute();

        return true;
    }

    public AssertionRequestWrapper getIfPresent(ByteArray key) {
        log.debug("getIfPresent key: {}", key);

        String keyJsonOutput = gson.toJson(key);
        log.debug("getIfPresent keyJsonOutput: {}", keyJsonOutput);

        // Clear entries older than 1 hour
        final String SQL1 = "DELETE FROM assertionRequests WHERE creationDate < DATE_SUB( NOW( ) , INTERVAL 1 HOUR )";

        client.forSql(SQL1).execute();

        // Get entry
        final String SQL = "SELECT _value FROM assertionRequests WHERE _key = :keyJsonOutput";

        StorageDTO result = client.forSql(SQL)
            .withParamSets(new KeyParams(keyJsonOutput))
            .execute()
            .mapToSingle(StorageDTO.class);

        return gson.fromJson(result._value, AssertionRequestWrapper.class);
    }

    @Value 
    private static class PutParams {
        public final String keyJsonOutput;
        public final String valueJsonOutput;
    }

    @Value 
    private static class KeyParams {
        public final String keyJsonOutput;
    }
    
}