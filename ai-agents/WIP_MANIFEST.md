# 🚧 WIP MANIFEST — Cross-Domain Work In Progress

> **Purpose**: This is the highest-risk gap in a Next.js 15 + Capacitor monorepo. Two agents (or two sessions) touching shared types or the Capacitor config in the same sprint without awareness of each other is the most dangerous failure mode — not a bad plan.
>
> **Rule**: Read this file at **Phase 2** of every task. Update it at **Phase 7** (after learning codification). Keep it ruthlessly minimal: three fields only.
>
> **Format**: `Domain | Interface in Flight | Expected Stabilization Date`

---

## Active WIP

| Domain | Interface / File in Flight | Expected Stable By |
| :--- | :--- | :--- |
| **⚠️ STANDING** | **Check `ai-agents/PENDING_ISSUES.md` before opening new work this sprint** | Never — permanent reminder |
| Mobile | `android/build.gradle` + `android/app/build.gradle` (Firebase Crashlytics) | 2026-05-13 — requires Android Studio release build + Play Console upload |
| UI | `frontend/src/` (Comprehensive UI Revamp) | 2026-05-15 — brainstorming and design phase starting |
| Product | `docs/superpowers/specs/2026-05-12-shaadi-mantrana-product-blueprint.md` | 2026-05-12 — Strategic baseline established |
| Mobile | `node_modules/@capacitor-firebase/authentication` ProGuard Patch | 2026-05-15 | Persisted fix for AGP 9+ compatibility |
| System | `personas/qa.md` (SDET Persona) | 2026-05-15 | Updated for Playwright and business validation focus |
| System | AuthGuardV2 & AuthContext Stabilization | 2026-05-16 | **STABILIZED**: Derived auth state from server cookies; eliminated localStorage hacks and 3s unblock timers; fixed backend JSX crash; implemented high-fidelity fallback states. |
| Testing | Automated Cleanup Infrastructure | 2026-05-16 | **COMPLETE**: Integrated `global-teardown.ts` and `cleanup-test-data.js` into Playwright suite |


---

## Recently Stabilized (Last 14 Days)

| Domain | Interface / File | Stabilized On | Notes |
| :--- | :--- | :--- | :--- |
| Testing | BDD E2E Phone Invitation & Data Safety | 2026-05-23 | **COMPLETE**: Added feature spec and step definitions validating phone invitations & Data Safety UI changes. |
| UI/Backend | Data Safety, Photo Moderation & Invitation Uniqueness | 2026-05-23 | **STABILIZED**: Revamped /admin/data-safety page, contact fallbacks on /admin/moderation, unique phone invitations at both API validation & DB index levels. |
| Testing | `tests/playwright/` (Login Validation) | 2026-05-12 | Comprehensive E2E suite for Phone/OTP journey + UI Debug mode |
| Frontend | Login UI Persistence | 2026-05-12 | Fixed vanishing form by decoupling interactive actions from global isLoading |
| Strategic | Product Blueprint | 2026-05-12 | Strategic planning phase finalized and documented |
| Frontend | `layout.tsx` (Global Failsafe) | 2026-05-12 | Forced mount via global failsafe script + unblock timers |
| UI | Modern Royal Login Shell | 2026-05-12 | Obsidian/Gold theme stabilized; mobile-first ergonomics verified |
| UI | Royal Onboarding Wizard | 2026-05-12 | 5-step Progressive Profiling flow with auto-save & royal styling |
| System | `ai-agents/MASTER_BRAIN.md` | 2026-05-12 | Hardened V2 workflow implemented |
| System | `ai-agents/GLOBAL_RULES.md` | 2026-05-12 | Superpower Integration section added |
| Pipeline | `.github/workflows/security-audit.yml` | 2026-05-12 | actions/cache@v4 added; stale lockfile fixed (57 entries) |
| Frontend | `layout.tsx` (themeColor fix) | 2026-05-12 | Next.js 15 viewport export migration |
| Backend | `src/index.js` (Express 5 wildcards) | 2026-05-12 | path-to-regexp v8 catch-all fix |
| Backend | `src/services/databaseService.js` | 2026-05-12 | Resolved mongodb dependency via root symlink |
| Backend | `src/config/index.js` | 2026-05-12 | Dynamic DATA_SOURCE support added |
| Frontend | `PostHogProvider.tsx` + `layout.tsx` | 2026-05-12 | Session recording + JS exception capture; typescript moved to deps |
| Frontend | `src/utils/pino-logger.ts` | 2026-05-12 | Fixed pino/pino-http ESM initialization and fallback crash |
| Pipeline | Dependency Synchronization | 2026-05-15 | Synced React and React-Email versions to fix Render runtime errors |
| System | Render MCP Configuration | 2026-05-15 | Fixed 'serverURL or command must be specified' by switching 'url' to 'serverUrl' |
| System | Vercel & Render MCP Config | 2026-05-15 | **STABILIZED**: Verified Bearer auth for both; synced global config at `~/.gemini/antigravity/mcp_config.json`; integrated into Master Brain Watchdog. |
| System | `mcp-infrastructure.md` | 2026-05-15 | Codified setup steps and `mcp-remote` technical rationale |
| Branding | `branding/` + `scripts/` | 2026-05-16 | **STABILIZED**: Single Source of Truth (SSoT) implemented via `npm run branding:sync`. 30+ platform assets now managed automatically from one source. |
| Backend | Admin Phone Workflow | 2026-05-20 | **COMPLETE**: Phone-based user creation (E.164 validation), email hiding in admin UI, graceful profile picture fallback (404→200 default avatar). Backend tests created. Frontend component updates pending. |
| UI | **Royal Loading System** | 2026-05-16 | **STABILIZED**: 3-tier high-fidelity ecosystem (Grand, Skeleton, Spark) with 'Diamond Ring' architecture and zero-drift svgOrigin pinning. |
| Testing | E2E BDD Test Suite (Auth, Navigation, Matching/Chat, Onboarding) | 2026-05-17 | Exact `npm run test:e2e:bdd` verified 14 passed across Chromium and WebKit; global teardown cleaned test personas successfully. |
| System/Auth | Profile Type Definition Wizard Integration | 2026-05-17 | Resolved Next.js build block by adding hasCompletedWizard field to Profile interface; clean build compiled successfully. |
| System/Auth | User DB Schema & Auth Boundaries | 2026-05-17 | **STABILIZED**: Decoupled email requirements, added conditional schema validation triggers, deprecated legacy email controllers/routes, and updated test seeding. |
| System/Auth | Session DB Schema & Phone Login | 2026-05-17 | **STABILIZED**: Made email field optional in Session schema to prevent validation failures during phone-only logins. |
| Pipeline | Local Pre-Push E2E Gate | 2026-05-17 | **STABILIZED**: Removed CI workflows and integrated local git pre-push verification with 'npm run e2e'. |
| Pipeline | Firebase Dependency Synchronization | 2026-05-18 | **STABILIZED**: Synced Firebase SDK to v11.2.0 across root and frontend to resolve Vercel build issues and satisfy peer dependencies. |
| System/Auth | Phone Admin elevation, promote-to-admin Phone Query, config dotenv CWD path fix | 2026-05-18 | **STABILIZED**: Elevated the production phone-only admin account, upgraded promotion script to support phone-only queries, resolved config dotenv paths relative to __dirname for CWD-agnostic CLI execution, and documented Section 6 in the admin-playbook. |
| UI/UX | Admin Bottom Navigation Logout Overlay Visibility | 2026-05-18 | **STABILIZED**: Resolved issue where logout overlay displayed immediately on admin dashboard mount by adding style display none by default. |
| Testing | Admin E2E Playwright Suite | 2026-05-19 | **STABILIZED**: Reached 50/50 passing state. Resolved regex step conflicts, configured Playwright bypass for Firebase OTPs, injected `/api/admin/users` and `/api/auth/status` mocks, fixed WebKit timeout flakes (`domcontentloaded`), and resolved Next.js `trailingSlash` auth guard redirect bug. |
| UI/Backend | Phone Invitations & Admin URIs | 2026-05-23 | **STABILIZED**: Renamed email-invitations to phone-invitations in frontend Next.js routing, updated navigation links, made email optional and added phoneNumber in Invitation schema, mapped phoneNumber and uuid in GET /invitations API response, and resolved admin test navigation race conditions. |

---

> **Conflict Protocol**: If you are about to modify an interface listed as "Active WIP" by another domain, STOP. Surface the conflict to the human before proceeding. Do not silently overwrite.
