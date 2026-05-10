---
name: deployment-readiness
description: Stabilize Next.js projects for Vercel and Capacitor environments. Ensures version consistency, App Router compatibility, and mobile-first static export success.
---

# Deployment Readiness Skill

This skill provides the knowledge and patterns required to move a Next.js 15 project from development to a production-ready mobile and web state.

## 🛠️ Build Stabilization Checklist

### 1. Next.js Version Sync
- **The Issue**: Subfolders (e.g., `frontend/`) having older Next.js versions than the root, causing Vercel to miss App Router features.
- **The Fix**: Align all `package.json` files to the latest version (e.g., `^15.5.0`).
- **Action**: Run `npm install` in the subfolder after updating.

### 2. Client Components Guardrails
- **The Issue**: "createContext/useState/useEffect only works in Client Component" build errors.
- **The Fix**: Every file using React hooks MUST start with `"use client";`.
- **Note**: This includes Context Providers, interactive UI components, and pages using `useEffect`.

### 3. Vercel Build Dependency Management
- **The Issue**: "Module not found: Can't resolve 'typescript'" or '@types' during Vercel validation.
- **The Fix**: Move `typescript` and core `@types/*` packages from `devDependencies` to `dependencies` in the subfolder `package.json`.
- **Rationale**: Vercel build workers sometimes struggle to resolve devDependencies during the post-compilation type-checking phase.

### 4. ESLint & Missing Build Packages
- **The Issue**: "ESLint must be installed" or "Cannot find module 'X'" errors during Vercel's type-check phase.
- **The Fix**: Add `eslint`, `eslint-config-next`, and any component-level packages (e.g., `react-intersection-observer`) directly to `dependencies` — **NOT** `devDependencies`.
- **Rationale**: Vercel's build worker runs in a production-mode install context. Any package used during compilation (linting, type-checking, component rendering) must live in `dependencies`.
- **Pattern to catch**: If a file imports a package that is not in `dependencies`, add it there before pushing.

### 5. Static Export (Capacitor) Compatibility
- **The Issue**: Hydration errors or blank screens in Capacitor apps using `next/link`.
- **The Fix**: Replace `next/link` with standard `<a>` tags and enable `trailingSlash: true` in `next.config.js`.
- **Rationale**: Standard tags are more reliable in native WebView environments where persistent client-side routing can behave differently than on the web.

### 5. UGC Compliance & Security
- **The Issue**: Play Store rejection due to unmoderated content.
- **The Fix**: 
  - Backend: Default all media uploads to `status: 'pending'`.
  - discovery: Filter API results to only include `status: 'approved'`.
  - Admin: Provide a dedicated moderation UI for manual approval.

## 🔧 Useful Commands
- `npx next --version`: Verify active Next.js version in a folder.
- `npm run build`: Test static export locally before pushing.
- `npx cap sync android`: Sync optimized assets to the native project.
