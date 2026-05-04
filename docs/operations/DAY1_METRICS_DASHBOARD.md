# Day-1 Metrics and Monitoring Dashboard

**Target audience:** Founder, ops person, monitoring/SRE.  
**Scope:** Define the 5 key metrics for first-customer launch and where to track them.  
**Why:** You need to know in real-time whether the product is healthy in early usage, not after customer complaints.  
**Last updated:** May 4, 2026.

---

## The 5 Day-1 Metrics

### 1. **Login Success Rate**
**What it measures:** Percentage of login attempts that succeed (not blocked by auth errors).  
**Target:** ≥ 99% (no more than 1 failed login per 100 attempts).  
**Where to track:**
- **Sentry:** Search for auth controller errors (e.g., `AuthController` → filter by errors tagged `auth_failure`).
- **Backend logs:** Render logs → search for `login_failed` or similar error message.
- **Calculation:** `(successful_logins / total_login_attempts) * 100`.

**Action if red:**
- If < 99%: Check Sentry for specific auth errors. Common causes: Google OAuth token expired, JWT secret mismatch, database down.
- Fix: Restart backend service, verify JWT_SECRET in Render env vars, check Google OAuth app settings.

**Evidence to track:** Screenshot of Sentry dashboard or backend logs showing login success count, timestamp.

---

### 2. **Evidence Upload Success Rate**
**What it measures:** Percentage of evidence file uploads that complete without error.  
**Target:** ≥ 99.5% (aim higher here—data loss is critical).  
**Where to track:**
- **Sentry:** Search for `storageService` errors or `R2Error` events. Look for upload failures tagged by customer.
- **R2 Bucket:** CloudFlare console → bucket metrics → successful uploads vs. failed uploads.
- **Backend logs:** Search for `evidence_upload_failed` or R2 API error responses.
- **Calculation:** `(successful_uploads / total_upload_attempts) * 100`.

**Action if red:**
- If < 99.5%: Check R2 credentials (may have expired). Check CloudFlare R2 status page. Test manual upload.
- Fix: Rotate R2 credentials if needed (Section 5), restart backend, confirm CloudFlare connectivity.

**Evidence to track:** Screenshot of R2 bucket upload metrics or Sentry events showing upload attempts and success count.

---

### 3. **Export Success Rate**
**What it measures:** Percentage of export requests (ZIP or PDF) that complete without error and are delivered to user.  
**Target:** ≥ 98% (slightly lower tolerance than upload, but still high).  
**Where to track:**
- **Sentry:** Search for `exportController` errors or PDF/ZIP generation failures.
- **Backend logs:** Search for `export_failed` or file system errors (e.g., disk full).
- **Frontend logs:** Check browser console for download failures (e.g., network error after generation).
- **Calculation:** `(successful_exports / total_export_requests) * 100`.

**Action if red:**
- If < 98%: Check if PDF/ZIP library is crashing (check backend logs for stack traces). Check disk space on backend. Test export manually.
- Fix: Restart backend service, check for disk space, verify export dependencies are installed (e.g., `pdfkit` or similar).

**Evidence to track:** Screenshot of Sentry `exportController` errors or backend logs showing export attempts and failures.

---

### 4. **5xx Error Count (per hour)**
**What it measures:** Number of unhandled server errors (HTTP 500) per hour in production.  
**Target:** ≤ 5 per hour during business hours (0 is ideal, but a few expected).  
**Where to track:**
- **Sentry:** Group by issue type → filter by `HTTP 500` or status `error`. Count new issues per hour.
- **Backend logs:** Search for `5xx` or `error` level logs. Group by hour.
- **Render dashboard:** Check service health indicator (green = healthy, red = errors).
- **Calculation:** Count of unique error stack traces per hour. Use Sentry aggregation.

**Action if red:**
- If > 5 per hour: Open Sentry Issues tab, identify the top error (by count). Click on it to see error message and stack trace.
- Common fixes: Restart backend (transient error), fix code bug and re-deploy, check external service connectivity (R2, db, OAuth).

**Evidence to track:** Screenshot of Sentry Issues grouped by severity, showing count and timeframe.

---

### 5. **Median API Response Time (p50 latency)**
**What it measures:** Middle value (50th percentile) of all API response times. Indicates typical user experience.  
**Target:** ≤ 500 ms (users perceive < 1 sec as instant; 500ms gives buffer).  
**Where to track:**
- **Sentry:** Performance tab → view transaction durations.
- **Render dashboard:** Metrics tab → see request latencies.
- **Application Monitoring (optional):** If using New Relic, DataDog, or similar APM tool, they track p50 latency.
- **Backend logs:** If logging request times, calculate `(response_time_ms)` for each endpoint, then sort and take the median.
- **Calculation:** Sort all endpoint response times, take the middle value. Exclude outliers or very slow operations.

**Action if red:**
- If > 500 ms: Likely database query is slow. Check Render db metrics for slow queries. Look for N+1 query problems in code.
- Fix: Add database indexes (common: `obligations.user_id`, `evidence.obligation_id`), upgrade database tier, optimize ORM queries.

**Evidence to track:** Screenshot of Sentry Performance tab showing transaction durations, or Render metrics dashboard showing response time trend.

---

## How to Set Up Monitoring

### Option 1: Manual Checks (Founder Personally Reads Dashboards)
**Cost:** $0 / Free.  
**Effort:** 5–10 min per check.  
**Frequency:** Every 30 min during first 7 days of customer launch.

**Steps:**
1. Set a reminder every 30 min (use phone alarm or calendar).
2. Open Sentry dashboard (all 5 metrics).
3. Take a screenshot, note the values in a shared doc (see "Daily Log" template below).
4. If any metric is red, escalate to responder.

### Option 2: Automated Alerts (Recommended for Scale)
**Cost:** Varies (Sentry free tier includes 1 alert rule, Render has built-in health checks).  
**Effort:** 30 min one-time setup.  
**Frequency:** Real-time alerts via Slack/email.

**Setup:**
1. **Sentry Alerts:** Create alert rule for each metric.
   - Condition: `Error count > 5 per hour` → send to `#alerts` Slack channel.
   - Condition: `Transaction duration (p50) > 500ms` → send to `#alerts` Slack channel.
2. **Render Health Checks:** Enable automatic restart if backend service crashes (Render dashboard → service settings → health checks).
3. **CloudFlare R2 Alerts:** Set up alerts if upload/download errors spike (CloudFlare console → notifications).

---

## Daily Metrics Log Template

Use this template to log metrics once per day (preferably at end of business day or start of next day) during the first 7 days.

```
## Day 1: [Date]

**Monitoring Period:** [Start time] – [End time] UTC

### Metrics Summary
| Metric | Value | Status | Notes |
| --- | --- | --- | --- |
| Login Success Rate | [%] | 🟢/🟡/🔴 | [Any errors? Any pattern?] |
| Evidence Upload Success Rate | [%] | 🟢/🟡/🔴 | [Any failed uploads? Any customers affected?] |
| Export Success Rate | [%] | 🟢/🟡/🔴 | [PDF or ZIP generation issues?] |
| 5xx Error Count (per hour) | [#] | 🟢/🟡/🔴 | [Top error type? Stack trace link?] |
| Median API Response Time (p50) | [ms] | 🟢/🟡/🔴 | [Slow endpoints? DB bottleneck?] |

### Incidents
- [ ] Any outages? [Describe]
- [ ] Any performance degradations? [Describe]
- [ ] Any customer complaints? [Describe]

### Actions Taken
1. [Action 1]
2. [Action 2]

### Follow-ups for Tomorrow
1. [Follow-up 1]
2. [Follow-up 2]

**Owner:** [Name]  
**Reviewed by:** [Founder/IC] at [Time]
```

---

## Acceptable Ranges (Red / Yellow / Green)

| Metric | 🟢 Green | 🟡 Yellow | 🔴 Red | Action |
| --- | --- | --- | --- | --- |
| **Login Success** | ≥ 99% | 95–99% | < 95% | Investigate auth immediately |
| **Upload Success** | ≥ 99.5% | 98–99.5% | < 98% | Check R2, restart backend |
| **Export Success** | ≥ 98% | 95–98% | < 95% | Check PDF/ZIP generation, disk space |
| **5xx Errors/hr** | ≤ 2 | 3–5 | > 5 | Open Sentry, fix top error |
| **Median Latency** | ≤ 300ms | 300–500ms | > 500ms | Check DB queries, consider scaling |

---

## Weekly Review (Every Monday for 4 Weeks Post-Launch)

Once per week, calculate the **weekly average** for each metric. Track trends:

```
**Week of [Date]:**
- Login Success Rate (avg): [%]
- Upload Success Rate (avg): [%]
- Export Success Rate (avg): [%]
- 5xx Errors (total count): [#]
- Median API Latency (avg): [ms]

**Trend:** 📈 Improving / ➡️ Stable / 📉 Degrading

**Notes:** [Any patterns observed?]
```

If degrading, schedule a post-mortem to identify root causes and improvements.

---

## Quick Reference: Metric Thresholds in Code

If you want to automate alerting, use these thresholds:

```javascript
// Example: Sentry Alert Condition
{
  "conditions": [
    {
      "event.transaction": "api.obligations.create",
      "event.duration": "> 500ms"
    }
  ],
  "notify": "slack:#alerts"
}

// Example: Error rate alert
{
  "conditions": [
    {
      "event.level": "error",
      "event.environment": "production",
      "time_window": "1h"
    }
  ],
  "threshold": "> 5",
  "notify": "slack:#alerts"
}
```

---

## Integration with Incident Response

If any metric goes red for more than 5 minutes:
1. **Log the alert** in your incident tracking system.
2. **Notify the First Responder** (see INCIDENT_RESPONSE_SOP.md).
3. **Begin diagnosis** following the runbook for that metric (see sections above).
4. **Document the outage** and follow-up actions in the daily metrics log.

---

## After Day 7: Transition to Ongoing Monitoring

By day 8, if all metrics are consistently green:
- [ ] Shift to daily (instead of hourly) checks.
- [ ] Establish a weekly review cycle (see "Weekly Review" section above).
- [ ] Consider scaling up infrastructure if trends show growth in error rates or latency.
- [ ] Add more granular metrics as product matures (e.g., audit log ingestion latency, evidence storage usage).
