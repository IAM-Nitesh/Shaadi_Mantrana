#!/bin/bash
# A wrapper script to run the production admin flows tests.

echo "========================================="
echo " Shaadi Mantrana - Prod Admin Flow Tests"
echo "========================================="
echo ""

# Prompt for Admin Phone Number if not already provided
if [ -z "$ADMIN_PHONE" ]; then
  read -p "Enter Admin Phone Number (10 digits): " ADMIN_PHONE
fi

if [ -z "$ADMIN_PHONE" ]; then
  echo "Error: ADMIN_PHONE is required."
  exit 1
fi

export ADMIN_PHONE

echo ""
echo "Starting Playwright Prod Tests..."
echo "Note: The script will pause during login and ask for the OTP received on your phone."
echo ""

# Run the test
npx playwright test tests/prod/admin-flows.spec.ts --config=playwright.prod.config.js --project=chromium
TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed."
  echo "You can check the logs from Render or Vercel using: node scripts/fetch-server-logs.js"
else
  echo "✅ Tests passed."
fi

exit $TEST_EXIT_CODE
