Feature: Auth Guard & Business Rules

  Scenario: Incomplete user is force-redirected and locked
    Given the test user is in the "incomplete" state
    And I am logged in with phone "9354799303" and OTP "123456"
    Then I should be redirected to the "/profile" page
    And the "Discover" navigation link should be disabled
    And the "Matches" navigation link should be disabled

  Scenario: Admin user can access the dashboard
    Given the test user is in the "admin" state
    And I am logged in with phone "9354799303" and OTP "123456"
    When I navigate to "/admin/dashboard"
    Then I should see the admin dashboard title

  Scenario: Complete user can access all sections
    Given the test user is in the "complete" state
    And I am logged in with phone "9354799303" and OTP "123456"
    When I click the "Discover" link in the navigation
    Then I should see the "Discovery" heading
    When I click the "Matches" link in the navigation
    Then I should see the "Matches" heading
