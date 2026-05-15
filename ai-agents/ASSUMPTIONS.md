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

### [2026-05-12] [Testing] Playwright requires external network for initial browser setup
- **Task**: Implementing Playwright E2E tests
- **Assumption**: The user has local network access to run `npx playwright install` which is currently blocked in the sandbox environment.
- **Risk if wrong**: Tests will fail to run even with the scripts present.
- **Status**: `documented`
- **Validated by**: Pending - User manual execution required.

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

### [2026-05-12] [Backend] Symlinking hoisted dependencies is a stable workaround for network isolation
- **Task**: Resolving missing `mongodb` module in restricted environment
- **Assumption**: Symlinking modules from `node_modules/mongoose/node_modules/mongodb` to `node_modules/mongodb` (root) is sufficient for all internal service imports.
- **Risk if wrong**: Other services requiring `mongodb` but expecting a different version or location might fail if not also symlinked.
- **Status**: `documented`
- **Validated by**: Successful backend startup in `static` mode.


### [2026-05-12] [Product] Freemium model is the primary revenue driver
- **Task**: Strategic Blueprinting
- **Assumption**: A freemium model (limited interests, pay to unlock chat) is more viable for urban professionals than a credit-based model.
- **Risk if wrong**: Revenue may stall if the free tier is too generous or if users prefer granular credit purchases.
- **Status**: `documented`
- **Validated by**: Pending - A/B testing framework required.

### [2026-05-12] [Trust] Automation-First moderation is scalable without compromising safety
- **Task**: Strategic Blueprinting
- **Assumption**: AI can accurately flag 90%+ of high-risk anomalies, allowing the platform to scale without a linear increase in human moderators.
- **Risk if wrong**: High-risk profiles may leak into the "Active" pool, damaging brand trust.
- **Status**: `documented`
- **Validated by**: Pending - AI confidence scoring audit required.

### [2026-05-12] [Legal] DPDP compliance is the mandatory data framework
- **Task**: Strategic Blueprinting
- **Assumption**: Designing specifically for India's Digital Personal Data Protection Act (DPDP) will cover 95% of international GDPR-style requirements.
- **Risk if wrong**: Regional legal nuances (e.g., UAE or US-specific laws) might require refactoring.
- **Status**: `documented`
- **Validated by**: Pending - Legal review.
### [2026-05-15] [System] mcp_config.json belongs in the workspace root
- **Task**: Resolving MCP initialization errors
- **Assumption**: The user's tool (e.g. Antigravity/Claude Code) expects mcp_config.json at the root of the monorepo, and placeholders for API keys will be filled by the user.
- **Risk if wrong**: Config might be ignored if the tool expects it elsewhere (like ~/.claude/).
- **Status**: `documented`
- **Validated by**: Pending - User confirmation.
