# Soft Launch Wave-1 Runbook

## Objective
Launch a controlled cohort for PWA + Android, monitor stability for 24-48h, and decide whether to expand or roll back.

## Scope
- Platforms: PWA + Android
- Cohort: internal users + trusted external testers
- Duration: 24-48 hours

## 1) Pre-Launch Checklist
- [ ] `docs/PRODUCTION_CONFIG_AUDIT.md` pass criteria all green.
- [ ] `docs/MOBILE_REGRESSION_REPORT.md` manual matrix complete.
- [ ] On-call owner assigned for backend and frontend.
- [ ] Rollback target versions identified and validated.
- [ ] Launch communication sent to cohort.

## 2) Wave-1 Cohort Controls
- PWA: invite-only list / controlled announcement.
- Android: internal testing track only (Play Console).
- No full marketing traffic during wave-1.

## 3) SLO Thresholds (Wave-1 Gates)
- Auth success rate: `>= 98%`
- OTP verify success: `>= 95%`
- API 5xx rate: `< 1%`
- Auth 401/403 anomaly: no sustained spike over baseline
- Chat send success: `>= 98%`
- Client fatal error/crash: `< 0.5% sessions`

## 4) Monitoring Cadence
- T+0 to T+2h: check every 15 minutes
- T+2h to T+12h: check every 30 minutes
- T+12h to T+48h: check hourly

## 5) Live Checks (Each Cadence Window)
- [ ] `/health` and `/api/database/status` green
- [ ] Auth status endpoint healthy (`/api/auth/status`)
- [ ] OTP send/verify sampled in production
- [ ] Discovery list load + swipe action sampled
- [ ] Chat send/read sampled
- [ ] Upload and signed URL retrieval sampled

## 6) Decision Framework

### Expand to Wave-2
All true for two consecutive windows:
- SLO thresholds are met.
- No unresolved P0/P1 incidents.
- No auth/session regressions.

### Hold Wave-1
Any one:
- Single window breach with recoverable cause.
- Intermittent auth or chat degradation without clear fix yet.

### Rollback
Any one:
- P0 incident affecting auth/session integrity.
- Sustained SLO breach over two windows.
- Security issue or data corruption risk.

## 7) Rollback Steps
- Revert frontend deployment to last known-good.
- Revert backend deployment to last known-good.
- Announce incident + temporary freeze on cohort growth.
- Validate core paths: auth, discovery, chat before resuming.

## 8) Wave-1 Sign-Off Record
- Start time:
- End time:
- Cohort size:
- SLO summary:
- Incident summary:
- Decision: `Expand` / `Hold` / `Rollback`
- Approvers:
