Feature: Account Deletion
  As an authenticated user
  I want to be able to delete my account
  So that I can remove my data from the system

  Background:
    Given "registereduser" is signed in
    And I am on the dashboard

  Scenario: Delete account navigates to login page
    When I click "Permanently delete account"
    And I confirm account deletion
    Then I should be on the login page

  Scenario: Cancel account deletion stays on dashboard
    When I click "Permanently delete account"
    And I cancel account deletion
    Then I should still be on the dashboard
