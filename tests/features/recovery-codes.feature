Feature: Recovery Code Sign-in
  As a registered user who has lost access to their security key
  I want to sign in using a recovery code
  So that I can regain access to my account

  Background:
    Given "registereduser" is registered with a security key
    And "registereduser" has been issued recovery codes at registration
    And I am on the recovery code sign-in page for "registereduser"

  Scenario: Successful sign-in with a valid recovery code
    When I enter a valid recovery code
    Then I should be redirected to the dashboard
    And I should be signed in as "registereduser"
    And that recovery code should be marked as used

  Scenario: Sign-in attempt with an invalid recovery code
    When I enter an invalid recovery code "INVALID-CODE"
    Then I should see an error message
    And I should not be signed in

  Scenario: Sign-in attempt with an already-used recovery code
    Given I have already used one recovery code
    When I enter the previously used recovery code
    Then I should see an error message
    And I should not be signed in
