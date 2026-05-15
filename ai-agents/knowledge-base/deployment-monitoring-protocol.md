# 🚀 Post-Merge Deployment Monitoring Protocol

> **Purpose**: To ensure that every merge to `main` results in a stable production environment. This protocol bridges the gap between a successful PR merge and a healthy live service.

---

## 🛠️ THE LOOP (Mandatory Post-Merge)

Immediately after any merge to `main`, the acting AI agent MUST execute these steps:

### 1. Backend Verification (Render)
- **Action**: Use `mcp_render_list_deploys` for the backend service.
- **Goal**: Confirm the latest deploy status is `live`.
- **Fail Condition**: If status is `failed` or `pre_deploy_failed`.
- **Next Step**: Fetch logs via `mcp_render_list_logs` with `type: ["build"]`.

### 2. Frontend Verification (Vercel)
- **Action**: Use Vercel MCP tools (e.g., `list_deployments`).
- **Goal**: Confirm the latest deployment for the production domain is `READY`.
- **Fail Condition**: If status is `ERROR` or `CANCELED`.
- **Next Step**: Fetch logs using Vercel MCP log tools.

### 3. Analysis & Remediation
- **Consult**: Cross-reference errors with `ai-agents/knowledge-base/ci-failure-patterns.md`.
- **Diagnose**: Identify if it's a code regression, dependency mismatch, or environment issue.
- **Fix**: Propose and implement a surgical fix immediately.

---

## 🚦 Acceptance Criteria
- [ ] Backend is `live`.
- [ ] Frontend is `READY`.
- [ ] Smoke test passes (e.g., `/health` endpoint for backend, homepage for frontend).

---

## 📂 Related Files
- `ai-agents/knowledge-base/mcp-infrastructure.md`: For MCP setup and rationale.
- `ai-agents/knowledge-base/ci-failure-patterns.md`: For troubleshooting known issues.
- `ai-agents/MASTER_BRAIN.md`: For orchestration logic.
