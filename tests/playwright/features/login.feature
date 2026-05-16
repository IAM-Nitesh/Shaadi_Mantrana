Feature: First Time Login

  Background:
    Given I am on the login page

  Scenario: Successful first-time login and onboarding start
    When I enter the test phone number
    And I click the "Get Verification Code" button
    Then I should see the OTP input screen
    When I enter the test OTP
    And I click the "Verify Code" button
    Then I should be redirected to the "/profile" page
    And I should see the onboarding message "Welcome to the Royal Court"
    When I click the "Begin Sacred Profiling" button
    Then I should see the "Sacred Profiling" wizard
