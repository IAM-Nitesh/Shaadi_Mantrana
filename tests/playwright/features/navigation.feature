Feature: App Navigation

  Background:
    Given I am a logged-in user with a complete profile

  Scenario: Navigate between main sections
    When I click the "Discover" link in the navigation
    Then I should be redirected to the "/dashboard" page
    And I should see the "Discovery" heading
    
    When I click the "Matches" link in the navigation
    Then I should be redirected to the "/matches" page
    And I should see the "Matches" heading
    
    When I click the "Profile" link in the navigation
    Then I should be redirected to the "/profile" page
    And I should see the "Sacred Profile" heading
    
    When I click the "Settings" link in the navigation
    Then I should be redirected to the "/settings" page
    And I should see the "Settings" heading

  Scenario: View a match profile and start chat
    When I click the "Matches" link in the navigation
    Then I should see a list of mutual matches
    When I click on the match "Priya Singh"
    Then I should be redirected to the "/chat" page
    And I should see the chat interface for "Priya Singh"
