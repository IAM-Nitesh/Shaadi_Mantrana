# Secrets Sanitization & Security Gate Clearance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sanitize hardcoded Vercel and Render API tokens in scripts and documentation files, rewrite/amend the commit history to purge the secrets, and push successfully to clear the GitHub Push Protection rule.

**Architecture:** We will replace the inline API keys/tokens in `scripts/check-status.js` with dynamic environment variables and graceful fallback logic. We will replace the hardcoded token strings in `docs/superpowers/plans/2026-05-17-mcp-troubleshooting.md` with generic placeholders. Finally, we will use Git to amend the latest commit and push the updated branch.

**Tech Stack:** JavaScript, Bash, Git.

---

### Task 1: Sanitize check-status.js Script

**Files:**
- Modify: `scripts/check-status.js`

- [ ] **Step 1: Update scripts/check-status.js to remove hardcoded keys**

Modify the top of the file to retrieve keys from environment variables and add clear logs notifying the user if they are missing. Also, add guards to skip the respective status checks if keys are not configured.

Replace lines 3-4 and add conditional checks in both status fetch functions:
```javascript
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!RENDER_API_KEY && !VERCEL_TOKEN) {
  console.log('⚠️ Warning: Neither RENDER_API_KEY nor VERCEL_TOKEN environment variables are set.');
  console.log('To run this status check, please set them in your environment, e.g.:');
  console.log('  export RENDER_API_KEY="your_render_api_key"');
  console.log('  export VERCEL_TOKEN="your_vercel_token"\n');
}
```

And in `fetchRenderStatus()`:
```javascript
async function fetchRenderStatus() {
  console.log('\n🔮 Fetching Render Deployment Status...');
  if (!RENDER_API_KEY) {
    console.log('⚠️ Skipping Render status check: RENDER_API_KEY is not set.');
    return;
  }
  try {
...
```

And in `fetchVercelStatus()`:
```javascript
async function fetchVercelStatus() {
  console.log('\n⚡ Fetching Vercel Deployment Status...');
  if (!VERCEL_TOKEN) {
    console.log('⚠️ Skipping Vercel status check: VERCEL_TOKEN is not set.');
    return;
  }
  try {
...
```

- [ ] **Step 2: Dry run the sanitized script**

Run the script locally without any environment variables set to verify it exits gracefully and lists correct instructions.
Run:
```bash
node scripts/check-status.js
```
Expected: The console logs warning instructions and skips both checks cleanly without throwing network/auth exceptions.

---

### Task 2: Sanitize Documentation File

**Files:**
- Modify: `docs/superpowers/plans/2026-05-17-mcp-troubleshooting.md`

- [ ] **Step 1: Replace sensitive token strings in documentation with placeholders**

Locate and replace the Vercel and Render keys with generic placeholders in `docs/superpowers/plans/2026-05-17-mcp-troubleshooting.md`.

Replace line 64:
```markdown
export RENDER_API_KEY="<your_render_api_key_starting_with_rnd>"
```

Replace line 102:
```markdown
export VERCEL_TOKEN="<your_vercel_token_starting_with_vcp>"
```

---

### Task 3: Rewrite Git Commit History & Clear Security Gate

**Files:**
- Modify: Git commit history (`HEAD` / commit `2ed518bccdfd892674c967d3e3b9325e7c05c2c3`)

- [ ] **Step 1: Commit and amend changes to HEAD**

Stage the modified files and amend the previous commit so that the credentials are not preserved in the git commit history.
Run:
```bash
git add scripts/check-status.js docs/superpowers/plans/2026-05-17-mcp-troubleshooting.md
git commit --amend --no-edit
```
Expected: Commit successfully amended with the same message, completely replacing commit `2ed518bccdfd892674c967d3e3b9325e7c05c2c3`.

- [ ] **Step 2: Verify git status and check the revised diff**

Verify that `git diff HEAD~1` does not show any plain-text secrets in the amended commit.
Run:
```bash
git diff HEAD~1
```
Expected: No strings matching `rnd_...` or `vcp_...` are present in the diff or commit metadata.

---

### Task 4: Push Branch and Complete E2E Validation

**Files:**
- Push: `feat/login-flow-analysis` to remote

- [ ] **Step 1: Execute Git Push**

Attempt to push the sanitized branch to `origin`.
Run:
```bash
git push --force-with-lease
```
Expected: Git push completes successfully without being rejected by GitHub Push Protection.

- [ ] **Step 2: Confirm Remote Push Success**

Check Git remote feedback and verify branch push is accepted.
