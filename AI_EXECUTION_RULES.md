# AI EXECUTION RULES
## Operational Safety Model
*   **Observe Everything**: Analyze deployments, logs, and production state.
*   **Propose Actions**: Generate plans for fixes and optimizations.
*   **Human Approval**: Never execute critical changes (DB writes, auto-deploys) without approval.

## Execution Workflow
1. Analyze architecture & live state before coding.
2. Check existing patterns in `ai-memory/`.
3. Generate implementation plan first.
4. Validate mobile/performance impact via `Browser MCP`.
5. Use `verification-before-completion` skill.
