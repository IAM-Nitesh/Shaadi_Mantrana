# 🛠️ MCP Infrastructure Guide

> **Purpose**: This guide documents the setup and technical rationale for MCP (Model Context Protocol) servers used in Shaadi Mantrana, specifically Render and Vercel.

---

## 🚀 First Launch Setup

After configuring `mcp_config.json` at the root, follow these steps to activate the servers:

1. **Save & Restart**: Save the configuration file and restart your AI tool (e.g., Antigravity).
2. **Authorize Vercel**:
   - Go to `…` → `MCP Servers` → click `vercel`.
   - A browser window will open asking to authorize Vercel access.
   - Click **Allow**.
3. **Verification**: Confirm that tools prefixed with `mcp_render_` and `mcp_vercel_` are available in your toolset.

---

## 🔍 Technical Rationale: Why `mcp-remote`?

You will notice that the Vercel configuration uses `mcp-remote` instead of a direct `serverUrl`:

```json
"vercel": {
  "serverUrl": "https://mcp.vercel.com"
}
```

### The "Direct" Advantage
Antigravity (and other tools based on Gemini Code Assist) can often handle OAuth handshakes directly when provided with a bare `serverUrl`. This is the preferred method over `mcp-remote` because:
- It avoids local port binding restrictions (`EPERM`).
- It uses the tool's native browser-based authorization flow.
- It reduces configuration complexity.

### 📁 Source of Truth: Global Config
In Antigravity, the **primary source of truth** for MCP servers is the global configuration file:
👉 `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`

If changes are made to the project-root `mcp_config.json`, they MUST be synced to this global file and the session must be refreshed for the tools to activate.

---

## 📂 Related Files
- `mcp_config.json`: Local configuration for MCP servers.
- `ai-agents/knowledge-base/deployment-monitoring-protocol.md`: Post-merge verification steps.
