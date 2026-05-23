# Dependency Fixes and Override Strategy

## Monorepo dependency remediation practice
In this workspace, transitive vulnerabilities are often best fixed through root-level npm workspace overrides instead of patching nested `node_modules` directly.

### When to use root overrides
- A security alert refers to a transitive dependency rather than a package directly declared by a workspace.
- Multiple workspaces share the same vulnerable dependency tree.
- A safe patched version is available from the package maintainer.

### Why this is the right approach
- It preserves workspace consistency across frontend/backend packages.
- It avoids divergent dependency versions between workspaces.
- It makes the fix visible in the root `package.json` and lockfile.

### Recommended workflow
1. Run `npm audit --json` at the workspace root to identify the exact vulnerable package path.
2. Add or update the root `package.json` `overrides` entry with the safe version.
3. Run `npm install --package-lock-only` from the root workspace.
4. Re-run `npm audit` and verify zero remaining vulnerabilities for the affected path.
5. Build all relevant workspaces: `npm run build` and any workspace-specific build scripts.

### Examples from recent remediation
Recent dependency decisions in this repo used root overrides for transitive fixes including:
- `serialize-javascript`
- `braces`
- `postcss`
- `micromatch`
- `protobufjs`
- `elliptic`
- `uuid`

## Decision documentation
Document the dependency-fix decision in `ai-agents/knowledge-base/dependency-fixes.md` and add a feedback store entry for any recurring pattern.
