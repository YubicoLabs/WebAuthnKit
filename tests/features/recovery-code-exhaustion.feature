Feature: Recovery Code Exhaustion
  As a registered user who has used all their recovery codes
  I want to be notified that my recovery codes are exhausted
  So that I know to generate new ones before losing access

  Background:
    Given "registereduser" is registered with a security key
    And "registereduser" has been issued recovery codes at registration

  Scenario: Dashboard shows exhaustion warning after all recovery codes are used
    Given "registereduser" has used all their recovery codes
    When I sign in as "registereduser" with a security key
    Then I should be on the dashboard
    And I should see a warning that all recovery codes have been used
    And I should see a prompt to generate new recovery codes
