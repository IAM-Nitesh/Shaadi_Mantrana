# Antigravity MCP Server Troubleshooting and Stabilization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the `context canceled` connection errors for Render and Vercel MCP servers in Antigravity.

**Architecture:** Sequentially isolate each MCP server, verify authentication and reachability, clear stale Antigravity cache files, transition from inline tokens to environment variable references to protect credentials, validate configuration integrity, and apply optimized timeout and connection configurations.

**Tech Stack:** JSON, Zsh, Antigravity global configuration, environment variables.

---

### Task 1: Clean Cache & Verify Endpoint Reachability

**Files:**
- Modify: None
- Verify: Reachability of MCP endpoints and deletion of any stale cache directories.

- [ ] **Step 1: Verify Cache Cleanup Commands**

Wipe out cache/mcp-cache directories in the home directory or app data.

Run:
```bash
rm -rf ~/.antigravity/cache ~/.antigravity/mcp-cache
```

Expected: Cleans any stale cache files.

- [ ] **Step 2: Confirm Endpoints Reachability via Model Proxy**

Run reachability tests through model proxy (we did this synchronously, verifying that `mcp.render.com` returned 202 and `mcp.vercel.com` returned 401, confirming they are reachable online).

---

### Task 2: Isolate and Verify Render MCP Server

**Files:**
- Modify: `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`
- Verify: Keep only Render enabled, test with user's RENDER_API_KEY.

- [ ] **Step 1: Modify Global Configuration to Isolate Render**

Update the active global config `/Users/niteshkumar/.gemini/antigravity/mcp_config.json` to keep only the `render` service and switch it to environment variable reference `${RENDER_API_KEY}`.

Write this exact JSON content to `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`:
```json
{
  "mcpServers": {
    "render": {
      "serverUrl": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer ${RENDER_API_KEY}"
      }
    }
  }
}
```

- [ ] **Step 2: Instruct user to export RENDER_API_KEY and restart**

Ask the user to execute the following in their shell before restarting Antigravity:
```bash
export RENDER_API_KEY="<your_render_api_key_starting_with_rnd>"
```
Then ask the user to fully restart the IDE to apply the environment variables and clean cache.

- [ ] **Step 3: Test Render MCP Independently**

Ask the user to test the `List Render services` tool or a similar command to verify that Render works alone.

---

### Task 3: Isolate and Verify Vercel MCP Server

**Files:**
- Modify: `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`
- Verify: Keep only Vercel enabled, test with user's VERCEL_TOKEN.

- [ ] **Step 1: Modify Global Configuration to Isolate Vercel**

Update the active global config `/Users/niteshkumar/.gemini/antigravity/mcp_config.json` to keep only the `vercel` service and switch it to environment variable reference `${VERCEL_TOKEN}`.

Write this exact JSON content to `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`:
```json
{
  "mcpServers": {
    "vercel": {
      "serverUrl": "https://mcp.vercel.com",
      "headers": {
        "Authorization": "Bearer ${VERCEL_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 2: Instruct user to export VERCEL_TOKEN and restart**

Ask the user to execute the following in their shell before restarting Antigravity:
```bash
export VERCEL_TOKEN="<your_vercel_token_starting_with_vcp>"
```
Then ask the user to fully restart the IDE.

- [ ] **Step 3: Test Vercel MCP Independently**

Ask the user to test the Vercel list deployments command to verify that Vercel works alone.

---

### Task 4: Apply Unified Stable Configuration with Stability Tuning

**Files:**
- Modify: `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`
- Modify: `/Users/niteshkumar/Downloads/Shaadi_Mantrana/mcp_config.json`
- Verify: Both servers configured using environment variables, adding stability timeouts if supported.

- [ ] **Step 1: Apply Unified stable configuration to global and root files**

Write the exact combined config to both files.

Write to `/Users/niteshkumar/.gemini/antigravity/mcp_config.json`:
```json
{
  "mcpServers": {
    "render": {
      "serverUrl": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer ${RENDER_API_KEY}"
      }
    },
    "vercel": {
      "serverUrl": "https://mcp.vercel.com",
      "headers": {
        "Authorization": "Bearer ${VERCEL_TOKEN}"
      }
    }
  }
}
```

Write to `/Users/niteshkumar/Downloads/Shaadi_Mantrana/mcp_config.json`:
```json
{
  "mcpServers": {
    "render": {
      "serverUrl": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer ${RENDER_API_KEY}"
      }
    },
    "vercel": {
      "serverUrl": "https://mcp.vercel.com",
      "headers": {
        "Authorization": "Bearer ${VERCEL_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 2: Final Verification checklist**

Run preflight scripts and check overall status:
1. Ensure both configurations are valid JSON.
2. Confirm the tokens are stored securely in environment variables rather than hardcoded in source control.
