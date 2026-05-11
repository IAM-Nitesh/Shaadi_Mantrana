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
- **The Fix**: Every file using React hooks MUST start with `'use client';` as the **absolute first line** — before any comments, imports, or blank lines.
- **Note**: This includes Context Providers, interactive UI components, and pages using `useEffect`.
- **Scan command**: `grep -rL '"use client"' src/ --include="*.tsx" | xargs grep -l "useState\|useEffect\|createContext"`

### 3. next.config.js Compatibility
- **The Issue**: `Invalid next.config.js options: Unrecognized key 'optimizeFonts'` warning on Next.js 15.
- **The Fix**: Remove `optimizeFonts` — it was removed in Next.js 13+. Font optimization is now automatic.

### 3. Vercel Build Dependency Management
- **The Issue**: "Module not found: Can't resolve 'typescript'" or '@types' during Vercel validation.
- **The Fix**: Move `typescript` and core `@types/*` packages from `devDependencies` to `dependencies` in the subfolder `package.json`.
- **Rationale**: Vercel build workers sometimes struggle to resolve devDependencies during the post-compilation type-checking phase.

### 4. ESLint & Missing Build Packages
- **The Issue**: "ESLint must be installed" or "Cannot find module 'X'" errors during Vercel's type-check phase.
- **The Fix**: Add `eslint`, `eslint-config-next`, and any component-level packages (e.g., `react-intersection-observer`) directly to `dependencies` — **NOT** `devDependencies`.
- **Rationale**: Vercel's build worker runs in a production-mode install context. Any package used during compilation (linting, type-checking, component rendering) must live in `dependencies`.
- **Pattern to catch**: If a file imports a package that is not in `dependencies`, add it there before pushing.
- **Capacitor ESLint Conflict**: When using `<a>` tags for native links, add `"@next/next/no-html-link-for-pages": "off"` to `.eslintrc.json` to prevent build failures.

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
- `npm run build 2>&1 | tail -30`: Test static export locally and capture the actual error.
- `npx cap sync android`: Sync optimized assets to the native project.
- `rm -rf .next && npm run build`: Always do a **clean build** when debugging tsconfig/type errors.

## 🧠 Static Export Runtime Crash Patterns

### 6. Lazy SDK Initialization (Firebase / Supabase)
- **The Issue**: `Firebase: auth/invalid-api-key` or `supabaseUrl is required` crash during `Generating static pages`.
- **Root Cause**: SDKs initialized at module-load time. During static export, Next.js pre-renders pages on the server where `NEXT_PUBLIC_*` env vars are empty strings.
- **The Fix**: Use a lazy-init Proxy pattern with **explicit function binding** so the SDK only initializes when actually called on the client:
```ts
let _client: Client | null = null;
export const getClient = () => {
  if (!_client) _client = createClient(url || 'https://placeholder.example.co', key || 'placeholder');
  return _client;
};
export const client = new Proxy({} as Client, {
  get: (_, prop) => {
    const inst = getClient();
    const value = inst[prop as keyof Client];
    // CRITICAL: Bind functions to instance to preserve 'this' context
    if (typeof value === 'function') return value.bind(inst);
    return value;
  },
});
```
- **Rule**: Any SDK that validates env vars at init time or uses internal `this` references MUST use lazy initialization with bound function Proxies.

### 7. TypeScript Module Resolution for Next.js 15
- **The Issue**: `Cannot find module '../../app/admin/dashboard/page.js'` from `.next/types/` auto-generated files.
- **Root Cause**: `moduleResolution: "node"` cannot resolve `.js` extension references generated by Next.js 15's type system.
- **The Fix**: Change `tsconfig.json` to use `"moduleResolution": "bundler"` and exclude `.next` from TypeScript:
```json
{
  "compilerOptions": { "moduleResolution": "bundler" },
  "exclude": ["node_modules", ".next"]
}
```
- **Note**: Next.js will auto-add `.next/types/**/*.ts` back to `include`. That's fine — the `exclude` rule takes precedence for the generated files that cause issues.

### 8. Null Safety for Navigation Hooks
- **The Issue**: `Type error: Argument of type 'string | null' is not assignable to parameter of type 'string'` for `usePathname()`, `useSearchParams()`.
- **The Fix**: Always use null-safe patterns:
```ts
const id = searchParams?.get('id');                          // optional chaining
const showNav = [...].includes(pathname ?? '');              // null coalescing
```
- **Rule**: Treat all Next.js navigation hook return values as potentially null in TypeScript strict mode.

### 9. Vercel Log Truncation — How to Get Real Errors
- **The Issue**: Vercel build logs cut off at `Generating static pages (0/20)` without showing the actual error.
- **The Fix**: Run `npm run build 2>&1 | tail -30` **locally** to get the exact error. Vercel and local Next.js produce identical errors.
- **Rule**: Never rely solely on Vercel logs. Always reproduce locally first.

### 10. Dynamic Import Type Errors in Utility Files
- **The Issue**: `Cannot find module` errors in files like `codeSplitting.ts` that use `dynamic(() => import('../app/some/page'))`.
- **The Fix**: Add `// @ts-nocheck` at the top of pure utility files that use dynamic import patterns TypeScript cannot statically resolve.
