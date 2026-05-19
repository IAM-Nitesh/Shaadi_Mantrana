Feature: Admin Login & Access Control

  # ─────────────────────────────────────────────────────────────────────────────
  # Step pattern map (every step resolves to exactly ONE handler):
  #
  # navigation.steps.ts handles:
  #   Given 'I am on the {string} page'
  #   Given 'the test user is in the {string} state'
  #   When  /^I click the "([^"]+)" button$/       ← ALL button clicks
  #   When  'I navigate to {string}'
  #   Then  'I should see the {string} heading'
  #   Then  'I should see the admin dashboard title'
  #   Then  'I should be redirected to the {string} page'
  #
  # admin.login.steps.ts handles everything else below.
  # ─────────────────────────────────────────────────────────────────────────────

  # ── Happy Path ───────────────────────────────────────────────────────────────

  Scenario: Admin can see the login page
    Given I am on the "/login" page
    Then I should see the "Shaadi Mantrana" heading on the login screen
    And I should see a phone number input field
    And the send otp button should be disabled

  Scenario: Admin enters a valid 10-digit phone number and the Send OTP button becomes active
    Given I am on the "/login" page
    Then I should see the "Shaadi Mantrana" heading on the login screen
    When I type "7086875013" into the phone input
    Then the send otp button should be enabled

  Scenario: Admin login with valid phone and OTP redirects to admin dashboard (mocked)
    Given the test user is in the "admin" state
    When I navigate to "/admin/dashboard"
    Then I should see the admin dashboard title
    And I should see the "Admin Dashboard" heading

  Scenario: Admin dashboard shows storage widgets
    Given the test user is in the "admin" state
    When I navigate to "/admin/dashboard"
    Then I should see the "B2 Cloud Storage" storage widget
    And I should see the "MongoDB Storage" storage widget

  Scenario: Admin bottom navigation bar is visible on dashboard
    Given the test user is in the "admin" state
    When I navigate to "/admin/dashboard"
    Then I should see the admin bottom navigation bar
    And the admin nav bar should have a "Dashboard" link
    And the admin nav bar should have a "Users" link
    And the admin nav bar should have a "Invitations" link

  # ── Route Guard & Access Control ─────────────────────────────────────────────

  Scenario: Unauthenticated user visiting admin dashboard is redirected to home
    Given I am on the "/admin/dashboard" page with no session
    Then I should be redirected to the "/" page

  Scenario: Regular user visiting admin dashboard is redirected to home
    Given the test user is in the "complete" state
    When I navigate to "/admin/dashboard"
    Then I should be redirected to the "/" page

  Scenario: Admin can navigate to User Management page
    Given the test user is in the "admin" state
    When I navigate to "/admin/dashboard"
    And I click the admin nav link "Users"
    Then I should be on the admin "/admin/users" page
    And I should see the "User Management" heading

  Scenario: Admin User Management page shows statistics cards
    Given the test user is in the "admin" state
    When I navigate to "/admin/users"
    Then I should see the "Total Users" stat card
    And I should see the "Active Users" stat card
    And I should see the "Paused Users" stat card
    And I should see the "Invited Users" stat card

  Scenario: Admin User Management table renders user rows
    Given the test user is in the "admin" state
    When I navigate to "/admin/users"
    Then I should see a user table with at least one row
    And the user table should have the "User" column header
    And the user table should have the "Status" column header
    And the user table should have the "Profile Complete" column header

  # ── OTP Screen Transition ────────────────────────────────────────────────────

  Scenario: After entering phone number the OTP screen appears (Playwright test mode)
    Given I am on the "/login" page
    When I type "7086875013" into the phone input
    And I click the "Get Verification Code" button
    Then I should see the "Verify Mobile" heading on the login screen
    And I should see 6 OTP input boxes

  Scenario: Admin can go back to phone entry from OTP screen
    Given I am on the "/login" page
    When I type "7086875013" into the phone input
    And I click the "Get Verification Code" button
    Then I should see the "Verify Mobile" heading on the login screen
    When I click the "← Change Phone Number" back link
    Then I should see the "Shaadi Mantrana" heading on the login screen

  Scenario: Verify Code button is disabled until all 6 OTP digits are entered
    Given I am on the "/login" page
    When I type "7086875013" into the phone input
    And I click the "Get Verification Code" button
    Then the "Verify Code" button should be disabled

  Scenario: Admin login fails with wrong OTP and shows an error
    Given I am on the "/login" page
    When I type "7086875013" into the phone input
    And I click the "Get Verification Code" button
    And I enter the OTP "999999"
    And I click the "Verify Code" button
    Then I should see a login error message

  # ── Admin Logout ─────────────────────────────────────────────────────────────

  Scenario: Admin logout overlay is hidden by default on dashboard load
    Given the test user is in the "admin" state
    When I navigate to "/admin/dashboard"
    Then the logout overlay should not be visible

  Scenario: Admin logout clears session and redirects to home
    Given the test user is in the "admin" state
    When I navigate to "/admin/dashboard"
    And I click the logout button in the admin nav bar
    Then the logout animation overlay should be visible
    And I should eventually be redirected to the "/" page

  # ── Admin Login Redirect Page ─────────────────────────────────────────────────

  Scenario: Admin accessing /admin/login while already authenticated is auto-redirected to dashboard
    Given the test user is in the "admin" state
    When I navigate to "/admin/login"
    Then I should be redirected to the "/admin/dashboard" page

  Scenario: Unauthenticated user on /admin/login sees the gateway screen
    Given I am on the "/admin/login" page with no session
    Then I should see the "Admin Access" heading
    And I should see a button labelled "Login to Shaadi Mantrana"
