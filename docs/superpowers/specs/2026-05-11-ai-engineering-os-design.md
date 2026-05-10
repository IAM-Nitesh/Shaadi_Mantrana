# Design: AI Engineering Operating System & Documentation Consolidation

## 1. Vision
Transform Antigravity from a simple code generator into a high-context AI CTO and engineering team for **Shaadi Mantrana**. Establish a single, accurate source of truth by consolidating fragmented documentation and creating a persistent hierarchical context system that is self-correcting and strategically aligned.

## 2. Success Criteria
*   **Zero Drift**: Antigravity consistently follows the "Premium Indian Matrimony" aesthetic and tech stack rules without reminders.
*   **Unified Truth**: All relevant architectural and business logic is consolidated; legacy/duplicate docs are removed.
*   **Specialized Excellence**: Specialized agents (UI/UX, Performance, etc.) automatically trigger relevant skills and coordinate via Escalation Rules.
*   **Measurable Optimization**: Decisions are driven by defined Success Metrics (Lighthouse scores, TTI, retention, etc.).
*   **Context Persistence**: Long-term project state and "Why" behind decisions are maintained via the `ai-memory` layer.

## 3. Architecture

### Level 1: Global Brain (`/agents.md`)
The permanent OS containing:
*   Project Context & Core Stack.
*   **SYSTEM_PRIORITIES.md**: Weighted order (Performance > Trust/Elegance > Simplicity).
*   **NON_NEGOTIABLES.md**: Absolute constraints (swipe smoothness, one-handed usability).
*   **AI_EXECUTION_RULES.md**: Meta-rules for AI operation (Analysis → Plan → Validate).
*   **RELEASE_PHASE.md**: Current stage (MVP Validation) to prevent overengineering.
*   **SUCCESS_METRICS.md**: Technical, Product, and UX KPIs.

### Level 2: Specialized Agents (`/ai-agents/`)
Domain-specific files with:
*   **ROLE/GOALS/CONSTRAINTS**: Domain-specific logic.
*   **WORKFLOWS**: Mapping to installed skills (TDD, ui-ux-pro-max, etc.).
*   **ESCALATION RULES**: Coordination triggers (e.g., Performance → Premium-UI if aesthetics are impacted).
*   **OWNERSHIP_MAP.md**: Mapping agents to specific code zones (Swipe Engine, Auth, etc.).

### Level 3: Task Prompt Templates (`/ai-prompts/`)
Reusable mega-prompts for recurring tasks (Production audits, UI reviews, Security pentests).

### Level 4: AI Memory (`/ai-memory/`)
Context compression and persistence:
*   **current_state.md**: Immediate priorities.
*   **decision-log/**: Immutable tracking of architectural choices (Decision, Why, Alternatives, Risks).
*   **known-bad-patterns.md**: Tracking previous mistakes and failed experiments.
*   **architecture_decisions.md**: High-level structural logic.
*   **market-intelligence/**: Competitor analysis (Bumble, Hinge, etc.).

### Level 5: Governance (`/ai-maintenance/`)
*   **context-refresh.md**: Weekly audit protocols to remove stale info and archive obsolete decisions.

## 4. Documentation Consolidation Strategy
1.  **Inventory**: List all existing `.md` files in root and `/docs`.
2.  **Mapping**: Categorize info into the new structure.
3.  **Validation**: Cross-reference docs with the current codebase for accuracy.
4.  **Integration**: Populate Level 1-4 files with consolidated info.
5.  **Cleanup**: Delete originals only after they are fully mapped and integrated.

## 5. Risk Assessment
*   **Documentation Entropy**: Mitigation: Strict adherence to `context-refresh.md` protocols.
*   **Agent Conflict**: Mitigation: Clear `SYSTEM_PRIORITIES.md` and `ESCALATION RULES`.
