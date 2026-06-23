Feature: Credential Management
  As an authenticated user
  I want to manage my registered security keys
  So that I can keep my credentials organized and secure

  Background:
    Given "registereduser" is signed in
    And there is at least one registered credential
    And I am on the dashboard

  Scenario: View registered credentials
    Then I should see the credential "Security Key" in the list

  Scenario: Rename a credential
    When I open the edit modal for the first credential
    And I change the nickname to "My YubiKey"
    And I save the credential changes
    Then I should see the credential "My YubiKey" in the list

  Scenario: Delete a credential
    When I open the edit modal for the first credential
    And I delete the credential
    Then no credentials should remain in the list
