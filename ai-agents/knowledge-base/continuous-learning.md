
---

### 🎓 Learning: Unified AI Operations
**Date**: 2026-05-11 20:18:36
**Insight**: 
Consolidated scattered personas into ai-agents/ directory with a MASTER_BRAIN.md orchestrator and a centralized knowledge-base. Established the rule that CI failures must be documented to prevent phantom dependencies.


---

### 🎓 Learning: Proxy Function Binding in Lazy Init
**Date**: 2026-05-11 20:33:35
**Insight**: 
When using Proxy for lazy initialization of SDKs (Supabase, Firebase), you MUST bind functions to the original instance to prevent 'this' context loss. SDK methods like .channel() or .auth() will fail silently or crash without explicit binding.


---

### 🎓 Learning: Vercel Build Dependencies
**Date**: 2026-05-11 20:33:35
**Insight**: 
For Next.js monorepos on Vercel, compilation-critical tools like autoprefixer, postcss, and typescript should remain in 'dependencies' (not devDeps) in the workspace package.json to ensure the build worker can resolve them during the optimized production build phase.


---

### 🎓 Learning: Workspace Dependency Integrity
**Date**: 2026-05-11 20:41:27
**Insight**: 
In Next.js monorepos on Vercel, every package imported by a workspace (e.g., frontend) MUST be explicitly declared in its local package.json dependencies, even if already present in the root. Failure to do so causes 'Cannot find module' errors during the workspace-specific build phase.


---

### 🎓 Learning: Hallucinated Version Prevention
**Date**: 2026-05-11 20:46:34
**Insight**: 
Always verify package versions against the actual registry (npm info) before pinning them in package.json. Pinning non-existent versions (like nodemailer 8.0.7) causes security audit scripts and CI installation steps to fail silently or with confusing errors.


---

### 🎓 Learning: Sync Overrides Across All Workspaces
**Date**: 2026-05-11 20:46:34
**Insight**: 
In a monorepo, missing overrides in a specific workspace (e.g. frontend) can allow transitive dependencies to pull in vulnerable versions even if the root is patched. Always maintain mirror-overrides in root, frontend, and backend for critical security packages.

