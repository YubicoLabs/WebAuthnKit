Feature: Server-Verified PIN
  As a user whose security key does not perform on-device user verification
  I want to provide a server-verified PIN as an additional factor
  So that strong authentication is maintained without biometric verification on the device

  Scenario: Registration prompts for PIN creation when the authenticator does not perform UV
    Given I am on the login page
    When I register a new account without user verification
    Then the server-verified PIN creation modal should appear

  Scenario: Sign in with correct server-verified PIN succeeds
    Given a user is registered without user verification and has PIN "1234"
    And I am on the login page
    When I sign in without user verification
    Then I should see the server-verified PIN entry prompt
    When I enter PIN "1234"
    Then I should be redirected to the dashboard

  Scenario: Sign in with incorrect server-verified PIN is rejected
    Given a user is registered without user verification and has PIN "1234"
    And I am on the login page
    When I sign in without user verification
    Then I should see the server-verified PIN entry prompt
    When I enter PIN "0000"
    Then I should see an error message
    And I should not be signed in

  Scenario: Changing the server-verified PIN updates authentication
    Given a user is registered without user verification and has PIN "1234"
    And I am signed in
    When I change the server-verified PIN from "1234" to "5678"
    Then the PIN change should succeed
    When I sign out and sign back in without user verification
    Then I should see the server-verified PIN entry prompt
    When I enter PIN "5678"
    Then I should be redirected to the dashboard
