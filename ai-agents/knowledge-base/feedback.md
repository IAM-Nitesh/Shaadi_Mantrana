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

### [2026-05-15] [System] Render MCP server returns "Bad Request"
- **Task**: Check deployment status
- **Finding**: All tools prefixed with `mcp_render_` return "Bad Request" (standalone SSE stream closed). Handshake fails despite valid-looking configuration in `mcp_config.json`.
- **Action Taken**: Verified production health via direct HTTPS requests (`/health` endpoint); backend is healthy. Documented assumption in `ASSUMPTIONS.md`.
- **Recurrence**: 1
- **Pattern?**: No


---

## Resolved / Escalated to Knowledge Base

<!-- Move entries here once Action Taken is verified complete -->

### [2026-05-12] [Backend] Local Verification Blocked by Environmental Restrictions
- **Task**: Backend Server and API Verification
- **Finding**: Local environment is missing critical dependencies (mongodb, @babel/preset-react) and cannot run 'npm install' due to network isolation. Sandbox also blocks local DB connectivity (EPERM).
- **Action Taken**: Verified Production environment via browser subagent; Production is 100% healthy.
- **Recurrence**: 1
- **Pattern?**: No

### [2026-05-17] [QA/E2E] Do not claim green before exact-suite verification
- **Task**: Review and stabilize Shaadi Mantrana Playwright BDD E2E suite
- **Finding**: Human review correctly rejected language like "Green State", "fact-checked", and "perfectly synchronized" when the last known evidence still showed failures and only partial browser validation.
- **Action Taken**: Re-ran the exact `npm run test:e2e:bdd` script outside the browser sandbox; verified 14 passed across Chromium and WebKit with successful MongoDB test-data cleanup. Final status now distinguishes script/harness fixes from application-flow fixes and uses command output as the source of truth.
- **Recurrence**: 2
- **Pattern?**: Yes — appended to `PENDING_ISSUES.md` for human conversion into an `ai-regression` issue.

### [2026-05-24] [Dependency] Root workspace overrides used for transitive security fixes
- **Task**: Remediate monorepo vulnerability alerts and maintain safe dependency versions
- **Finding**: Some vulnerabilities were only patchable through root workspace `package.json` overrides because the affected packages were transitive dependencies in multiple subprojects.
- **Action Taken**: Applied root `overrides` for safe release versions; verified with `npm audit` and monorepo workspace builds; documented the decision in `ai-agents/knowledge-base/dependency-fixes.md`.
- **Recurrence**: 1
- **Pattern?**: No
