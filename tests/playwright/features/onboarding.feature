Feature: Sacred Onboarding

  Scenario: Complete the entire profiling journey
    Given the test user is in the "fresh" state
    And I navigate to "/profile"
    Then I should see the "Personal Grace" section
    When I fill in "Name" with "Aaryan Sharma"
    And I select "Male" for "Gender"
    And I fill in "Date of Birth" with "1995-05-15"
    And I fill in "Time of Birth" with "10:30"
    And I fill in "Place of Birth" with "New Delhi"
    And I click the "Continue Journey" button

    # Step 2: Physical & Vitality
    Then I should see the "Physical & Vitality" section
    When I fill in "Height" with "5ft 10in"
    And I fill in "Weight" with "75kg"
    And I select "Fair" for "Complexion"
    And I select "Vegetarian" for "Eating Habit"
    And I click the "Continue Journey" button

    # Step 3: Intellectual Path
    Then I should see the "Intellectual Path" section
    When I fill in "Highest Education" with "Post Graduate"
    And I fill in "Professional Occupation" with "Software Professional"
    And I select "20 Lakhs - 50 Lakhs" for "Annual Income"
    And I select "Yes, Absolutely" for "Open to Settle Abroad?"
    And I click the "Continue Journey" button

    # Step 4: Sacred Roots
    Then I should see the "Sacred Roots" section
    When I select "Never Married" for "Marital Status"
    And I select "No" for "Manglik"
    And I fill in "Native Place" with "Varanasi"
    And I fill in "Current Residence" with "Bangalore"
    And I click the "Continue Journey" button

    # Step 5: Sacred Intent
    Then I should see the "Sacred Intent" section
    When I fill in "About Me" with "I am seeking a partner who values tradition and growth."
    And I fill in "Interests & Passions" with "Classical Music, Yoga"
    And I click the "Finalize Vows" button

    Then I should be redirected to the "/dashboard" page
