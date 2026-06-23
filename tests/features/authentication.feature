Feature: Username-first Authentication
  As a registered user
  I want to sign in with my username and security key
  So that I can access the application

  Background:
    Given "registereduser" is registered with a security key
    And I am on the login page

  Scenario: Successful sign-in with username and security key
    When I enter username "registereduser"
    And I click Continue
    And the virtual authenticator completes the ceremony
    Then I should be redirected to the dashboard
    And I should be signed in as "registereduser"

  Scenario: Sign-in attempt with unknown username
    When I enter username "unknownuser"
    And I click Continue
    Then I should see an error message
    And I should remain on the login page

  Scenario: Sign in and then sign out
    When I enter username "registereduser"
    And I click Continue
    And the virtual authenticator completes the ceremony
    Then I should be on the dashboard
    When I click Sign Out
    Then I should be on the login page
