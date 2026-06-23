Feature: Passkey Autofill (Conditional Mediation)
  As a returning user with a discoverable credential
  I want to sign in using the browser's passkey autofill prompt
  So that I can authenticate without typing my username

  Scenario: Login page offers autofill for discoverable credentials
    Given a user is registered with a discoverable credential
    And I am on the login page
    Then the username field should have autofill hints for webauthn

  Scenario: Passkey page redirects to login when conditional mediation is unavailable
    Given I am on the passkey login page
    Then I should be redirected to the login page if conditional mediation is not supported

  Scenario: Passkey page shows autofill input when conditional mediation is available
    Given a user is registered with a discoverable credential
    And I am on the passkey login page
    Then the passkey autofill input should be visible
