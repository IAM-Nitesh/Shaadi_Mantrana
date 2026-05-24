#!/bin/bash
# A wrapper script to run the production returning user flows tests.

echo "================================================="
echo " Shaadi Mantrana - Prod Returning User Flow Tests"
echo "================================================="
echo ""

# Prompt for Phone Number if not already provided
if [ -z "$RETURNING_USER_PHONE" ]; then
  read -p "Enter Returning User Phone Number (10 digits): " RETURNING_USER_PHONE
fi

if [ -z "$RETURNING_USER_PHONE" ]; then
  echo "Error: RETURNING_USER_PHONE is required."
  exit 1
fi

export RETURNING_USER_PHONE

echo ""
echo "Starting Playwright Prod Tests..."
echo "Note: The script will pause during login and ask for the OTP received on your phone."
echo ""

# Run the test
npx playwright test tests/prod/returning-user-flows.spec.ts --config=playwright.prod.config.js --project=chromium
TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed."
else
  echo "✅ Tests passed."
fi

exit $TEST_EXIT_CODE
