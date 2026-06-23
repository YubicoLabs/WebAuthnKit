Feature: Add Security Key Credential
  As an authenticated user
  I want to add a second security key to my account
  So that I have a backup authenticator

  Background:
    Given "registereduser" is signed in
    And there is at least one registered credential
    And I am on the dashboard

  Scenario: Add a second security key
    When I click "Add a new security key"
    And I fill in the nickname "Backup Key"
    And I register the new security key
    Then I should have 2 registered credentials
