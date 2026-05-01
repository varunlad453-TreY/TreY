# 2026-04-30 Production Go-Live Execution TODO

## Objective
Move from "production environment is up" to "production is operationally safe for customer usage".

Current confirmed baseline:
- Production database is live.
- Google Workspace login is working.
- R2 evidence upload/download is working.

## Documentation Standard (For Developer, Tester, and Public Readability)
1. Write steps as if the reader is new to the system.
2. Keep one action per bullet and one expected result per action.
3. Never include raw secrets in docs, screenshots, tickets, or chat.
4. For public sharing, mask all sensitive values and internal URLs.
5. Every completed step should have one proof artifact (screenshot, log line, or link).

---

## How To Use This Document
1. Complete sections in order.
2. Mark each checklist item only after evidence is captured.
3. Do not proceed to customer onboarding until the Go/No-Go gate passes.

Legend:
- [ ] Pending
- [x] Complete

---

## Secrets and Secure Values
Production secrets (Sentry DSNs, R2/S3 keys, JWT secrets, OAuth client secrets, etc.) MUST NOT be stored in this repository or in documentation screenshots. Store and rotate all production secrets only in your hosting secret manager (Render, AWS Secrets Manager, Vault, etc.).

Coordinate secret handoff directly with your Ops or Deployment lead via a secure channel; do not publish values in docs, tickets, or public chat.

---

## Section 1 - Smoke Test Sign-Off (Priority P0)
Owner: Functional Tester + Founder
Target: Today

### Why this matters
This validates all mission-critical user flows in real production.

### Test steps
- [ ] Login using production Google Workspace account.
- [ ] Confirm dashboard loads without blocking errors.
- [ ] Create a new obligation (title, due date, owner).
- [ ] Reassign owner once.
- [ ] Upload one evidence file.
- [ ] Download the same evidence file.
- [ ] Export ZIP.
- [ ] Export PDF.
- [ ] Verify audit entries exist for create, assign, upload.
- [ ] Verify uploaded object exists in R2 bucket under `evidence/...`.

### Evidence to save
- [ ] Screenshot for each major action.
- [ ] One pass/fail summary table with timestamp.

### Exit criteria
- [ ] All core flows pass.
- [ ] No unexplained 5xx errors during test window.

---

## Section 2 - Monitoring and Alerting (Priority P0)
Owner: Developer/Ops
Target: Today

### Why this matters
If production breaks, you need immediate visibility.

### Basic setup map (already supported in code)
- Backend Sentry initialization: [backend/src/config/monitoring.ts](backend/src/config/monitoring.ts)
- Backend error capture entry points: [backend/src/index.ts](backend/src/index.ts)
- Frontend Sentry initialization: [frontend/src/index.tsx](frontend/src/index.tsx)

### Value guidance
All runtime configuration values referenced below (DSNs, keys, URLs) should be placed into your hosting provider's secret manager and not committed into the repository. The steps in this document tell you exactly which environment variables to set; the values themselves must be exchanged securely with your Ops lead.

### Setup steps
- [x] Create (or open) one Sentry project for backend.
- [x] Create (or open) one Sentry project for frontend.
- [x] In Render backend production env, set `SENTRY_DSN`.
- [x] In Render backend production env, set `SENTRY_TRACES_SAMPLE_RATE=0.1`.
- [x] In Render frontend production env, set `REACT_APP_SENTRY_DSN`.
- [x] In Render frontend production env, set `REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.1`.
- [x] Save and redeploy backend and frontend.

### Beginner steps: backend env in Render
1. Open Render dashboard -> backend service -> Environment.
2. Add `SENTRY_DSN` from backend Sentry project.
3. Add `SENTRY_TRACES_SAMPLE_RATE` with value `0.1`.
4. Click Save Changes and wait for deploy complete.

### Beginner steps: frontend env in Render
1. Open Render dashboard -> frontend service -> Environment.
2. Add `REACT_APP_SENTRY_DSN` from frontend Sentry project.
3. Add `REACT_APP_SENTRY_TRACES_SAMPLE_RATE` with value `0.1`.
4. Click Save Changes and wait for deploy complete.

### Alert routing setup
- [x] In Sentry, create one alert rule for "new issue" -> route to Slack or email.
- [x] Add at least one human owner to receive critical notifications.
- [x] Confirm notification channel receives test message.

### Controlled validation (safe and simple)
Use one invalid API request that should produce a server-side captured error in logs and Sentry.

```bash
curl -i https://trey-backend-d35i.onrender.com/api/obligations/not-a-uuid
```

If this does not generate a Sentry issue, use a known failing action in UI (for example, invalid payload on protected API route), then re-check Sentry Issues.

### Evidence to save
- [x] Screenshot: backend env vars set in Render.
- [x] Screenshot: frontend env vars set in Render.
- [x] Screenshot: Sentry issue created from controlled validation.
- [x] Screenshot: Slack/email alert delivery.

### Public-safe publishing checklist (if sharing externally)
- [x] Mask DSN values in screenshots.
- [x] Mask account IDs, token IDs, and secret fields.
- [x] Mask user emails if not intended for public release.
- [x] Keep only process steps and outcomes visible.

### Exit criteria
- [x] Test exception visible in Sentry.
- [x] Alert delivered to selected channel.
- [x] At least two owners confirmed for alert response coverage.

---

## Section 3 - Backup and Recovery Verification (Priority P0)
Owner: Founder + Developer
Target: **DEFERRED (Running on Free Tier)**

### Why this matters
Backups are only useful if restore has been tested. Currently on free-tier database which may not support automated backups/PITR. Manual dumps (`pg_dump`) or future upgrade required before heavy production load.

### Steps
- [x] Acknowledge free-tier limitations for automated backups.
- [ ] *[Deferred]* Upgrade database to paid tier to enable automated backups.
- [ ] *[Deferred]* Confirm blackout schedule and retention policy.
- [ ] *[Deferred]* Run one restore drill to a non-production target.
- [ ] *[Deferred]* Document exact restore procedure.

### Exit criteria
- [x] Limitations documented and accepted for Go-Live.

---

## Section 4 - CI/CD Guarded Deployment (Priority P1)
Owner: Developer
Target: Next 24 hours

### Why this matters
Prevents unsafe manual releases and enforces quality gates.

### Steps
- [ ] Create/copy backend Render deploy hook URL.
- [ ] Create/copy frontend Render deploy hook URL.
- [ ] Add GitHub repository secret: `RENDER_BACKEND_DEPLOY_HOOK`.
- [ ] Add GitHub repository secret: `RENDER_FRONTEND_DEPLOY_HOOK`.
- [ ] Verify workflow in `.github/workflows/ci.yml` runs checks before deploy.
- [ ] Confirm deploy hook execution is only on main branch after successful checks.
- [ ] Run one controlled pipeline test with a no-op commit.

### Optional verification commands
```bash
git commit --allow-empty -m "chore: verify production deploy hook pipeline"
git push origin main
```

### Exit criteria
- [ ] CI checks pass.
- [ ] Deployment triggers only after green checks.

---

## Section 5 - Credential Rotation and Security Hygiene (Priority P1)
Owner: Founder + Developer
Target: Within 48 hours

### Why this matters
Any shared or previously exposed credential must be treated as compromised.

### Rotation checklist
- [ ] Rotate R2 access key and secret.
- [ ] Rotate production JWT secret.
- [ ] Rotate Google OAuth client secret (if previously shared).
- [ ] Rotate SMTP credentials (if configured).
- [ ] Revoke old credentials.
- [ ] Update all new credentials only in secret managers.
- [ ] Add quarterly rotation calendar reminder.

### Exit criteria
- [ ] Old credentials revoked.
- [ ] Rotation log updated with date and owner.

---

## Section 6 - Founder Go-Live Readiness Package (Priority P1)
Owner: Founder
Target: Next 48-72 hours

### Why this matters
Operational readiness avoids chaos during first customer onboarding.

### Steps
- [ ] Create one-page incident SOP.
- [ ] Define first responder and escalation path.
- [ ] Create first-customer onboarding checklist.
- [ ] Define day-1 reliability metrics.
- [ ] Define daily review ritual for first 7 days.

Suggested day-1 metrics:
- Login success rate
- Evidence upload success rate
- Export success rate
- 5xx error count
- Median API response time

### Exit criteria
- [ ] SOP and onboarding checklist published.
- [ ] Metrics tracking started.

---

## Go/No-Go Gate
Proceed to active customer rollout only if all items below are true:
- [ ] Section 1 passed
- [x] Section 2 passed
- [x] Section 3 passed (Accepted Free-Tier Risk)
- [ ] Section 4 passed
- [ ] Section 5 passed

If any section fails:
1. Stop release.
2. Open blocker issue with owner and ETA.
3. Re-run relevant validation after fix.

---

## Daily Founder Control Loop (First 14 Days)
- [ ] Review production errors each morning.
- [ ] Review tester/customer friction daily.
- [ ] Approve only reliability-critical or customer-critical changes.
- [ ] Maintain short end-of-day release risk note.

---

## Quick Notes
- Domain purchase/custom domain can be deferred temporarily if Render URLs are acceptable for controlled early users.
- Do not defer monitoring, backup restore validation, or smoke sign-off.
