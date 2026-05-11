# 🎓 Shaadi Mantrana - Security Sprint Learning Curve

This document serves as a "Continuous Learning" artifact, capturing the hard-won insights from the May 2026 Security Hardening sprint.

---

## 🏗️ 1. The Monorepo Lockfile Paradox
- **The Challenge**: CI jobs were failing with "Lockfile not found" in `frontend` and `backend` workspaces.
- **The Learning**: In npm v7+ monorepos, sub-workspaces **do not have individual lockfiles**. All dependency locking is centralized in the root `package-lock.json`. 
- **The Fix**: Refactored GitHub Actions to run from the root using `--workspace` flags and unified caching on the root lockfile.
- **Rule**: *Never run `npm ci` inside a workspace directory in a monorepo.*

## 📦 2. Phantom Dependencies & Type Safety
- **The Challenge**: `tsc` (TypeScript) threw 15 "Missing Module" errors even though the app "worked" locally.
- **The Learning**: Next.js and some local environments can be "too smart" and resolve packages from the root `node_modules`. However, `tsc` requires every module to be explicitly listed in the **local workspace `package.json`**.
- **The Fix**: Restored 157 missing core packages (GSAP, Firebase, etc.) to the `frontend/package.json`.
- **Rule**: *If it's imported in `src/`, it must be in the workspace `package.json`.*

## 🎨 3. The CSS Plugin Phantom
- **The Challenge**: Build passed locally but failed on Vercel with `Error: Cannot find module 'autoprefixer'`.
- **The Learning**: Next.js build-time plugins (PostCSS, Autoprefixer, Tailwind) are often present in a developer's global cache or root `node_modules`, leading to false positives in local preflight builds. Vercel requires these to be explicitly defined in the workspace `devDependencies`.
- **The Fix**: Explicitly added `autoprefixer` and `postcss` to `frontend/package.json`.
- **Rule**: *Always define CSS processing plugins in the workspace devDependencies, even if they seem global.*

## 🔐 4. The "Unified Shield" Override Strategy
- **The Challenge**: Vulnerabilities kept reappearing in different workspaces.
- **The Learning**: Security `overrides` must be synchronized across the root and all workspaces to prevent "dependency drifting" where one workspace remains vulnerable.
- **The Fix**: Implemented identical security pins (`next: 15.5.18`, `nodemailer: 8.0.7`, `tar: 7.4.3`) across the entire repository.
- **Rule**: *Security overrides are a global monorepo concern, not a per-project one.*

## 🛡️ 5. Local Validation vs. CI Fatigue
- **The Challenge**: Waiting 5-10 minutes for CI to fail on a simple path error or type mismatch.
- **The Learning**: A robust local `scripts/preflight.sh` that mirrors the CI's strictness is the only way to maintain high velocity.
- **The Fix**: Implemented a preflight script that runs security audits, type checks, and Capacitor syncs locally.
- **Rule**: *No push without a Green Preflight.*

## 🏷️ 6. Registry Verification
- **The Challenge**: Attempting to pin `tar@6.2.3` caused "Notarget" errors because that version doesn't exist in the npm registry.
- **The Learning**: AI and developers must verify the existence of a version using `npm show [pkg] versions` before adding it to an override.
- **The Fix**: Corrected to `tar@7.4.3`, the verified secure version.
- **Rule**: *Registry existence is the only source of truth for version pinning.*

---

**Shaadi Mantrana is now backed by an AI-assisted CI recovery loop and a high-stability operational framework.**
