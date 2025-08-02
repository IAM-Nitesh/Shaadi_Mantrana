# Manual Test Checklist for Profile Validation Scenarios

## Prerequisites
- Frontend running on http://localhost:3000
- Backend running on http://localhost:5500
- User logged in with test account

---

## 1. Profile Completeness Validation

### Scenario 1.1: Profile completeness < 100%
**Steps:**
1. Navigate to `/profile`
2. Clear all required fields (name, gender, dateOfBirth, etc.)
3. Try to save the profile
4. Try to navigate to `/dashboard` or `/matches`

**Expected Result:** 
- Save should be prevented or show warning
- Navigation to Discover/Matches should redirect to `/profile`
- Profile completion banner should show < 100%

**Status:** ⬜ Pass ⬜ Fail

### Scenario 1.2: Profile completeness = 100%
**Steps:**
1. Fill in all required fields:
   - Name: "Test User"
   - Gender: "Male"
   - Date of Birth: "1990-01-01"
   - Height: "170"
   - Weight: "70"
   - Complexion: "Medium"
   - Education: "B.Tech"
   - Occupation: "Software Engineer"
   - Annual Income: "500000"
   - Native Place: "Delhi"
   - Current Residence: "Mumbai"
   - Marital Status: "Never Married"
   - Father: "Test Father"
   - Mother: "Test Mother"
   - About: "Valid about me content"
   - Interests: Add at least one interest
2. Save the profile
3. Try to navigate to `/dashboard` and `/matches`

**Expected Result:**
- Save should succeed
- Navigation to Discover/Matches should work
- Profile completion banner should show 100%

**Status:** ⬜ Pass ⬜ Fail

---

## 2. User Email Validation

**Note:** Email validation scenarios are ignored as emails are approved by admin.

---

## 3. Profile Image Validation

### Scenario 3.1: Valid image path with face detection
**Steps:**
1. Navigate to `/profile`
2. Click on camera icon to upload image
3. Select a valid JPG/PNG file with clear face
4. Check if upload succeeds and face detection passes

**Expected Result:** Image should upload successfully and face detection should validate

**Status:** ⬜ Pass ⬜ Fail

### Scenario 3.2: Invalid image path or no face detected
**Steps:**
1. Navigate to `/profile`
2. Try to upload an image without a face or invalid file type
3. Check for validation error

**Expected Result:** Should show validation error for images without faces or invalid file types

**Status:** ⬜ Pass ⬜ Fail

---

## 4. Profile Information Validation

### Scenario 4.1: About field validation
**Steps:**
1. Navigate to `/profile`
2. Enter "naaaa" in the about field
3. Check for validation error

**Expected Result:** Should show validation error for placeholder content

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.2: Date of birth validation
**Steps:**
1. Navigate to `/profile`
2. Enter future date "2030-01-01" in date of birth
3. Check for validation error

**Expected Result:** Should show validation error for future date

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.3: Age validation (Gender-specific)
**Steps:**
1. Navigate to `/profile`
2. Set gender to "Male"
3. Enter date of birth that makes user under 21 (e.g., "2005-01-01")
4. Check for validation error
5. Change gender to "Female"
6. Enter date of birth that makes user under 18 (e.g., "2010-01-01")
7. Check for validation error

**Expected Result:** 
- Male users under 21 should show validation error
- Female users under 18 should show validation error
- Male users 21+ and Female users 18+ should be accepted

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.4: Location validation
**Steps:**
1. Navigate to `/profile`
2. Enter invalid location "InvalidLocation123"
3. Check for validation error

**Expected Result:** Should show validation error for invalid location

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.5: Gender validation
**Steps:**
1. Navigate to `/profile`
2. Try to select "Other" in gender dropdown
3. Check if invalid option is rejected

**Expected Result:** Should only allow "Male" or "Female"

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.6: Annual income validation
**Steps:**
1. Navigate to `/profile`
2. Enter "abc123" in annual income field
3. Check for validation error

**Expected Result:** Should show validation error for non-numeric input

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.7: Occupation validation
**Steps:**
1. Navigate to `/profile`
2. Leave occupation field empty
3. Try to save

**Expected Result:** Should handle empty occupation gracefully

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.8: Height validation (Feet and Inches)
**Steps:**
1. Navigate to `/profile`
2. Enter "3'0"" in height field (below minimum)
3. Check for validation error
4. Enter "9'0"" in height field (above maximum)
5. Check for validation error
6. Enter "5'8"" in height field (valid format)
7. Check if accepted

**Expected Result:** 
- Should reject heights below 4'0" and above 8'0"
- Should accept valid feet and inches format (e.g., 5'8", 6'2")

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.9: Weight validation
**Steps:**
1. Navigate to `/profile`
2. Enter "500" in weight field (invalid weight)
3. Check for validation error

**Expected Result:** Should show validation error for invalid weight

**Status:** ⬜ Pass ⬜ Fail

### Scenario 4.10: Lifestyle habits validation
**Steps:**
1. Navigate to `/profile`
2. Try to select "Invalid" in smoking habit dropdown
3. Try to select "Invalid" in drinking habit dropdown
4. Try to select "Invalid" in eating habit dropdown
5. Check if invalid options are rejected

**Expected Result:** Should only allow valid enum values

**Status:** ⬜ Pass ⬜ Fail

---

## 5. User Verification Validation

### Scenario 5.1: isVerified field validation
**Steps:**
1. Check user profile data
2. Verify isVerified field is boolean

**Expected Result:** isVerified should be true/false

**Status:** ⬜ Pass ⬜ Fail

### Scenario 5.2: verifiedAt timestamp validation
**Steps:**
1. Check user profile data
2. Verify verifiedAt field has valid timestamp

**Expected Result:** verifiedAt should be valid ISO timestamp

**Status:** ⬜ Pass ⬜ Fail

### Scenario 5.3: approvalType validation
**Steps:**
1. Check user profile data
2. Verify approvalType is "admin"

**Expected Result:** approvalType should be "admin"

**Status:** ⬜ Pass ⬜ Fail

---

## 6. User Role and Status Validation

### Scenario 6.1: role validation
**Steps:**
1. Check user profile data
2. Verify role field is "user"

**Expected Result:** role should be "user"

**Status:** ⬜ Pass ⬜ Fail

### Scenario 6.2: status validation
**Steps:**
1. Check user profile data
2. Verify status field is "active"

**Expected Result:** status should be "active"

**Status:** ⬜ Pass ⬜ Fail

### Scenario 6.3: isApprovedByAdmin validation
**Steps:**
1. Check user profile data
2. Verify isApprovedByAdmin is true

**Expected Result:** isApprovedByAdmin should be true

**Status:** ⬜ Pass ⬜ Fail

### Scenario 6.4: premium validation
**Steps:**
1. Check user profile data
2. Verify premium is false

**Expected Result:** premium should be false for regular users

**Status:** ⬜ Pass ⬜ Fail

### Scenario 6.5: isFirstLogin validation
**Steps:**
1. Check user profile data
2. Verify isFirstLogin is boolean

**Expected Result:** isFirstLogin should be boolean

**Status:** ⬜ Pass ⬜ Fail

---

## 7. Login History Validation

### Scenario 7.1: loginHistory array validation
**Steps:**
1. Check user profile data
2. Verify loginHistory is an array

**Expected Result:** loginHistory should be an array

**Status:** ⬜ Pass ⬜ Fail

---

## 8. User Preferences Validation

### Scenario 8.1: ageRange validation
**Steps:**
1. Check user preferences data
2. Verify ageRange.min and ageRange.max are numbers
3. Verify min < max and values are reasonable (18-100)

**Expected Result:** ageRange should have valid numeric values

**Status:** ⬜ Pass ⬜ Fail

### Scenario 8.2: location array validation
**Steps:**
1. Check user preferences data
2. Verify location is an array

**Expected Result:** location should be an array

**Status:** ⬜ Pass ⬜ Fail

### Scenario 8.3: profession and education arrays validation
**Steps:**
1. Check user preferences data
2. Verify profession and education are arrays

**Expected Result:** profession and education should be arrays

**Status:** ⬜ Pass ⬜ Fail

---

## 9. Date Validation

### Scenario 9.1: timeOfBirth timestamp validation
**Steps:**
1. Check user profile data
2. Verify timeOfBirth is valid timestamp (if present)

**Expected Result:** timeOfBirth should be valid ISO timestamp

**Status:** ⬜ Pass ⬜ Fail

---

## 10. System Timestamp Validation

### Scenario 10.1: createdAt and updatedAt validation
**Steps:**
1. Check user profile data
2. Verify createdAt and updatedAt are valid timestamps

**Expected Result:** Both fields should be valid ISO timestamps

**Status:** ⬜ Pass ⬜ Fail

### Scenario 10.2: lastActive validation
**Steps:**
1. Check user profile data
2. Verify lastActive is valid timestamp

**Expected Result:** lastActive should be valid ISO timestamp

**Status:** ⬜ Pass ⬜ Fail

---

## 11. Edge Cases and Negative Scenarios

### Scenario 11.1: Special characters in fields
**Steps:**
1. Navigate to `/profile`
2. Enter special characters in name field: "Test@User#123"
3. Enter special characters in about field: "Special chars: !@#$%^&*()"
4. Try to save

**Expected Result:** Should handle special characters gracefully

**Status:** ⬜ Pass ⬜ Fail

### Scenario 11.2: Missing required fields
**Steps:**
1. Navigate to `/profile`
2. Clear all fields
3. Try to save empty profile

**Expected Result:** Should prevent save or show appropriate warnings

**Status:** ⬜ Pass ⬜ Fail

---

## Test Results Summary

**Total Scenarios:** 23 (Email validation scenarios ignored)
**Passed:** ___ / 23
**Failed:** ___ / 23
**Success Rate:** ___%

**Failed Scenarios:**
1. _________________________________
2. _________________________________
3. _________________________________

**Notes:**
- _________________________________
- _________________________________
- _________________________________ 