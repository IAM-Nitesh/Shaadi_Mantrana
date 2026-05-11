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
| Pipeline | `.github/workflows/security-audit.yml` (actions/cache added) | 2026-05-12 |
| Mobile | `android/build.gradle` + `android/app/build.gradle` (Firebase Crashlytics) | 2026-05-13 — requires `google-services.json` + `npx cap sync android` |
| Frontend | `frontend/src/components/PostHogProvider.tsx` + `layout.tsx` (PostHog) | 2026-05-12 — requires `NEXT_PUBLIC_POSTHOG_KEY` env var in Vercel |

---

## Recently Stabilized (Last 14 Days)

| Domain | Interface / File | Stabilized On | Notes |
| :--- | :--- | :--- | :--- |
| System | `ai-agents/MASTER_BRAIN.md` | 2026-05-12 | Hardened V2 workflow implemented |
| System | `ai-agents/GLOBAL_RULES.md` | 2026-05-12 | Superpower Integration section added |

---

> **Conflict Protocol**: If you are about to modify an interface listed as "Active WIP" by another domain, STOP. Surface the conflict to the human before proceeding. Do not silently overwrite.
