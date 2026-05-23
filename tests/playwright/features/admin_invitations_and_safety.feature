Feature: Admin Phone Invitations and Data Safety

  Background:
    Given the test user is in the "admin" state

  Scenario: Admin can navigate to Phone Invitations page and send invitation
    When I navigate to "/admin/phone-invitations"
    Then I should see the "Phone Invitations" heading
    And I should see an input with placeholder "Enter phone number"
    When I type "+919999999999" into the invitation phone input
    And I click the "Send Invitation" button
    Then I should see the invited phone number "+919999999999" in the invitation history table

  Scenario: Admin attempting to invite an already registered phone number sees error
    When I navigate to "/admin/phone-invitations"
    And I type "+918888888888" into the invitation phone input
    And I click the "Send Invitation" button
    Then I should see the invitation error "Invitation already sent to this phone number"

  Scenario: Admin can navigate to Data Safety page and verify UI elements
    When I navigate to "/admin/data-safety"
    Then I should see the "Admin Data Management" heading
    And I should see the "Admin Support" heading
    And I should see the admin support email "shaadimantrana.help@gmail.com" within the styled box
