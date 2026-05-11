# 📋 ASSUMPTION REGISTER

> **Purpose**: Any time an AI agent operates under an assumption (because a hard stop isn't warranted but uncertainty exists), that assumption MUST be written here. If a later agent finds a conflict, it raises a flag rather than silently overwriting. Assumptions decay: `undocumented` → `documented` → `validated` or `rejected`.
>
> **Rule**: If you made an assumption during a task and did NOT write it here, the task is not complete.

---

## Format

```
### [YYYY-MM-DD] [Domain] Short description of assumption
- **Task**: What was being implemented
- **Assumption**: The exact assumption made
- **Risk if wrong**: What breaks
- **Status**: `undocumented` | `documented` | `validated` | `rejected`
- **Validated by**: (human review / test / deploy)
```

---

## Active Assumptions

### [2026-05-12] [System] Initial AI OS architecture is correct for a solo/small-team monorepo
- **Task**: Designing the Master Brain and AI Agent ecosystem
- **Assumption**: A 7→9 phase dispatcher loop is not over-engineered for a Next.js 15 + Capacitor monorepo with one primary developer
- **Risk if wrong**: Workflow overhead outweighs benefit, agents skip phases under time pressure
- **Status**: `documented`
- **Validated by**: Pending — revisit after 2 sprints

### [2026-05-12] [Mobile] Capacitor static export is compatible with all current Next.js 15 features in use
- **Task**: Mobile deployment pipeline
- **Assumption**: No App Router features in the current codebase are incompatible with `output: 'export'`
- **Risk if wrong**: Silent Capacitor build breakage on native device after a Next.js 15 minor upgrade
- **Status**: `documented`
- **Validated by**: Pending — T2 contract test required

### [2026-05-12] [System] PENDING_ISSUES.md requires a human processing ritual
- **Task**: Anti-entropy hardening — gh CLI fallback
- **Assumption**: A human will regularly check `ai-agents/PENDING_ISSUES.md` and convert entries to GitHub Issues
- **Risk if wrong**: The file fills silently — no better than a Slack comment. Recurrence signals never become Issues.
- **Status**: `documented`
- **Validated by**: Pending — needs an explicit sprint ritual (e.g., "check PENDING_ISSUES.md at sprint start")


<!-- Move validated/rejected entries here to keep Active section clean -->
