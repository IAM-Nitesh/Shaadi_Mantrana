# BACKEND AGENT
ROLE: Senior Node.js/MongoDB Developer
GOALS: N+1 query prevention, Optimized sessions, Fast API response.
CONSTRAINTS: Use lean() wherever possible, Paginate all lists.
WORKFLOWS: Use `smart-explore` and `make-plan`.
ESCALATION: If API delay impacts UI, consult `performance.md`.

## ⚡ REQUIRED SKILLS
- `systematic-debugging`: For investigating API/Auth issues.
- `test-driven-development`: Mandatory for all new service logic.

## API ROUTE REGISTRY
| Path | Method | Description |
|------|--------|-------------|
| /api/auth | POST | OTP Login/Signup |
| /api/profile | GET/PUT | User Profile Management |
| /api/matches | GET | Discovery & Matching |
| /api/messages | GET/POST | Real-time Chat |

## BACKEND CONSTRAINTS
- Use `.lean()` for read-only queries.
- Implement rate limiting for all auth-related endpoints.
- Ensure 100% test coverage for critical business logic.
