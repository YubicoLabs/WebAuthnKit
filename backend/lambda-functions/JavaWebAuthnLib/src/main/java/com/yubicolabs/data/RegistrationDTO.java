package com.yubicolabs.data;

import java.time.Instant;
import lombok.Data;


@Data 
public class RegistrationDTO {
    public String username;
    public String userHandle;
    public String credentialId;
    public String registration;
    public Instant creationDate;
    public Instant lastUsedDate;
    public Instant lastUpdatedDate;
    public boolean active;
}
