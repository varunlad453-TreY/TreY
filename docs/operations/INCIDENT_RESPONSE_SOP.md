# Incident Response SOP (Standard Operating Procedure)

**Target audience:** First responder, on-call engineer, founder.  
**Scope:** Production outages, data integrity issues, security incidents affecting TreYce production.  
**Last updated:** May 4, 2026.

---

## Quick Escalation Path

### Tier 1: First Responder (immediate)
- **Owner:** Developer on-call (start with Founder during first 7 days).
- **Action:** Verify incident (check Sentry, Render dashboard, R2 status, db logs).
- **Decision gate:** Is it a real production incident?
  - **Yes → escalate to Tier 2.**
  - **No → log as false alarm, document in incident log, done.**

### Tier 2: Incident Commander (within 5 min)
- **Owner:** Founder.
- **Action:** Declare incident, start incident clock, assign responder + comms lead.
- **Decision gate:** Is it a customer-facing outage?
  - **Yes → activate customer comms (Tier 3).**
  - **No → internal fix-and-monitor mode.**

### Tier 3: Customer Comms Lead (within 10 min if customer-facing)
- **Owner:** Founder or designated comms person.
- **Action:** Notify affected customers of incident, provide ETA for resolution.
- **Format:** Slack message to customer (via direct channel or shared incident room).

---

## Response Playbook: What to Do First

### Step 1: Verify the Incident (2–3 min)
**Who:** First Responder.

1. Open Sentry dashboard ([production backend project](https://sentry.io/)) → check for errors in last 5 min.
2. Open Render dashboard → check backend and frontend service status.
3. Confirm database is responding: ping connection pool or check Render db metrics.
4. Confirm R2 bucket is reachable: ping a test upload or check CloudFlare R2 status page.
5. **Log finding:** "Incident confirmed: [system affected]. Escalating to IC."

### Step 2: Incident Commander Takes Control (0–5 min)
**Who:** Founder / IC.

1. Open incident tracking document (link in Quick Links below).
2. Log: **Incident start time, affected system, initial severity (Critical / High / Medium / Low)**.
3. Assign **Responder** (the person fixing it) and **Comms Lead**.
4. Set a check-in cadence: every 5 min for Critical, every 10 min for High.

### Step 3: Responder Diagnoses and Fixes (0–30 min target)
**Who:** Assigned Responder.

**If it's a code issue:**
- Check recent commits/deploys via GitHub Actions.
- Roll back last deploy if recent change correlates with incident.
- Or: fix the code, run tests locally, commit, push, and let CI/CD deploy.

**If it's a data/database issue:**
- Check database logs in Render or db admin panel.
- Check for slow queries or connection exhaustion.
- If corrupted data: pause the affected service, investigate, and restore from backup if needed (see backup runbook).

**If it's an infrastructure issue (R2, db down):**
- Check CloudFlare/Render status pages.
- Contact support if outage is on their end.
- If internal: restart services or failover as documented.

### Step 4: Verify Fix and Comms (once fixed)
**Who:** Responder + IC.

1. **Responder:** Confirm fix works (test in production, check Sentry for new errors).
2. **IC:** Update incident log with resolution time and root cause.
3. **Comms Lead:** Notify customers the incident is resolved (if they were notified earlier).
4. **All:** Schedule post-incident review within 24 hours.

---

## Quick Links (Update These After Go-Live)

- **Sentry Backend Dashboard:** https://sentry.io/organizations/trey/issues/?project=BACKEND_PROJECT_ID
- **Sentry Frontend Dashboard:** https://sentry.io/organizations/trey/issues/?project=FRONTEND_PROJECT_ID
- **Render Dashboard:** https://dashboard.render.com/ → TreYce account
- **R2 Bucket:** CloudFlare R2 console → trey-evidence bucket
- **Database Admin:** Render or external db admin tool (if not Render-hosted)
- **Incident Log Template:** (create shared document link, e.g., Google Docs or Notion)

---

## Runbook: Common Scenarios

### Scenario 1: Backend Service Down (Sentry shows 5xx errors)

1. Open Render dashboard → backend service.
2. Check "Deploy" tab → was there a recent failed deploy?
   - If yes: re-trigger deploy or roll back.
3. Check "Logs" tab → look for OOM, connection pool exhaustion, or hard crashes.
4. If logs are clean but service is down: restart the service (Render has a restart button).
5. Verify fix: open https://trey-backend-d35i.onrender.com/health (or equivalent health endpoint) → expect 200 OK.

### Scenario 2: Database Connection Pool Exhausted (app hangs)

1. Check Render database metrics for connection count.
2. Identify if there's a code leak (open connections not closed).
   - Check recent commits that touch database calls.
   - Roll back or fix the connection leak.
3. Restart the backend service to clear stale connections.
4. Monitor connection count for 5 min to confirm it stabilizes.

### Scenario 3: Evidence Upload Fails (R2 Errors)

1. Check CloudFlare R2 dashboard for bucket health.
2. Verify R2 credentials in Render env vars haven't expired.
3. Test a manual file upload to R2 using the S3 CLI or a test script.
4. If credentials are stale: rotate them (see Section 5 in go-live doc) and restart backend service.

### Scenario 4: Frontend Blank Screen (React App Doesn't Load)

1. Open browser dev tools → check console for JavaScript errors.
2. Check Sentry frontend dashboard for client-side exceptions.
3. If errors point to API calls: check if backend is responding (Scenario 1).
4. If app code error: check Render frontend service logs and recent deploys.
5. Restart frontend service if needed.

---

## Incident Log Template

When an incident occurs, fill in this log:

```
**Incident ID:** INC-[DATE]-[COUNTER] (e.g., INC-2026-05-04-001)
**Timestamp Start:** [UTC time]
**Affected System(s):** [backend|frontend|database|r2|all]
**Severity:** [Critical|High|Medium|Low]
**First Responder:** [Name]
**Incident Commander:** [Name]
**Root Cause (post-investigation):** [Description]
**Resolution:** [What was done to fix it]
**Timestamp End:** [UTC time]
**Duration:** [Minutes]
**Follow-up Actions:** [Improvements to prevent recurrence]
**Post-Incident Review Scheduled:** [Date/Time]
```

---

## Escalation Owners (Fill In Your Names)

| Role | Name | Phone | Slack |
| --- | --- | --- | --- |
| **Primary On-Call** | [Founder/Dev] | [+1-XXX-XXX-XXXX] | @[slack-handle] |
| **Backup On-Call** | [TBD] | [+1-XXX-XXX-XXXX] | @[slack-handle] |
| **Database Admin** | [Founder/DBA] | [+1-XXX-XXX-XXXX] | @[slack-handle] |
| **Customer Comms** | [Founder/CEO] | [+1-XXX-XXX-XXXX] | @[slack-handle] |
| **Executive Escalation** | [CEO/Board] | [+1-XXX-XXX-XXXX] | @[slack-handle] |

---

## Post-Incident Review (Within 24 Hours)

1. **What happened?** Timeline of events.
2. **Why did it happen?** Root cause analysis.
3. **What did we do right?** Recognition.
4. **What can we improve?** Action items for next time.
5. **Follow-ups:** Who owns each action, by when?

Example output: "Next time, we'll add a database connection pool alert at 80% to catch exhaustion before it causes outages."

---

## Keeping This SOP Current

- Review this SOP monthly or after each incident.
- Update escalation contact info quarterly.
- Update Quick Links whenever infrastructure changes.
- Share updates with the team via Slack #operations channel.
