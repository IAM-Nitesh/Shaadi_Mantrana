# Resolve Backend Dependencies and Frontend Metadata Warnings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `MODULE_NOT_FOUND: 'mongodb'` error in the backend and resolve Next.js `themeColor` metadata warnings in the frontend.

**Architecture:** 
1. Fix frontend metadata by moving `themeColor` to the `viewport` export in `layout.tsx`.
2. Populate missing backend dependencies by running a full `npm install` from the root, ensuring all workspace modules are correctly installed and linked.
3. Verify with `preflight.sh` and by starting the dev servers.

**Tech Stack:** Next.js 15, Node.js, npm workspaces.

---

### Task 1: Frontend Metadata Fix

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [x] **Step 1: Move themeColor to viewport export**
Modify `frontend/src/app/layout.tsx` to remove `themeColor` from `metadata` and add it to a new `viewport` export.

```typescript
// Before
export const metadata = {
  ...
  themeColor: '#ec4899',
  ...
};

// After
export const metadata = {
  ...
};

export const viewport = {
  themeColor: '#ec4899',
};
```

- [x] **Step 2: Commit metadata fix**
```bash
git add frontend/src/app/layout.tsx
git commit -m "fix(frontend): move themeColor to viewport export for Next.js 15 compatibility"
```

### Task 2: Backend Dependency Resolution

**Files:**
- Root: `package.json`, `package-lock.json`
- Backend: `backend/node_modules/`

- [x] **Step 1: Run full installation from root**
Run `npm install` in the root to ensure all workspaces (frontend and backend) have their dependencies installed.

Run: `PATH=/opt/homebrew/bin:$PATH npm install --legacy-peer-deps`

- [x] **Step 2: Verify mongodb exists in backend/node_modules**
Run: `ls -d backend/node_modules/mongodb`
Expected: `backend/node_modules/mongodb`

- [x] **Step 3: Commit lockfile changes (if any)**
```bash
git add package-lock.json
git commit -m "chore: synchronize dependencies across workspaces"
```

### Task 3: Verification

- [x] **Step 1: Run Preflight**
Run: `./scripts/preflight.sh`
Expected: Passes with no `themeColor` warnings.

- [x] **Step 2: Start Backend Dev Server**
Run: `cd backend && PATH=/opt/homebrew/bin:$PATH npm run dev`
Expected: Starts without `MODULE_NOT_FOUND` error.
