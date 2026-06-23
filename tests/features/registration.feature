Feature: User Registration
  As a new user
  I want to register my security key
  So that I can sign in passwordlessly

  Background:
    Given I am on the login page

  Scenario: Successful registration with a new username
    When I enter a new username "testuser"
    And I click Continue
    Then I should be on the registration page
    And I should see "Add your Security Key"
    When I click Continue
    And the virtual authenticator completes the ceremony
    Then I should be redirected to the dashboard
    And I should see "Registration successful"
    And a credential should exist for "testuser" in the system

  Scenario: Cancel registration
    When I enter a new username "testuser"
    And I click Continue
    Then I should be on the registration page
    When I click Cancel
    Then I should be on the login page

  Scenario: Returning to register page for already-started registration
    Given "testuser" has a pending Cognito account but no credential
    When I enter username "testuser"
    And I click Continue
    Then I should be on the registration page
