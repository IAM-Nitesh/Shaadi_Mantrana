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
Before executing ANY command, the AI performs this internal "Dispatcher" check:
1.  **Analyze**: "What is the core domain of this request?"
2.  **Infect Context**: Read the mapped Persona AND the Knowledge Base.
3.  **Declare**: State to the USER: *"Adopted [Persona] mindset; Knowledge Base consulted."*
4.  **Execute**: Proceed with the domain-specific rigor.

---

## 🔄 CONTINUOUS LEARNING FEEDBACK
The Orchestrator is responsible for the **Post-Task Retrospective**:
- After every fix, ask: *"Is this learning new?"*
- If yes, run `./scripts/learn.sh` to update the brain.

---

## 📂 DIRECTORY STRUCTURE
- `personas/`: The specialized experts.
- `knowledge-base/`: The project's collective memory.
- `GLOBAL_RULES.md`: The architectural guardrails.
