# Logging Guidelines

## Purpose
This document describes the logging rules for the Shaadi Mantrana monorepo and how to add safe, structured log output without leaking sensitive data.

## What to log
- `error`: runtime failures, exceptions, crashed requests, infrastructure issues.
- `warn`: recoverable but abnormal conditions, timeouts, invalid payloads, retry decisions.
- `info`: user-facing events, important request lifecycle steps, feature state transitions, test harness setup.
- `debug`: local development traces and internal state used only when debugging.

## Logger conventions
- Use the shared `pino` logger configuration in `backend/src/utils/pino-logger.js` and `frontend/src/utils/pino-logger.ts`.
- In tests and scripts, use `scripts/test-logger.js` instead of raw `console.log` to avoid noisy, unstructured output.
- Do not use `console.log`, `console.error`, `console.warn`, or `console.debug` in production code paths.

## Sensitive data redaction
The logger configuration already redacts sensitive fields such as:
- `password`
- `confirmPassword`
- `token`
- `accessToken`
- `refreshToken`
- `authorization`
- `cookie`
- `set-cookie`
- `email`
- any field matching `.*password.*`, `.*secret.*`, `.*token.*`

If you add a new sensitive field, update the logger `redact` configuration in both backend and frontend logger modules.

## Local pretty-printing
Local development can enable readable, colorized output using `pino-pretty`.

- Install dependencies from the workspace root: `npm install`
- Start with pretty logs enabled:
  - `LOG_PRETTY=true npm run dev`
  - or `LOG_PRETTY=true npm run start`

When `LOG_PRETTY` is enabled, the logger falls back to JSON output only if `pino-pretty` is unavailable.

## Adding new redaction rules
1. Add the new field path to the `redact` array in `backend/src/utils/pino-logger.js` and `frontend/src/utils/pino-logger.ts`.
2. Add a serializer if needed to normalize the field before logging.
3. Run the relevant tests and verify logs do not include the redacted field.

## Test and script logging rules
- Use `const logger = require('../../scripts/test-logger');` in Playwright test files and script helpers.
- Continue using structured logger levels (`info`, `warn`, `error`) for all non-debug messages.
- Only preserve verbose logging for local debugging; avoid shipping test-run logs to central storage.
