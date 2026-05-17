Feature: Matching & Sacred Conversations

  Scenario: Liking a profile and starting a chat
    Given the test user is in the "complete" state
    And I navigate to "/dashboard"
    Then I should see the "Discovery" heading
    
    When I click the "Like" button on the first profile card
    Then I should see a success toast "Sacred interest preserved"
    
    When I click the "Matches" link in the navigation
    Then I should see the "Matches" heading
    And I should see a list of mutual matches
    
    When I click on the match "Priya Singh"
    Then I should see the chat interface for "Priya Singh"
    When I type "Namaste, I am interested in your path." into the message box
    And I click the "Send" button
    Then I should see my message in the chat history
