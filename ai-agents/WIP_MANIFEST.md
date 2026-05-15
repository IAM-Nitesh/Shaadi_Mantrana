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
| **⚠️ STANDING** | **Check `ai-agents/PENDING_ISSUES.md` before opening new work this sprint** | Never — permanent standing reminder |
| Mobile | `android/build.gradle` + `android/app/build.gradle` (Firebase Crashlytics) | 2026-05-13 — requires Android Studio release build + Play Console upload |
| UI | `frontend/src/` (Comprehensive UI Revamp) | 2026-05-15 — brainstorming and design phase starting |
| Product | `docs/superpowers/specs/2026-05-12-shaadi-mantrana-product-blueprint.md` | 2026-05-12 — Strategic baseline established |
| Mobile | `node_modules/@capacitor-firebase/authentication` ProGuard Patch | 2026-05-15 | Persisted fix for AGP 9+ compatibility |
| System | `personas/qa.md` (SDET Persona) | 2026-05-15 | Updated for Playwright and business validation focus |
| UI | Royal Loading System (Mandala + Skeletons) | 2026-05-16 | Completed: Integrated Sacred Mandala & Royal Skeletons across Guards |
| Testing | BDD + Allure Integration | 2026-05-15 | playwright-bdd + allure-playwright setup; feature files in flight |
| System | Auth Flow Analysis & Backend Stabilization | 2026-05-16 | Analyzing login use cases; fixing Express 5 path-to-regexp crash |


---

## Recently Stabilized (Last 14 Days)

| Domain | Interface / File | Stabilized On | Notes |
| :--- | :--- | :--- | :--- |
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
| Frontend | Global Shell (Layout + Nav + CSS) | 2026-05-12 | Modern Royal visual retrofit complete; viewport themeColor synced |

---

> **Conflict Protocol**: If you are about to modify an interface listed as "Active WIP" by another domain, STOP. Surface the conflict to the human before proceeding. Do not silently overwrite.
