# 🚨 PENDING AI REGRESSION ISSUES

> **Purpose**: When `feedback.md` records a finding with `Recurrence >= 2`, the agent MUST append an entry here before the session ends. A human processes this file and creates the GitHub Issue labeled `ai-regression`. This is the reliable fallback for environments without `gh` CLI.
>
> **Processing Rule**: When you create the GitHub Issue, strike through the entry here and add the Issue URL. Do not delete entries — they are an audit trail.
>
> **Agent Instruction**: Do not use `gh issue create`. Write here instead. A reliable write beats an unreliable shell command.

---

## Pending (Needs GitHub Issue)

### [2026-05-17] QA/E2E closure overclaimed green state before exact-suite verification
- **Feedback source**: `ai-agents/knowledge-base/feedback.md`
- **Pattern**: AI summaries repeatedly used completion language such as "Green State", "fact-checked", or "perfectly synchronized" before the exact `npm run test:e2e:bdd` command had passed.
- **Requested GitHub issue**: Add an `ai-regression` issue requiring QA closure summaries to include the exact command, browser/project scope, pass/fail count, and cleanup status before claiming green.

---

## Processed (Issue Created)

<!-- Format: ~~[YYYY-MM-DD] Description~~ → GitHub Issue #N: [URL] -->
