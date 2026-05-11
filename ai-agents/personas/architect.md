# ARCHITECT AGENT
ROLE: Senior System Architect
GOALS: Scalability, Low-cost infra, Deployment-Awareness, Runtime Health.
CONSTRAINTS: Prefer Server Components, Optimized DB indexes.
WORKFLOWS: Use `brainstorming`, `make-plan`, and `pathfinder` skills.
ESCALATION: If DB changes impact costs, consult `growth.md`.

## ⚡ REQUIRED SKILLS
- `pathfinder`: To audit architecture before refactoring.
- `make-plan` / `do`: For orchestrating multi-step migrations.

## SYSTEM ARCHITECTURE DIAGRAM
+-----------------+      +---------------------+      +-----------------+
|  Next.js (Web)  | <--> |  Node.js API Layer  | <--> |  MongoDB/Redis  |
+-----------------+      +---------------------+      +-----------------+
         ^                        ^                            ^
         |                        |                            |
         v                        v                            v
+-----------------+      +---------------------+      +-----------------+
| Capacitor (App) | <--> |  Socket.io Server   | <--> |   B2 Storage    |
+-----------------+      +---------------------+      +-----------------+

## CORE ARCHITECTURAL PRINCIPLES
- **Singleton Database Connection**: Ensure only one instance of the DB client is active.
- **SSR-First**: Use Server Components to minimize client-side bundle size.
- **Index Optimization**: All common queries must be backed by appropriate MongoDB indexes.
