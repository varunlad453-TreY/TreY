# Daily Review Ritual: First 7 Days Post-Launch

**Target audience:** Founder, product/ops lead, customer success.  
**Scope:** Structured daily ritual for the first week after first customer goes live.  
**Why:** Tight feedback loop catches issues before they grow into outages or customer churn.  
**Duration:** 30 min per day.  
**Last updated:** May 4, 2026.

---

## Daily Ritual Agenda (30 min)

### Time Block: 30 Minutes Every Morning (9 AM UTC / 2:30 PM IST Recommended)

**Participants:**
- Founder (always).
- Developer on-call (if issues exist).
- Customer success / ops lead (if applicable).

**Format:** Jira comments / Confluence discussion or 15-min Zoom sync. Do not skip.

---

## Checklist: What to Review Each Day

### 1. Overnight Health Check (5 min)
**Owner:** Founder (review before the meeting).

**Steps:**
1. Open Sentry dashboard (backend + frontend).
2. Check for any **new critical errors** overnight.
   - If yes: note the error, take a screenshot, add to agenda.
3. Open Render dashboard → check service uptime.
4. Check CloudFlare status page for any R2 or DNS issues.
5. **Log finding:** "No issues overnight" or "1 critical error detected: [error name]".

**If red:**
- Escalate to on-call developer.
- Add to agenda for root cause review.

---

### 2. Production Metrics Review (10 min)
**Owner:** Founder or ops lead.

**Steps:**
1. **Check 5 Day-1 Metrics** (see DAY1_METRICS_DASHBOARD.md for details):
   - [ ] Login Success Rate: _____ (target ≥ 99%)
   - [ ] Upload Success Rate: _____ (target ≥ 99.5%)
   - [ ] Export Success Rate: _____ (target ≥ 98%)
   - [ ] 5xx Errors (per hour): _____ (target ≤ 5)
   - [ ] Median API Latency (p50): _____ (target ≤ 500ms)

2. **Document trends:**
   - Compared to yesterday: 📈 Better / ➡️ Same / 📉 Worse
   - Any yellow/red zones? → Add action item.

3. **Audit Log Check:**
   - Customer should have logged in ≥ 1x since yesterday.
   - Evidence uploads should appear (at least 1 per day expected).
   - Exports should be generated (at least 1 per week expected).
   - If audit log is quiet: customer may not be using the product → action item: reach out to customer.

4. **Database Performance:**
   - Open Render db metrics → check query latency, connection count.
   - If latency > 500ms on any query: note for optimization.

**Template for log:**
```
**Day [N] Metrics (Date):**
- Login: [%] (vs. Day [N-1]: [%]) 📈/➡️/📉
- Upload: [%] (vs. Day [N-1]: [%]) 📈/➡️/📉
- Export: [%] (vs. Day [N-1]: [%]) 📈/➡️/📉
- 5xx/hr: [#] (vs. Day [N-1]: [#]) 📈/➡️/📉
- Latency p50: [ms] (vs. Day [N-1]: [ms]) 📈/➡️/📉
- Audit log activity: [description]
```

---

### 3. Customer Feedback Collection (5 min)
**Owner:** Founder or customer success lead.

**Steps:**
1. **Check Jira/Support queue:** Review the customer's Jira project or Service Management portal.
   - Any new tickets or customer messages? (Questions, issues, feature requests?)
   - If yes: respond within 2 hours. Log issue and update the Jira ticket.
2. **Email check:** Scan for customer emails since yesterday.
   - Any replies to onboarding summary or status updates?
3. **Optional: Quick call or email / Jira message to customer.**
   - "Hey [customer name], how's everything going with TreYce? Any hiccups?"
   - Log their feedback in the Jira ticket or Confluence page.

**If red (customer complaint or issue):**
- Priority 1: Acknowledge in the Jira ticket or via email and provide ETA for fix.
- Priority 2: Escalate to developer if technical.
- Priority 3: Add to action items and track resolution in Jira.

**Template for log:**
```
**Customer Feedback:**
- Message 1: [Issue/Question] → Status: [Acknowledged/Resolved/In Progress]
- Message 2: [Feature Request] → Status: [Backlog/Noted]
- Overall sentiment: 😊 Positive / 😐 Neutral / 😞 Negative
- Action required: [Yes/No] → [What?]
```

---

### 4. Blockers & Action Items Review (5 min)
**Owner:** Entire sync group.

**Steps:**
1. **Review open action items from yesterday** (use shared doc).
   - What was due today? Did it get done?
   - If not: update ETA and owner, or escalate.
2. **Add new action items** from the review above (metrics, customer feedback, errors).
3. **Assign owners** for each action item.
4. **Set ETA:** "Fix by EOD today" or "Fix by tomorrow morning" or "Defer to post-week-1".

**Template for log:**
```
**Action Items:**
| Item | Owner | ETA | Status |
| --- | --- | --- | --- |
| [Action 1] | [Name] | EOD [Date] | 🟢 In Progress |
| [Action 2] | [Name] | EOD [Date] | 🟡 Blocked |
| [Action 3] | [Name] | [Date+1] | 🟢 Not Started |
```

---

## Weekly Cadence: Friday End-of-Day Sync

**Duration:** 1 hour (Friday 5 PM UTC / 10:30 PM IST).  
**Participants:** Founder + full team (dev, ops, customer success).

**Agenda:**
1. **Week-in-review:** Summarize 5-day metrics trends (see DAY1_METRICS_DASHBOARD.md).
2. **Customer health:** How is the first customer doing? What's their sentiment?
3. **Lessons learned:** What went well? What broke? What would we do differently?
4. **Next week priorities:** What's the focus for week 2? More customers? Feature fixes?
5. **Go/no-go:** Is it safe to onboard customer #2, or do we need to stabilize first?

**Output:** Shared document with week-1 summary, metrics graph, and decision on week-2 plan.

---

## Template: Daily Standup Log (Copy Each Day)

```
---

## Day [N]: [Date] – Daily Standup

**Time:** [Start time] UTC  
**Attendees:** [Names]

### Overnight Health Check
- New critical errors: [None / Describe]
- Service uptime: ✓ (100%) / ✗ (describe downtime)
- External services: ✓ R2 OK / ✓ OAuth OK / ✗ [describe issue]

### Metrics (Target: 🟢 All Green)
| Metric | Value | Target | Status |
| --- | --- | --- | --- |
| Login Success | [%] | ≥ 99% | 🟢/🟡/🔴 |
| Upload Success | [%] | ≥ 99.5% | 🟢/🟡/🔴 |
| Export Success | [%] | ≥ 98% | 🟢/🟡/🔴 |
| 5xx Errors/hr | [#] | ≤ 5 | 🟢/🟡/🔴 |
| Median Latency | [ms] | ≤ 500ms | 🟢/🟡/🔴 |

**Trend vs. yesterday:** 📈 Improving / ➡️ Stable / 📉 Degrading

-### Customer Feedback
- Jira tickets / Support messages: [None / Describe]
- Email: [None / Describe]
- Sentiment: 😊 Positive / 😐 Neutral / 😞 Negative
- Action required: [Yes/No → Describe]

### Open Action Items
| Item | Owner | ETA | Status |
| --- | --- | --- | --- |
| [Item 1] | [Owner] | [ETA] | 🟢/🟡/🔴 |
| [Item 2] | [Owner] | [ETA] | 🟢/🟡/🔴 |

### Decision
- ✓ All systems green, continue as planned.
- ⚠️ Minor issues, monitor closely, proceed with caution.
- ✗ Critical issue detected, escalate and pause new customer onboarding.

**Owner/Recorder:** [Name]  
**Reviewed by:** [Founder] at [Time]

---
```

---

## Escalation Paths During Daily Sync

**If critical error detected:**
- Notify on-call developer immediately.
- Open incident SOP (see INCIDENT_RESPONSE_SOP.md).
- Pause agenda, focus on diagnosis and fix.

**If customer complaint:**
- Acknowledge in the Jira ticket or via email within 30 min.
- Provide ETA or workaround within 2 hours and update the Jira ticket.
- Follow up in the Jira ticket once resolved.

**If metrics red:**
- Investigate root cause (see DAY1_METRICS_DASHBOARD.md runbooks).
- Decide: Fix today (blocker) or tomorrow (lower priority)?
- Update customer if it affects them.

---

## After 7 Days: Transition to Normal Operations

Once you've completed 7 days of launches successfully:

1. **Reduce sync frequency** from daily to 3x/week (e.g., Mon, Wed, Fri).
2. **Metrics review** stays daily but becomes async (Founder reviews dashboard, logs findings in a Jira ticket or Confluence page).
3. **Weekly review** continues (Friday end-of-day full team sync).
4. **Customer touchpoints** move from daily to weekly check-ins.
5. **Incident response** remains on-call ready (no change).

---

## Archive & Documentation

At the end of each day, save the standup log to a shared folder:
- **Location:** `docs/operations/daily-standups/Day-[N]-[Date].md` (or shared Google Doc).
- **Share:** Link to daily standups in Confluence and add the page link to the team's Jira project or internal docs.
- **Retention:** Keep for at least 30 days; archive older logs quarterly.

---

## Quick Reminders

- **Do not skip the daily sync,** even if "everything seems fine." Early issue detection is worth the 30 min.
- **Be honest about issues.** If something is broken or slow, say it. That's why the ritual exists.
- **Customer-first mindset.** Every decision should ask: "Will this make the customer happier?"
- **Document everything.** Future you (or your team) will need to understand what happened and why.
