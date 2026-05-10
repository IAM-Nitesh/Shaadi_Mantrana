# Design Spec: Repository Cleanup and Consolidation

**Date:** 2026-05-11
**Topic:** Cleanup and Consolidation

## Purpose
The Shaadi Mantrana repository has accumulated several temporary, scratch, and legacy files over time. This project aims to clean up the workspace to improve maintainability and clarity while preserving legacy documentation and code in an archived state for future reference.

## Constraints
- **Preserve AI Context:** Do NOT touch `ai-agents`, `ai-maintenance`, and `ai-memory` directories.
- **Archive, Don't Destroy Documentation:** Consolidate root-level markdown documentation and legacy backend code into `docs/legacy`.
- **Absolute Deletion for Clutter:** Temporary files (`cookies.txt`, `response.txt`, etc.) and scratch scripts should be permanently deleted.

## Architecture & Strategy

### 1. Consolidation Strategy
Legacy assets will be moved to `docs/legacy/` with subdirectories mirroring their original locations:
- `docs/legacy/root/` for top-level files.
- `docs/legacy/backend/routes/` for legacy routes.
- `docs/legacy/backend/models/` for legacy models.

### 2. Dependency Management
- **Routes:** `matchRoutes.js` will be unmounted from `backend/src/index.js`.
- **Controllers:** `matchingControllerMongo.js` will be refactored to remove the `Match` model dependency, opting for direct collection access if legacy cleanup is still required.
- **Models:** `Match.js` will be archived. All other `*_Optimized.js` or `*_old.js` models will be archived.

### 3. Cleanup Items

#### Root Directory
- **Archive:** `API_CONTRACTS.md`, `ENVIRONMENT.md`, `PROJECT_VISION.md`, `RELEASE_PHASE.md`, `SUCCESS_METRICS.md`, `SYSTEM_PRIORITIES.md`.
- **Delete:** `cookies.txt`, `keystore.jks` (duplicate), `playground-1.mongodb.js` (scratch).

#### Backend Directory
- **Archive:** `src/routes/matchRoutes.js`, `src/models/Match.js`, `src/models/Invitation_Optimized.js`, `src/models/Connection_Optimized.js`, `src/models/DailyLike_Optimized.js`, `src/models/User_old.js`, `src/models/ChatThread.js`.
- **Delete:** `loki_response.txt`, `response.txt`, `payload.json`, `test-db-connection.js`, `test-user-check.js`, `list-all-users.js`, `temp/`, `tmp-logs/`.

## Success Criteria
- No broken imports in the backend.
- Backend server starts successfully (`npm run dev:backend`).
- All archived files are present in `docs/legacy`.
- Clutter files are no longer in the workspace.
- `package.json` scripts are cleaned of broken references.
