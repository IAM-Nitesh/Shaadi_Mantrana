# SHAADI MANTRANA - GLOBAL BRAIN

## PRODUCT CONTEXT (Enriched)
* **Premium Indian Matrimony**: Focus on authentic, meaningful romantic relationships for urban professionals.
* **Modern Matchmaking**: Combines traditional values with contemporary dating app features (Swipe, Real-time chat).
* **Trust-first, mobile-first**: Elegant luxury aesthetic with OTP-verified safety.

## ARCHITECTURE OVERVIEW
* **Frontend**: Next.js 15 App Router (Server Components primary).
* **Mobile**: Capacitor with GSAP for high-performance animations.
* **Backend**: Node.js Service Layer with MongoDB Singleton.
* **Scalability**: Event-driven architecture with Socket.io.

## CORE RULES
* Never break mobile responsiveness
* Never add heavy libraries without approval
* Use TypeScript strict mode
* Prioritize performance over abstraction

## MOBILE & DEPLOYMENT GUARDRAILS
* **Next.js Version Sync**: Always ensure subfolder `package.json` matches root version (Next.js 15+).
* **Client Directives**: Mark all files using Hooks (`useState`, `useEffect`, `createContext`) with `"use client";` at the very top.
* **Vercel Build Stability**: Keep `typescript` and core `@types` in `dependencies` (not devDeps) to ensure visibility to the Vercel build worker.
* **Native-First Links**: Use `<a>` tags instead of `next/link` for static Capacitor exports to avoid hydration mismatch.

## ⚡ SUPERPOWER INTEGRATION
* **Skill-First Mentality**: If a skill exists for a task (TDD, Debugging, Planning), it is MANDATORY to invoke it.
* **Traceability**: All major plans must be saved to `docs/superpowers/plans/` as per the `writing-plans` skill.
* **Continuous Discovery**: Use `smart-explore` and `mem-search` before asking questions about existing logic.
