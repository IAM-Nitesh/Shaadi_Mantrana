# AI Engineering Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Antigravity into a high-context AI CTO by building a 5-layer operational framework and consolidating all documentation into a single source of truth.

**Architecture:** Hierarchical context system (Global → Specialized → Prompts → Memory → Governance). All agents are mapped to installed skills (TDD, ui-ux-pro-max, etc.) and coordinate via Escalation Rules.

**Tech Stack:** Markdown-based documentation, Project-specific tech (Next.js 15, Capacitor, MongoDB).

---

### Task 1: Foundation & Directory Structure

**Files:**
- Create: `ai-agents/`
- Create: `ai-prompts/`
- Create: `ai-memory/`
- Create: `ai-memory/decision-log/`
- Create: `ai-maintenance/`
- Create: `market-intelligence/`

- [ ] **Step 1: Create the directory structure**
Run: `mkdir -p ai-agents ai-prompts ai-memory/decision-log ai-maintenance market-intelligence`
Expected: Directories created.

- [ ] **Step 2: Commit**
Run: `git add ai-agents ai-prompts ai-memory ai-maintenance market-intelligence && git commit -m "chore: initialize AI OS directory structure"`

---

### Task 2: Level 1 - Global Brain & Core Rules

**Files:**
- Create: `agents.md`
- Create: `SYSTEM_PRIORITIES.md`
- Create: `NON_NEGOTIABLES.md`
- Create: `AI_EXECUTION_RULES.md`
- Create: `RELEASE_PHASE.md`
- Create: `SUCCESS_METRICS.md`

- [ ] **Step 1: Create `agents.md`**
```markdown
# SHAADI MANTRANA - GLOBAL BRAIN

## PRODUCT CONTEXT
* Premium Indian Matrimony
* Trust-first, mobile-first experience
* Elegant, luxury aesthetic (not flashy dating app)

## TECH STACK
* Next.js 15 (App Router, Server Components)
* Capacitor (Cross-platform)
* MongoDB / Mongoose
* Socket.io (Real-time)
* GSAP (Animations)
* Tailwind CSS

## CORE RULES
* Never break mobile responsiveness
* Never add heavy libraries without approval
* Use TypeScript strict mode
* Prioritize performance over abstraction
```

- [ ] **Step 2: Create `SYSTEM_PRIORITIES.md`**
```markdown
# SYSTEM PRIORITIES
1. Mobile performance (Lighthouse 95+)
2. Trust and elegance (Premium UX)
3. Simplicity (Clean code, minimal abstractions)
4. Scalability (Event-driven, optimized DB)
5. Developer convenience
```

- [ ] **Step 3: Create `NON_NEGOTIABLES.md`**
```markdown
# NON-NEGOTIABLES
- Never compromise swipe smoothness (60fps)
- Never break one-handed usability
- Never allow inconsistent typography
- Never add dependencies without justification
```

- [ ] **Step 4: Create `AI_EXECUTION_RULES.md`**
```markdown
# AI EXECUTION RULES
1. Analyze architecture before coding
2. Check existing patterns in `ai-memory/`
3. Generate implementation plan first
4. Validate mobile/performance impact
5. Use `verification-before-completion` skill
```

- [ ] **Step 5: Create `RELEASE_PHASE.md`**
```markdown
# CURRENT RELEASE PHASE
CURRENT STAGE: MVP Validation
FOCUS: Speed, UX consistency, Retention.
AVOID: Premature microservices, complex infra.
```

- [ ] **Step 6: Create `SUCCESS_METRICS.md`**
```markdown
# SUCCESS METRICS
- Technical: Lighthouse ≥95, TTI <2.5s
- Product: Profile completion >70%, Match conversion %
- UX: Swipe latency <16ms, zero CLS.
```

- [ ] **Step 7: Commit**
Run: `git add agents.md SYSTEM_PRIORITIES.md NON_NEGOTIABLES.md AI_EXECUTION_RULES.md RELEASE_PHASE.md SUCCESS_METRICS.md && git commit -m "feat: establish Level 1 Global Brain and Core Rules"`

---

### Task 3: Level 2 - Specialized Agents

**Files:**
- Create: `ai-agents/architect.md`
- Create: `ai-agents/mobile.md`
- Create: `ai-agents/premium-ui.md`
- Create: `ai-agents/performance.md`
- Create: `ai-agents/security.md`
- Create: `ai-agents/qa.md`
- Create: `ai-agents/growth.md`
- Create: `ai-agents/backend.md`

- [ ] **Step 1: Create `ai-agents/performance.md`**
```markdown
# PERFORMANCE AGENT
ROLE: Senior Performance Engineer
GOALS: 95+ Lighthouse, Minimal JS, 60fps animations.
WORKFLOWS: Use `timeline-report` for audits.
ESCALATION: If aesthetic impact, consult `premium-ui.md`.
```

- [ ] **Step 2: Create `ai-agents/premium-ui.md`**
```markdown
# PREMIUM UI AGENT
ROLE: Senior Mobile UX Designer (Indian Luxury)
GOALS: Elegant animations, Typography, Trust-first UI.
WORKFLOWS: Use `ui-ux-pro-max` skill.
ESCALATION: If performance impact, consult `performance.md`.
```

- [ ] **Step 3: Create other agents (Architect, Mobile, Security, QA, Growth, Backend) using the same structure.**

- [ ] **Step 4: Commit**
Run: `git add ai-agents/ && git commit -m "feat: implement Level 2 Specialized Agents"`

---

### Task 4: Level 4 & 5 - Memory & Maintenance

**Files:**
- Create: `ai-memory/current_state.md`
- Create: `ai-memory/known-bad-patterns.md`
- Create: `ai-maintenance/context-refresh.md`

- [ ] **Step 1: Create `ai-memory/current_state.md`** (Populate with current task details).
- [ ] **Step 2: Create `ai-maintenance/context-refresh.md`** (Define weekly audit protocol).
- [ ] **Step 3: Commit**
Run: `git add ai-memory/ ai-maintenance/ && git commit -m "feat: initialize Memory and Maintenance layers"`

---

### Task 5: Documentation Consolidation & Cleanup

- [ ] **Step 1: Inventory all legacy `.md` files**
- [ ] **Step 2: Map and move relevant content to the new AI OS structure**
- [ ] **Step 3: Delete original legacy files after verification**
- [ ] **Step 4: Commit**
Run: `git add . && git commit -m "chore: consolidate and cleanup legacy documentation"`
