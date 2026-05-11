# 🧠 Shaadi Mantrana - CI Failure Patterns & Memory

This document tracks recurring CI/CD failures, their root causes, and the deterministic fixes applied. It serves as the long-term memory for the AI CI Engineer.

---

## 🔐 Pattern: Missing Lockfile Failure
- **Symptoms**: `npm ci` fails with "Dependencies lock file is not found".
- **Root Cause**: `package-lock.json` is missing from the repository or ignored by Git.
- **Fix**: Force-add the lockfile (`git add -f package-lock.json`) and push.
- **Prevention**: Ensure `.gitignore` explicitly allows lockfiles at root and workspace levels.

## 📦 Pattern: Monorepo Cache Mismatch
- **Symptoms**: `actions/setup-node` fails with "Some specified paths were not resolved".
- **Root Cause**: Workflow configured to look for `frontend/package-lock.json` in a monorepo where only a root lockfile exists.
- **Fix**: Update `cache-dependency-path` to point to the root `package-lock.json` only.
- **Prevention**: Use unified caching strategy in all workflow jobs.

## 🐛 Pattern: Non-Existent Dependency Version (Notarget)
- **Symptoms**: `npm error notarget No matching version found for [package]@[version]`.
- **Root Cause**: Over-eager version pinning in `package.json` overrides for versions not yet in the registry.
- **Fix**: Verify version existence with `npm show [package] versions` and revert to latest stable/secure patch.
- **Prevention**: Always run `npm install` locally and verify the registry before committing overrides.

## 🏗️ Pattern: Static Export Incompatibility (Next.js/Capacitor)
- **Symptoms**: Build fails during static worker execution or hydration mismatch on mobile.
- **Root Cause**: Use of server-only features (e.g., `next/link` without anchors) in a static Capacitor export.
- **Fix**: Use standard `<a>` tags for mobile-critical flows and lazy-initialize server-side modules.
- **Prevention**: Run `npm run build` locally in static mode before pushing.

---

## 🛠️ Operational Recovery Loop
When a CI failure occurs:
1. **Analyze**: Read raw logs, correlate with the commit diff.
2. **Consult**: Check this memory for matching patterns.
3. **Reproduce**: Run `scripts/preflight.sh` locally.
4. **Fix**: Apply the smallest deterministic fix.
5. **Update**: Add new patterns discovered to this document.
