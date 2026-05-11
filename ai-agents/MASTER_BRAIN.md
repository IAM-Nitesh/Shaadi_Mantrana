# 🧠 SHAADI MANTRANA - MASTER BRAIN

This is the central nervous system for all AI-assisted operations.

---

## 🏗️ THE ORCHESTRATION MATRIX
When a task is received, the AI MUST route it through this matrix to invoke the correct context:

| Category | Persona to Invoke | Knowledge Base Focus |
| :--- | :--- | :--- |
| **Pipeline/Build/Push** | `personas/ci-engineer.md` | `knowledge-base/ci-failure-patterns.md` |
| **UI/UX/Styles/GSAP** | `personas/premium-ui.md` | `knowledge-base/continuous-learning.md` (CSS section) |
| **Database/API/Auth** | `personas/backend.md` | `knowledge-base/security-patterns.md` |
| **Capacitor/Native/Android**| `personas/mobile.md` | `knowledge-base/mobile-builds.md` |
| **System Refactor/Structure**| `personas/architect.md` | `GLOBAL_RULES.md` |

---

## 🚦 MANDATORY DISPATCHER LOOP
Before executing ANY command or committing code, the AI performs this internal "Dispatcher" check:
1.  **Analyze**: "What is the core domain of this request?"
2.  **Infect Context**: Read the mapped Persona AND the Knowledge Base.
3.  **Pre-Flight Validation**: Cross-check the proposed solution against `knowledge-base/continuous-learning.md` AND perform a **Workspace Dependency Audit** (grep imports) to ensure all packages are locally declared.
4.  **Declare**: State to the USER: *"Adopted [Persona] mindset; Knowledge Base consulted and Workspace Dependency Audit passed."*
5.  **Execute**: Proceed with domain-specific rigor.

## 🛡️ HARD RIGOR PROTOCOL
To prevent regression and "Whack-a-Mole" fixes, the following are now mandatory:
1.  **Source of Truth**: Always request raw logs (e.g., `npm audit`, CI build logs) before the first edit. Do not rely on internal version data if a live report is available.
2.  **Workspace Isolation**: In monorepos, performing a root fix is a failure. You MUST perform a **Recursive Import Audit** (grep imports vs local `package.json`) for every workspace involved.
3.  **The Preflight Paradox**: You are FORBIDDEN from claiming a task is "fixed" or "stable" until a full `./scripts/preflight.sh` (or equivalent) has been executed and passed.
4.  **Surgical Integrity**: Every JSON/TS edit must be followed by a syntax check. If you touch a Proxy, you must verify its `this` binding and TypeScript types immediately.
The Orchestrator is responsible for the **Post-Task Retrospective**:
1.  **Analyze**: "Is this learning new or a recurrence?"
2.  **Codify**: If new, run `./scripts/learn.sh` to update the brain.
3.  **Optimization Sweep**: Proactively scan the codebase for other instances of this pattern and propose an automated refactor using the new insight.

---

## 📂 DIRECTORY STRUCTURE
- `personas/`: The specialized experts.
- `knowledge-base/`: The project's collective memory.
- `GLOBAL_RULES.md`: The architectural guardrails.
