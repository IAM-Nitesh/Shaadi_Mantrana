---
trigger: manual
---

# Shaadi Mantrana - AI Agent Workspace Rules
# Purpose: Enable autonomous development, testing, and deployment workflows
# Last updated: 2026-05-11

## AUTONOMOUS OPERATIONS - NO CONFIRMATION REQUIRED

### Git & Version Control
- **Auto-commit**: Commit changes after completing any feature, fix, or refactor
- **Commit message format**: Follow conventional commits (feat:, fix:, chore:, docs:, test:, refactor:, perf:)
- **Branch naming**: 
  - Features: `feature/descriptive-name`
  - Fixes: `fix/issue-description`
  - Hotfixes: `hotfix/critical-issue`
  - Chores: `chore/task-name`
- **Auto-push**: Push to remote after every commit
- **Auto-rebase**: Rebase feature branches on main/develop before PR creation
- **Merge conflicts**: Attempt auto-resolution; only escalate if semantic conflict detected

### Pull Request Workflow
- **Auto-create PRs**: Create PR immediately when feature branch is ready
- **PR description**: Auto-generate from commits using AI summarization
- **Auto-merge**: Merge PRs automatically if ALL conditions met:
  - All CI checks passing (tests, linting, build)
  - No merge conflicts
  - Code coverage >= current baseline (no regression)
  - Branch is up-to-date with target
  - No "DO NOT MERGE" label present
- **Squash merge**: Always use squash merge to keep history clean
- **Delete branch**: Auto-delete feature branch after successful merge

### Code Review
- **Self-review before PR**: Run automated checks:
  - ESLint/Prettier formatting
  - TypeScript type errors
  - Unused imports/variables
  - Console.log statements in production code
  - Hardcoded credentials or API keys
- **AI code review**: Use Claude/GPT-4 to review diffs for:
  - Logic errors
  - Security vulnerabilities
  - Performance issues
  - Best practice violations
- **Auto-fix**: Apply automated fixes for linting/formatting without asking

### Testing
- **Auto-run tests**: Execute test suite before every commit
- **Auto-generate tests**: Create unit tests for new functions/components
- **Test coverage**: Maintain >= 70% coverage; block PR if regression
- **E2E tests**: Run Playwright/Cypress tests on staging before production deploy
- **Snapshot updates**: Auto-update snapshots if only UI changes (no logic change)

### Dependencies
- **Auto-update**: Update patch versions automatically (e.g., 1.2.3 → 1.2.4)
- **Security patches**: Apply security updates immediately without confirmation
- **Lockfile**: Regenerate package-lock.json/yarn.lock after dependency changes
- **Audit**: Run `npm audit fix` weekly; escalate only if unfixable critical issues

### Build & Deploy
- **Auto-build**: Trigger builds on every push to main/develop
- **Staging deploy**: Auto-deploy to staging environment on merge to develop
- **Production deploy**: Auto-deploy to production on merge to main (with staged rollout)
- **Rollback**: Auto-rollback if error rate > 1% or crash rate > 0.5% within 10 minutes of deploy
- **Environment variables**: Never commit .env files; use secret management (GitHub Secrets, Vercel env vars)

### File Operations
- **Auto-create**: Create new files/folders as needed for features
- **Auto-delete**: Remove unused files, empty folders, deprecated code
- **Refactoring**: Restructure code/folders to follow project conventions without asking
- **Naming conventions**: 
  - Components: PascalCase (e.g., `ProfileCard.tsx`)
  - Utilities: camelCase (e.g., `formatPhoneNumber.ts`)
  - Styles: kebab-case (e.g., `profile-card.module.css`)
  - Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_PHOTOS_PER_PROFILE`)

## PROJECT-SPECIFIC RULES

### Tech Stack Constraints
- **Frontend**: Next.js 15.5, React 18, TypeScript, Tailwind CSS
- **Mobile**: Capacitor 6 (not Cordova), must use `output: 'export'` in next.config.js
- **Backend**: Node.js 18+, Express, TypeScript
- **Database**: MongoDB with Mongoose, avoid raw queries
- **Real-time**: Supabase Realtime (not Socket.io)
- **Auth**: Firebase Auth (phone OTP + Google Sign-In)
- **Storage**: Backblaze B2 + Cloudflare CDN
- **Animations**: CSS-first, GSAP only for onboarding (performance)
- **State**: React Context or Zustand (avoid Redux complexity)

### Architecture Patterns
- **Clean code**: Follow repository pattern for data access
- **Type safety**: All API responses must have TypeScript interfaces
- **Error handling**: Always use try-catch, return proper error objects
- **Validation**: Use Zod for input validation (frontend + backend)
- **Security**: 
  - Never store plain passwords
  - Always validate Firebase JWT in Express middleware
  - Rate limit: 100 req/min per IP on public endpoints
  - Sanitize all user inputs before DB writes

### Code Quality Gates
- **No `any` types**: Use `unknown` or proper types
- **No `console.log`**: Use Pino logger in backend, remove logs in frontend
- **No hardcoded strings**: Use constants file
- **No magic numbers**: Define named constants
- **Function length**: Max 50 lines; refactor if longer
- **File length**: Max 300 lines; split into modules if longer
- **Cyclomatic complexity**: Max 10 per function

### Feature Development Workflow
1. **Create feature branch** from `develop`
2. **Write failing test** (TDD when applicable)
3. **Implement feature** with types and validation
4. **Update documentation** (inline comments, README if public API)
5. **Run local tests** + linting
6. **Commit** with conventional commit message
7. **Push** and create PR
8. **Wait for CI** (auto-merge if green)

### Database Operations
- **Migrations**: Use dedicated migration scripts, never modify schema in application code
- **Indexes**: Add indexes for all query fields (especially: religion, city, age, premiumPlan)
- **Soft deletes**: Use `isDeleted: true` flag, never hard delete user data
- **PII protection**: Hash phone numbers in logs, never log full phone/email
- **Backups**: MongoDB Atlas automatic backups enabled, test restore monthly

### Monitoring & Alerts
- **Crash rate**: Alert if > 0.5% (Sentry)
- **API latency**: Alert if p95 > 500ms
- **Error rate**: Alert if > 2% of requests fail
- **Disk usage**: Alert if MongoDB > 80% of free tier
- **Memory**: Alert if Node.js heap > 400MB sustained

## RESTRICTED OPERATIONS - REQUIRE CONFIRMATION

### Production Data
- **Delete production database**: Never auto-execute
- **Modify production env vars**: Require explicit approval
- **Access production logs with PII**: Require confirmation + audit log

### Financial
- **Razorpay config changes**: Require review (payment flows are critical)
- **Pricing/subscription changes**: Require confirmation

### Security
- **Firebase Auth config**: Require review before changes
- **API key rotation**: Require confirmation
- **Rate limit changes**: Require review (avoid DDoS exposure)

### Infrastructure
- **Change MongoDB tier**: Require cost approval
- **Add new third-party service**: Require security/privacy review
- **DNS/domain changes**: Require confirmation

## ESCALATION TRIGGERS

Auto-escalate to human if:
- **Build failing for > 3 consecutive commits**: Possible systemic issue
- **Test coverage drops > 5%**: Significant regression
- **Security vulnerability detected**: Critical/high severity in dependencies
- **API breaking change**: In public endpoints
- **Production deploy fails twice**: Possible infrastructure issue
- **User-reported bug severity: critical**: Affects auth, payments, or data loss

## COMMUNICATION STYLE

### Commit Messages
```
feat: add phone OTP verification via Firebase Auth
fix: resolve Capacitor navigation crash on back button
chore: upgrade Next.js to 15.5.1 (security patch)
docs: update README with new auth flow
test: add e2e tests for profile photo upload
refactor: extract match algorithm to separate service
perf: optimize MongoDB indexes for profile queries
```

### PR Descriptions
Auto-generate using this template:
```markdown
## Changes
- [List of changes from commits]

## Testing
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Manually tested on Android device

## Screenshots (if UI change)
[Auto-attach screenshots if applicable]

## Deployment Notes
[Any special deployment steps]
```

### Code Comments
- **When to comment**: Complex algorithms, non-obvious workarounds, Firebase/Capacitor quirks
- **When NOT to comment**: Self-explanatory code
- **Style**: Sentence case, end with period

## FILE STRUCTURE CONVENTIONS

```
/shaadi-mantrana
├── frontend/                 # Next.js + Capacitor
│   ├── src/
│   │   ├── app/             # Next.js 15 app router
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utilities, helpers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript interfaces
│   │   └── constants/       # App-wide constants
│   ├── public/              # Static assets
│   ├── android/             # Capacitor Android
│   └── capacitor.config.ts
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/      # Auth, validation, logging
│   │   └── utils/           # Helpers
│   └── tests/               # Backend tests
├── shared/                   # Shared types/constants
├── scripts/                  # Build, deploy, migration scripts
└── docs/                     # Documentation
```

## PERFORMANCE BUDGETS

- **Page load**: < 2s on 3G (Lighthouse)
- **API response**: < 200ms (p95)
- **Bundle size**: < 500KB (initial JS)
- **Image size**: < 300KB (profile photos, compressed)
- **MongoDB queries**: < 100ms (with indexes)
- **Capacitor boot**: < 1s cold start

## ACCESSIBILITY REQUIREMENTS

- **WCAG AA**: Minimum compliance level
- **Keyboard navigation**: All interactive elements
- **Screen reader**: Semantic HTML, ARIA labels
- **Color contrast**: 4.5:1 minimum
- **Touch targets**: 44x44px minimum (mobile)

## CHANGELOG MAINTENANCE

Update CHANGELOG.md automatically on every release:
```markdown
## [1.2.0] - 2026-05-15

### Added
- Phone OTP verification via Firebase Auth
- Photo moderation admin queue

### Fixed
- Capacitor navigation crash on Android back button

### Changed
- Upgraded Next.js to 15.5.1

### Security
- Applied express-rate-limit to prevent brute force
```

## LICENSE & COMPLIANCE

- **Code license**: Proprietary (Shaadi Mantrana)
- **Open source deps**: MIT/Apache 2.0 preferred; escalate GPL dependencies
- **Play Store compliance**: Always check photo moderation, age verification, privacy policy
- **DPDP Act 2023**: Explicit consent for religion/caste data collection
- **Data retention**: Delete user data within 30 days of account deletion request

---

## QUICK REFERENCE - COMMON TASKS

**Add new API endpoint:**
1. Create route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add Zod validation schema
4. Add Firebase JWT middleware
5. Write unit test
6. Update API documentation

**Add new frontend screen:**
1. Create component in `src/app/[name]/page.tsx`
2. Add navigation in bottom tab bar
3. Add loading/error states
4. Write Playwright test
5. Test on Android device

**Fix production bug:**
1. Create `hotfix/` branch from `main`
2. Fix + test
3. PR to `main` (auto-merge if tests pass)
4. Auto-deploy to production
5. Cherry-pick to `develop`

**Update dependency:**
1. Run `npm update [package]` or `npm install [package]@latest`
2. Run test suite
3. Commit with `chore: upgrade [package] to vX.X.X`
4. Auto-merge if CI passes

---

**Agent Signature**: This workspace trusts AI agents to make sound technical decisions within these guardrails. When in doubt, prefer action over inaction — it's easier to revert a commit than to lose momentum.