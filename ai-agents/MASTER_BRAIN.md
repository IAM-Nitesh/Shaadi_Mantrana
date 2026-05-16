# 🧠 SHAADI MANTRANA - MASTER BRAIN (Hardened V2)

> **Why this workflow exists**: This file is the first thing every AI agent reads. The 9-phase loop below was deliberately designed to be hard to simplify. Each phase closes a specific failure mode discovered in production: Phase 0 prevents hallucinating on ambiguous intent; Phase 2 includes a WIP Manifest check to prevent two sessions colliding on shared types in the Capacitor monorepo; Phase 5 requires a Devil's Advocate block before any commit to externalize hidden assumptions; Phase 6 uses tiered verification because a passing build does not mean correct behavior. Do not remove or merge phases because they look redundant — each one has a reason that only becomes visible when it fails.
>
> **The pattern this system is built on**: Every hard constraint added to a workflow reveals one implicit assumption that was previously invisible. The ambiguity stop revealed the AGENTS.md bootstrap gap. The Recurrence threshold revealed the `gh` CLI dependency. The `PENDING_ISSUES.md` fallback revealed the sprint ritual gap. This is not a bug in the process — it is the process working. Each iteration surfaces the next hidden assumption rather than burying it. The system is not perfect, but every imperfection is named, located in a file that gets read, and owned by a mechanism rather than human memory. That is what "systemically deterministic" looks like in practice.

---

## 🏗️ THE ORCHESTRATION MATRIX
When a task is received, the AI MUST route it through this matrix to invoke the correct context:

| Category | Persona to Invoke | Knowledge Base Focus | Superpower (Skill) |
| :--- | :--- | :--- | :--- |
| **Pipeline/Build/Push** | `personas/ci-engineer.md` | `knowledge-base/deployment-monitoring-protocol.md` | `deployment-readiness`, `verification-before-completion` |
| **UI/UX/Styles/GSAP** | `personas/premium-ui.md` | `knowledge-base/continuous-learning.md` | `ui-ux-pro-max`, `brainstorming` |
| **Database/API/Auth** | `personas/backend.md` | `knowledge-base/security-patterns.md` | `systematic-debugging`, `test-driven-development` |
| **Capacitor/Native/Android**| `personas/mobile.md` | `knowledge-base/mobile-builds.md` | `deployment-readiness`, `verification-before-completion` |
| **Verification/QA/E2E** | `personas/qa.md` | `knowledge-base/ci-failure-patterns.md` | `verification-before-completion`, `systematic-debugging` |
| **System Refactor/Structure**| `personas/architect.md` | `GLOBAL_RULES.md` | `pathfinder`, `make-plan`, `do` |

---

## 🚦 MANDATORY DISPATCHER LOOP (9 Phases)

### ⛔ Phase 0 — Ambiguity Hard Stop
**Before any clarification or action**, the agent MUST:
1. Read `ASSUMPTIONS.md` for any entries matching this domain — past assumptions are load-bearing context, not optional history.
2. Read `knowledge-base/feedback.md` for any recent human findings in this domain.

Then verify it can answer all five questions:
1. What exactly is the change?
2. Why now — what triggered this request?
3. Who (which users, services, or interfaces) does it affect?
4. What does success look like — what is the acceptance criterion?
5. What are we explicitly NOT doing?

If **any answer requires assumption**, STOP. Surface the question to the human. Do not proceed. This is the single highest-leverage anti-hallucination rule in this system.

### 🧬 Phase 1 — Domain Classification
Analyze the request. Determine the core domain. Route to the correct row in the Orchestration Matrix.

### 🦠 Phase 2 — Context Infiltration
1. Read the mapped **Persona** file.
2. Read the mapped **Knowledge Base** entries.
3. Activate the mapped **Superpower Skill**.
4. **Read `WIP_MANIFEST.md`** — check if any interface you plan to touch is already in flight. If yes, surface the conflict before proceeding.
5. Read `knowledge-base/feedback.md` for any recent human findings in this domain.
6. Declare: *"Adopted [Persona] mindset; Knowledge Base, WIP Manifest, and Feedback Store consulted."*

### 🔍 Phase 3 — Reconnaissance & Audit
- Request raw logs (CI logs, `npm audit`, browser console errors) before editing.
- Grep imports vs local `package.json` (Workspace Dependency Audit).
- Use `smart-explore` to map the specific functions involved.

### 📝 Phase 4 — Planning
For any task touching more than one file, create a formal plan via the `writing-plans` skill, saved to `docs/superpowers/plans/`.
- For **cross-domain changes**: label each plan step `High / Medium / Low` confidence. A `Low` confidence step triggers a mini-research loop before the plan is approved — not during execution.

### 💻 Phase 5 — Surgical Execution
- Write failing test first (`test-driven-development` skill).
- Implement minimal code to pass.
- **Devil's Advocate Block** (required before every commit): State in output — *"The most likely way this change is wrong is: [X]. The assumption I am most at risk of having made silently is: [Y]."* This is not optional commentary.
- Atomic commit.

### 🚦 Phase 6 — Tiered Verification
- **T1**: Unit tests pass + build passes (`./scripts/preflight.sh`).
- **T2**: No contract drift — shared interfaces/types match across workspaces.
- **T3**: Scenario library tests pass. *(Becomes mandatory on first Play Store crash report that T1/T2 passed. That is the explicit trigger — not a vague backlog item.)*
- The phrase "task complete" is **prohibited** until T1 and T2 clear.

### 🎓 Phase 7 — Knowledge Codification
1. Run `./scripts/learn.sh "Title" "Insight" "Domain" "Expiry Hint"` for new findings.
2. **Update `WIP_MANIFEST.md`**: Add new in-flight interfaces. **Archive any entry whose feature landed in this sprint** — move it to "Recently Stabilized." An uncleared Active entry is a lie the next agent will trust.
3. Write any new assumption to `ASSUMPTIONS.md`.
4. **Optimization Sweep**: Proactively scan the codebase for other instances of this pattern.

### 📬 Phase 8 — Feedback Store Update
If human review produced findings during this task, add them to `knowledge-base/feedback.md` using the structured format (Date, Domain, Task, Finding, Action Taken, Recurrence count). If `Recurrence >= 2`, append the finding to `PENDING_ISSUES.md` for human conversion to a GitHub Issue labeled `ai-regression`. Do NOT use `gh issue create` — `gh` may not be installed.

---

## 🛡️ HARD RIGOR PROTOCOL
To prevent regression and "Whack-a-Mole" fixes, the following are mandatory:
1. **Source of Truth**: Always request raw logs before the first edit. Never rely on internal version data if a live report is available.
2. **Workspace Isolation**: In monorepos, a root fix is a failure. Perform a Recursive Import Audit for every workspace involved.
3. **The Preflight Paradox**: FORBIDDEN from claiming a task is "fixed" until `./scripts/preflight.sh` passes.
4. **Surgical Integrity**: Every JSON/TS edit must be followed by a syntax check. If you touch a Proxy, verify `this` binding and TypeScript types immediately.
5. **Devil's Advocate**: Before every commit, externalize the most likely failure mode and the most dangerous silent assumption. This is a required output, not optional commentary.
6. **Deployment Watchdog**: Mandatory status check on Render and Vercel after every merge to `main` as per `deployment-monitoring-protocol.md`. Use `mcp_render_...` and `mcp_vercel_...` tools as the ONLY source of truth for production health.

---

## 📂 DIRECTORY STRUCTURE
- `MASTER_BRAIN.md`: This file. The orchestration layer.
- `GLOBAL_RULES.md`: Architectural guardrails.
- `ASSUMPTIONS.md`: Live register of agent assumptions — read and update every session.
- `WIP_MANIFEST.md`: Cross-domain work in flight — read at Phase 2, update at Phase 7.
- `personas/`: The specialized expert agents.
- `knowledge-base/`: Collective memory, failure patterns, feedback store.
- `knowledge-base/memory/`: Decision logs and current project state.
- `maintenance/`: System upkeep and context refresh.
- `prompts/`: Custom prompt templates.
- `system/`: Read-only bridge to framework tools in `.agent/` and `.agents/` at root. Do not modify contents here — edit the originals at root. The separation is intentional: project intelligence lives in `ai-agents/`, framework capabilities live in `.agent/`.
