# 📚 Continuous Learning — Shaadi Mantrana AI Knowledge Base

> **Schema**: Every entry carries `version`, `domain`, `date`, and `expiry_hint`. Entries without expiry metadata are treated as stale. A `knowledge-audit.sh` script should surface entries past their expiry hint as **knowledge debt** requiring human resolution. Old knowledge that silently contradicts new reality is a major hallucination source.

---

### 🎓 Learning: Unified AI Operations
**Date**: 2026-05-11 20:18:36
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Review if AI ecosystem structure changes significantly
**Insight**:
Consolidated scattered personas into ai-agents/ directory with a MASTER_BRAIN.md orchestrator and a centralized knowledge-base. Established the rule that CI failures must be documented to prevent phantom dependencies.

---

### 🎓 Learning: Proxy Function Binding in Lazy Init
**Date**: 2026-05-11 20:33:35
**Version**: 1.0 | **Domain**: Backend | **Expiry Hint**: Review after major Firebase or Supabase SDK upgrade
**Insight**:
When using Proxy for lazy initialization of SDKs (Supabase, Firebase), you MUST bind functions to the original instance to prevent 'this' context loss. SDK methods like .channel() or .auth() will fail silently or crash without explicit binding.

---

### 🎓 Learning: Vercel Build Dependencies
**Date**: 2026-05-11 20:33:35
**Version**: 1.0 | **Domain**: Pipeline | **Expiry Hint**: Review after Next.js major version upgrade or Vercel build system change
**Insight**:
For Next.js monorepos on Vercel, compilation-critical tools like autoprefixer, postcss, and typescript should remain in 'dependencies' (not devDeps) in the workspace package.json to ensure the build worker can resolve them during the optimized production build phase.

---

### 🎓 Learning: Workspace Dependency Integrity
**Date**: 2026-05-11 20:41:27
**Version**: 1.0 | **Domain**: Pipeline | **Expiry Hint**: Review if monorepo structure or Vercel workspace detection changes
**Insight**:
In Next.js monorepos on Vercel, every package imported by a workspace (e.g., frontend) MUST be explicitly declared in its local package.json dependencies, even if already present in the root. Failure to do so causes 'Cannot find module' errors during the workspace-specific build phase.

---

### 🎓 Learning: Hallucinated Version Prevention
**Date**: 2026-05-11 20:46:34
**Version**: 1.0 | **Domain**: Pipeline | **Expiry Hint**: Permanent — applies to all package management
**Insight**:
Always verify package versions against the actual registry (npm info) before pinning them in package.json. Pinning non-existent versions (like nodemailer 8.0.7) causes security audit scripts and CI installation steps to fail silently or with confusing errors.

---

### 🎓 Learning: Sync Overrides Across All Workspaces
**Date**: 2026-05-11 20:46:34
**Version**: 1.0 | **Domain**: Pipeline/Security | **Expiry Hint**: Review after major dependency tree changes
**Insight**:
In a monorepo, missing overrides in a specific workspace (e.g. frontend) can allow transitive dependencies to pull in vulnerable versions even if the root is patched. Always maintain mirror-overrides in root, frontend, and backend for critical security packages.

---

### 🎓 Learning: Powered AI Agents with Skills
**Date**: 2026-05-12 00:46:31
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Review if .agent/skills directory structure changes
**Insight**:
Coupled the project-specific AI personas with framework-level skills (.agent/skills). Added Superpower column to MASTER_BRAIN.md and mandated skill usage in GLOBAL_RULES.md. This ensures that expert personas always use the most rigorous tools (TDD, Systematic Debugging, Pathfinder) for their respective domains.

---

### 🎓 Learning: Consolidated AI Intelligence Hub
**Date**: 2026-05-12 00:51:01
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Review if root directory structure is reorganized
**Insight**:
Merged ai-maintenance, ai-memory, and ai-prompts into ai-agents/ for a unified intelligence architecture.

---

### 🎓 Learning: Hardened V2 AI Workflow
**Date**: 2026-05-12 01:14:00
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Review after 2 sprints — validate that 9-phase loop is not over-engineered for team size
**Insight**:
Implemented Phase 0 ambiguity hard stop, WIP_MANIFEST.md for cross-domain collision prevention, ASSUMPTIONS.md for surfacing hidden agent assumptions, feedback.md with Recurrence field for pattern detection, and tiered T1/T2/T3 verification with an explicit T3 trigger (first Play Store crash that T1/T2 passed). Devil's Advocate sub-step added to Hard Rigor Protocol. All continuous-learning entries now carry version, domain, and expiry metadata.

---

### 🎓 Learning: Hardened V2 AI Workflow Implemented
**Date**: 2026-05-12 01:17:45
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Review after 2 sprints to validate workflow overhead is justified for team size
**Insight**:
Phase 0 ambiguity hard stop, WIP_MANIFEST.md, ASSUMPTIONS.md, feedback.md with Recurrence field, T1/T2/T3 tiered verification, Devil's Advocate sub-step, and expiry metadata on all KB entries.


---

### 🎓 Learning: Anti-Entropy Hardening for AI Ecosystem
**Date**: 2026-05-12 01:20:54
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Permanent
**Insight**:
Four entropy fixes applied: (1) AGENTS.md bootstrap instruction added verbatim — non-negotiable read of MASTER_BRAIN.md before any action; (2) learn.sh now fails loudly if expiry arg is empty or TODO; (3) Phase 7 WIP_MANIFEST clearing rule added — uncleared Active entries are lies the next agent will trust; (4) feedback.md Recurrence threshold lowered to 2 with mandatory GitHub Issue labeled ai-regression.


---

### 🎓 Learning: gh CLI Not Available — PENDING_ISSUES.md Fallback
**Date**: 2026-05-12 01:23:04
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Permanent — re-verify if gh is installed in future CI environment
**Insight**:
gh is not installed in this repo environment. The Recurrence >= 2 mandate now writes to ai-agents/PENDING_ISSUES.md instead of using gh issue create. Phase 0 now reads ASSUMPTIONS.md and feedback.md before the 5W clarification, making historical context load-bearing at the earliest point. Never assume gh, jq, or other optional CLI tools are available without verifying first.


---

### 🎓 Learning: Every Hard Constraint Reveals One Implicit Assumption
**Date**: 2026-05-12 01:25:40
**Version**: 1.0 | **Domain**: System | **Expiry Hint**: Permanent
**Insight**:
The pattern observed across the entire Hardened V2 session: adding the ambiguity stop revealed the AGENTS.md bootstrap gap; adding the Recurrence threshold revealed the gh CLI dependency; adding PENDING_ISSUES.md revealed the sprint ritual gap. This is not a bug — it is the process working. Each constraint surfaces the next hidden assumption rather than burying it. When you add a hard rule and something feels slightly wrong immediately after, look for the assumption it just exposed.


---

### 🎓 Learning: posthog-js maskInputFn signature is HTMLElement | undefined
**Date**: 2026-05-12 01:58:05
**Version**: 1.0 | **Domain**: Frontend/Analytics | **Expiry Hint**: Review if posthog-js major version is upgraded
**Insight**:
posthog-js's maskInputFn type signature uses 'element?: HTMLElement' (not 'Element | null'). Always check the SDK's actual TypeScript types before writing custom callbacks — the PostHog docs show a different signature than what the installed version exports.


---

### 🎓 Learning: Stale backend/node_modules/* lockfile entries silently block overrides
**Date**: 2026-05-12 02:20:03
**Version**: 1.0 | **Domain**: Pipeline/Security | **Expiry Hint**: Permanent — re-verify if monorepo structure changes
**Insight**:
In a monorepo, if backend ever had its own separate install, stale 'backend/node_modules/*' entries get frozen in the root package-lock.json. npm workspace installs do NOT evict them — overrides in workspace package.json are ignored for these frozen entries. Fix: use a Node script to delete all 'backend/node_modules/*' keys from package-lock.json packages map, then run npm install from root to re-resolve cleanly.


---

### 🎓 Learning: Postman Sync
**Date**: 2026-05-12 15:03:40
**Version**: 1.0 | **Domain**: API/Verification | **Expiry Hint**: Permanent
**Insight**:
Synchronized Collection with true backend routes and added /_dev/last-otp helper for local testing.


---

### 🎓 Learning: Express 5 Wildcard Compatibility
**Date**: 2026-05-12 18:07:42
**Version**: 1.0 | **Domain**: Backend | **Expiry Hint**: Permanent
**Insight**:
Express 5 uses path-to-regexp v8 which requires named parameters (/:path*) or RegExp for wildcards; '*' is no longer supported.


---

### 🎓 Learning: Fixing Phantom Dependencies in Backend
**Date**: 2026-05-12 18:21:10
**Version**: 1.0 | **Domain**: Backend | **Expiry Hint**: Keep for 1 month
**Insight**:
Direct dependencies in workspaces must be explicitly present in node_modules even if they exist as nested dependencies elsewhere. Forced installation with --workspace resolves hoisting gaps.


---

### 🎓 Learning: Pino/Pino-HTTP Initialization Fix
**Date**: 2026-05-12 22:17:10
**Version**: 1.0 | **Domain**: Frontend | **Expiry Hint**: Never
**Insight**:
Next.js 15 requires handling ESM default exports for pino and pino-http when using eval('require'). Also, pino-http crashes if passed a non-pino logger, requiring metadata symbol tagging.


---

### 🎓 Learning: Mobile-First Royal Visual Retrofit
**Date**: 2026-05-12 22:31:00
**Version**: 1.0 | **Domain**: UI/UX | **Expiry Hint**: Review after Dashboard v2 feedback
**Insight**:
Completed Phase 1 of UI Rampup: synchronized viewport themeColor with Royal Obsidian, retrofitted Global Bottom Navigation to Gold/Obsidian, and updated Dashboard swipe actions to Royal palette. Forced dark mode globally to prevent white flashes.


---

### 🎓 Learning: Modern Royal UI Stabilization
**Date**: 2026-05-12 22:56:33
**Version**: 1.0 | **Domain**: Frontend/UX | **Expiry Hint**: Never
**Insight**:
UI hangs in Next.js can be caused by hydration locks or module evaluation blocks in non-resilient services. Use global failsafe scripts in layout.tsx to force unblock the UI if initialization stalls.


---

### 🎓 Learning: Enterprise Product Blueprint
**Date**: 2026-05-12 23:03:04
**Version**: 1.0 | **Domain**: Product Strategy | **Expiry Hint**: 2026-12-31
**Insight**:
Consolidated product strategy into a 12-section enterprise-grade blueprint covering AI Matching, Freemium Monetization, and DPDP Compliance.


---

### 🎓 Learning: Royal Progressive Profiling
**Date**: 2026-05-12 23:10:10
**Version**: 1.0 | **Domain**: UI/UX | **Expiry Hint**: Stable
**Insight**:
Implemented a 5-step premium onboarding wizard with Obsidian/Gold styling, auto-save persistence, and mobile-first ergonomics. Replaced monolithic profile form.


---

### 🎓 Learning: Login UI Stability Fix
**Date**: 2026-05-12 23:23:06
**Version**: 1.0 | **Domain**: Frontend/UX | **Expiry Hint**: 2026-12-31
**Insight**:
Decoupled global isLoading from interactive auth actions to prevent component unmounting. Added GSAP animation fallbacks.


---

### 🎓 Learning: Playwright E2E Integration
**Date**: 2026-05-12 23:28:06
**Version**: 1.0 | **Domain**: Testing | **Expiry Hint**: None
**Insight**:
Implemented E2E scripts for Login journey using Page-agnostic selectors for GSAP compatibility.


---

### 🎓 Learning: Firebase env vars missing broke login
**Date**: 2026-05-12 23:51:03
**Version**: 1.0 | **Domain**: Auth/Testing | **Expiry Hint**: Permanent
**Insight**:
NEXT_PUBLIC_FIREBASE_* vars were absent from all .env files causing silent auth failure. Added guard in LoginForm and placeholders in .env.local.


---

### 🎓 Learning: Capacitor 7 Plugin Initialization Fix
**Date**: 2026-05-13 12:24:35
**Version**: 1.0 | **Domain**: Mobile/Android | **Expiry Hint**: Never
**Insight**:
Resolved 'null object reference' in @capacitor-firebase/authentication by upgrading to v7.0.0 (Capacitor 7 compatible) and adding 'phone' provider to plugins.FirebaseAuthentication.providers in capacitor.config.json. Reverted manual registration in MainActivity.java as v7 auto-registers correctly.


---

### 🎓 Learning: Fixing Backend React Runtime Error
**Date**: 2026-05-15 00:06:13
**Version**: 1.0 | **Domain**: Pipeline | **Expiry Hint**: Never
**Insight**:
Synchronized React and React-Email versions across monorepo to force hoisting to root and resolve MODULE_NOT_FOUND errors on Render.


---

### 🎓 Learning: MCP Config: serverUrl vs url
**Date**: 2026-05-15 00:49:10
**Version**: 1.0 | **Domain**: System/Tooling | **Expiry Hint**: Permanent
**Insight**:
Antigravity uses 'serverUrl' (not 'url') for hosted MCP servers. Using 'url' causes the 'render: serverURL or command must be specified' error, especially when migrating configs from Cursor or Windsurf.


---

### 🎓 Learning: Post-Merge Monitoring
**Date**: 2026-05-15 01:10:13
**Version**: 1.0 | **Domain**: Pipeline/DevOps | **Expiry Hint**: Permanent
**Insight**:
Formalized a protocol for verifying Vercel/Render status after every merge to main.


---

### 🎓 Learning: Android ProGuard Patch
**Date**: 2026-05-15 01:22:31
**Version**: 1.0 | **Domain**: Mobile/Android | **Expiry Hint**: Permanent
**Insight**:
Implemented patch-package to persist proguard-android-optimize.txt fix in @capacitor-firebase/authentication node_modules.


---

### 🎓 Learning: Firebase Phone Auth Testing
**Date**: 2026-05-15 08:51:38
**Version**: 1.0 | **Domain**: Mobile/Auth | **Expiry Hint**: Permanent
**Insight**:
Disabling app verification in both Web and Native SDKs is mandatory for test numbers to bypass real SMS OTPs.

