# Sync React and React-Email Dependencies Across Monorepo

**Goal:** Resolve the `MODULE_NOT_FOUND: 'react'` error in the backend on Render by ensuring version parity and correct hoisting.

**Architecture:**
1. Pin `react` and `react-dom` to exactly `18.3.1` in Root, Frontend, and Backend.
2. Synchronize `@react-email/render` and `@react-email/components` versions across Root and Backend.
3. Clean up the lockfile by running a fresh install (to be done by the user or on CI).

---

### Task 1: Pin React Versions

- [ ] **Step 1: Update Root `package.json`**
  Ensure `react` and `react-dom` are `18.3.1`.
- [ ] **Step 2: Update Frontend `package.json`**
  Change `^18.3.1` to `18.3.1`.
- [ ] **Step 3: Update Backend `package.json`**
  Ensure `react` and `react-dom` are `18.3.1`.

### Task 2: Synchronize React-Email Packages

- [ ] **Step 1: Update Root `package.json`**
  Set `@react-email/render` to `1.1.4` (currently `^1.1.4`) and `@react-email/components` to `0.3.3`.
- [ ] **Step 2: Update Backend `package.json`**
  Set `@react-email/render` to `1.1.4` and `@react-email/components` to `0.3.3`.

### Task 3: Verification (Local)

- [ ] **Step 1: Run Preflight**
  `./scripts/preflight.sh`
- [ ] **Step 2: Start Backend**
  `cd backend && npm run dev`
