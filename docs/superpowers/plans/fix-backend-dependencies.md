# Plan - Fix Backend Dependencies

## Goal
Resolve `Cannot find module 'mongodb'` and other missing dependency errors in the backend workspace.

## Steps
1. **Verification**: Confirm which dependencies are actually missing across the monorepo. [High]
2. **Restoration**: Run `npm install --workspace=backend` to force restoration of backend-specific dependencies. [High]
3. **Validation**: Check `node_modules` for `mongodb` and `@babel/preset-react`. [High]
4. **Preflight**: Run `./scripts/preflight.sh` (with correct PATH) to verify system integrity. [High]
5. **Final Check**: Start the backend dev server to confirm the fix. [High]

## Acceptance Criteria
- `npm run dev` in the backend workspace starts without `MODULE_NOT_FOUND` errors.
- `./scripts/preflight.sh` returns a green status.
