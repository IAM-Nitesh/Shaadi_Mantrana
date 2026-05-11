# 🔁 FEEDBACK STORE

> **Purpose**: Human review findings MUST be written here in structured form — not left as Slack comments or verbal notes. The AI reads this store at **Phase 2** of the next relevant task in the same domain. This closes the most critical gap in the original workflow: the AI never learns from what humans noticed.
>
> **Recurrence field**: A count, not a boolean. A finding that appears once is a one-off. A finding that appears 3+ times is a pattern — and a pattern is a Phase 9 ecosystem health signal.

---

## Format

```
### [YYYY-MM-DD] [Domain] Short description of finding
- **Task**: What was being reviewed
- **Finding**: What the human noticed
- **Action Taken**: What changed as a result
- **Recurrence**: 1 (first time) | N (Nth time this pattern appeared)
- **Pattern?**: Flag if Recurrence >= 2 — see threshold rule below
```

> **Recurrence Threshold Rule**: If `Recurrence >= 2`, append the finding to `ai-agents/PENDING_ISSUES.md` before the session ends — do NOT use `gh issue create` (`gh` may not be installed). A human will convert the entry into a GitHub Issue labeled `ai-regression`. A reliable write beats an unreliable shell command.

---

## Active Findings

*(No findings yet — this store is initialized as part of the Hardened V2 workflow.)*

---

## Resolved / Escalated to Knowledge Base

<!-- Move entries here once Action Taken is verified complete -->
