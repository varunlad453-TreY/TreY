# First-Customer Onboarding Checklist

**Target audience:** Founder, ops person, customer success lead.  
**Scope:** Step-by-step checklist for onboarding the first paying customer to TreYce production.  
**Repetition:** Use this checklist for every new customer, every time. Do not deviate.  
**Last updated:** May 4, 2026.

---

## Pre-Onboarding (1–2 days before)

### Internal Prep
- [ ] **Verify production is stable:** Check Sentry dashboard for any unresolved critical issues in past 48 hours.
- [ ] **Confirm customer details are captured:** Customer name, primary contact email, org size, compliance domain (e.g., healthcare, finance).
- [ ] **Reserve a Slack channel:** Create `#customer-[name]-support` for this customer's issues.
- [ ] **Prepare customer credentials:** Customer will need a login. Confirm Google Workspace SSO is live and customer's email is valid.
- [ ] **Document customer scope:** What obligations or compliance frameworks is the customer importing? (e.g., ISO 27001 checklist, HIPAA audit items).

---

## Day 1: Account Setup (30 min)

### 1. Create Customer Account in TreYce
- [ ] Log in to TreYce production dashboard as founder/admin.
- [ ] Navigate to Admin → Customers or Org Management (exact path depends on app structure).
- [ ] Create new customer account:
  - Customer name: [_______________]
  - Primary contact email: [_______________]
  - Org size: [_______________]
  - Compliance domain: [_______________]
- [ ] **Evidence to save:** Screenshot of customer account created with account ID visible.

### 2. Enable Google Workspace SSO for Customer
- [ ] Confirm customer's email domain is Google Workspace-managed.
- [ ] Add customer's email domain to the Google OAuth allowed list (check auth config in backend or Render env vars).
- [ ] Test: Have customer attempt login via Google → should succeed and create user record.
- [ ] **Evidence to save:** Screenshot of customer successfully logged in to dashboard.

### 3. Walk Customer Through Dashboard Tour (15 min, live or async recording)
**Via Zoom or pre-recorded video:**
- [ ] Show the Obligations page (empty, ready for import).
- [ ] Show the Evidence section (empty, ready for uploads).
- [ ] Show the Audit log (empty, will populate as customer uses the app).
- [ ] Show Export options (ZIP and PDF—show sample export).
- [ ] Explain the workflow: Create obligation → Assign owner → Upload evidence → Export report.
- [ ] **Evidence to save:** Record the screen share or share a demo video link with customer.

---

## Day 1–2: Data Import (if applicable, 1–2 hours)

### 1. Agree on Import Method
- [ ] **Option A (Recommended):** Customer provides CSV or spreadsheet of obligations → you import manually or via API.
- [ ] **Option B:** Customer logs in and creates obligations one by one in the UI.
- [ ] Document which option is chosen and why.
- [ ] **Evidence to save:** Email confirmation or Slack message confirming method.

### 2. Import Obligations (if Option A)
- [ ] Receive customer data (obligation title, due date, owner, description).
- [ ] Map to TreYce schema (title, due_date, assigned_to, notes).
- [ ] Validate data integrity (no missing required fields, dates are valid).
- [ ] Import into production (via API or manual creation—document exact steps used).
- [ ] Verify count: X obligations in spreadsheet → X obligations visible in dashboard.
- [ ] **Evidence to save:** Screenshot showing imported obligations in dashboard with count matching spreadsheet.

### 3. Assign Initial Owners
- [ ] For each obligation, confirm who the responsible owner is.
- [ ] Invite those owners to TreYce (they will auto-login via Google Workspace SSO).
- [ ] Verify owners can see their assigned obligations in the dashboard.
- [ ] **Evidence to save:** Screenshot showing at least one obligation assigned and visible to owner.

---

## Day 1–2: First Evidence Upload (1 hour)

### 1. Create Test Evidence
- [ ] Work with customer or their team to upload one real evidence file (e.g., a policy doc, audit report).
- [ ] File should be meaningful for their domain (e.g., if HIPAA compliance: a BAA document, access log export, or risk assessment).
- [ ] Upload via UI: Obligations → [Obligation name] → Upload Evidence → select file.
- [ ] Verify upload succeeds (no error message, file appears in the obligation).
- [ ] **Evidence to save:** Screenshot of evidence file listed in obligation with timestamp.

### 2. Confirm Evidence Stored in R2
- [ ] Log into CloudFlare R2 console.
- [ ] Navigate to `trey-evidence` bucket → `evidence/` folder.
- [ ] Confirm the uploaded file exists with correct filename and size.
- [ ] (Optional) Download the file from R2 to verify integrity.
- [ ] **Evidence to save:** Screenshot of file in R2 bucket with details (name, size, date).

### 3. Test Evidence Download
- [ ] Return to TreYce dashboard, find the uploaded evidence.
- [ ] Click Download → file should download successfully.
- [ ] Verify downloaded file is identical to the uploaded original (check file size, name).
- [ ] **Evidence to save:** Screenshot of downloaded file in user's downloads folder.

---

## Day 2–3: Export and Report Generation (30 min)

### 1. Create a Test Report (ZIP Export)
- [ ] Navigate to the customer's obligations list.
- [ ] Click Export → ZIP.
- [ ] System should generate a ZIP containing all obligations and evidence files.
- [ ] Download and extract the ZIP.
- [ ] Verify contents: obligations CSV + evidence files present.
- [ ] **Evidence to save:** Screenshot of extracted ZIP folder structure showing obligations and evidence.

### 2. Create a Test Report (PDF Export)
- [ ] Click Export → PDF.
- [ ] System should generate a PDF report with obligations and a summary.
- [ ] Download and open the PDF in a browser or PDF reader.
- [ ] Verify all obligations are listed with due dates and owners.
- [ ] Verify any uploaded evidence is referenced in the report.
- [ ] **Evidence to save:** Screenshot of the PDF opened, showing the first page and one evidence reference.

### 3. Send Reports to Customer for Review
- [ ] Email the ZIP and PDF to customer's primary contact.
- [ ] Ask for feedback: "Do these exports look correct? Any missing data or formatting issues?"
- [ ] Document customer feedback.
- [ ] **Evidence to save:** Email confirmation sent to customer with report attachments.

---

## Day 3: Audit Trail and Permissions Verification (30 min)

### 1. Review Audit Log
- [ ] Navigate to Audit log section.
- [ ] Verify that the following events are recorded:
  - [ ] Obligation created (by founder/import).
  - [ ] Obligation assigned to owner.
  - [ ] Evidence uploaded (by owner).
  - [ ] Export generated (by founder).
- [ ] Each entry should show: timestamp, user, action, object (obligation/evidence).
- [ ] **Evidence to save:** Screenshot of audit log showing at least 4 entries.

### 2. Test User Permissions
- [ ] Log out as founder.
- [ ] Log in as the customer (use customer email) via Google Workspace SSO.
- [ ] Verify customer can:
  - [ ] View only their own obligations (not other customers' data).
  - [ ] Upload evidence to assigned obligations.
  - [ ] Download evidence they uploaded.
  - [ ] Export reports for their own obligations.
- [ ] Verify customer **cannot:**
  - [ ] Edit obligation due dates or owners (if that's admin-only in your design).
  - [ ] Delete obligations.
  - [ ] See other customers' data.
- [ ] **Evidence to save:** Screenshot showing customer logged in, viewing their obligations only.

---

## Day 3: Performance and Health Check (15 min)

### 1. Monitor Sentry During Usage
- [ ] Open Sentry backend and frontend dashboards.
- [ ] Ask customer to perform 5–10 typical actions (create obligation, upload, download, export).
- [ ] Watch Sentry for any errors during this period.
- [ ] Expected: 0 new errors. If errors appear, investigate and fix before proceeding.
- [ ] **Evidence to save:** Screenshot of Sentry showing "0 unresolved issues" for this period.

### 2. Check Database Performance
- [ ] Open Render database metrics dashboard.
- [ ] Watch query latency and connection count during customer usage.
- [ ] Expected: Query response times < 500ms, connection count stable.
- [ ] If slow queries detected: note them for optimization after customer is live.
- [ ] **Evidence to save:** Screenshot of db metrics dashboard showing healthy values.

### 3. Confirm R2 Uploads/Downloads Are Fast
- [ ] Test R2 performance: upload a 10 MB file and measure time.
- [ ] Expected: upload completes in < 30 sec.
- [ ] Download same file and verify speed.
- [ ] Expected: download completes in < 20 sec.
- [ ] If slower: check CloudFlare status and R2 region configuration.
- [ ] **Evidence to save:** Timestamp or stopwatch screenshot showing upload/download times.

---

## Go-Live Readiness (End of Day 3)

### Final Checklist
- [ ] **All technical tests passed:** Data import ✓, uploads ✓, downloads ✓, exports ✓, audit log ✓.
- [ ] **No unresolved errors in Sentry** over the test period.
- [ ] **Customer can log in and use the app** without issues.
- [ ] **Permissions are correct:** customer sees only their data.
- [ ] **Performance is acceptable:** queries < 500ms, uploads/downloads < 30 sec.
- [ ] **Customer has been trained** on dashboard navigation and export options.
- [ ] **Support channel is live:** `#customer-[name]-support` Slack channel created and customer invited.

### Sign-Off
- [ ] Founder / Customer Success Lead: _____________________ (signature)
- [ ] Date: ___________________
- [ ] Customer Primary Contact: _____________________ (email confirmation)

### Post-Go-Live
- [ ] Email customer their login link and support Slack channel.
- [ ] Schedule a 1-week check-in: "How is TreYce working for you? Any issues?"
- [ ] Log this onboarding in the customer database (date, who led it, any issues encountered).

---

## Template: Onboarding Summary to Send Customer

```
Subject: Welcome to TreYce – Your Account is Live!

Hi [Customer Name],

Your TreYce compliance governance account is now live and ready to use.

**Your Account Details:**
- Email login: [customer email]
- Dashboard URL: https://trey-frontend-[id].onrender.com
- Support channel: #customer-[name]-support (on Slack)

**You're all set to:**
1. Create or import compliance obligations.
2. Assign obligations to team members.
3. Upload evidence and documents.
4. Export reports (ZIP or PDF) for audits.

**Next Steps:**
- Log in now and explore the dashboard.
- Upload your first evidence file to test the workflow.
- Reach out in #customer-[name]-support if you have any questions.

**Your dedicated support contact:** [Founder name] ([founder email])

Welcome aboard!

[Founder name]
TreYce Founder
```

---

## Common Issues During Onboarding & Quick Fixes

| Issue | Root Cause | Fix |
| --- | --- | --- |
| Customer can't log in | Email not in Google Workspace or not whitelisted in OAuth config | Add email to Google Workspace org + verify OAuth allowed domains in backend env vars |
| Evidence upload fails | R2 credentials expired or incorrect bucket permissions | Verify R2 credentials in Render env, test manual upload to R2 |
| Export is blank | No obligations or evidence in database | Confirm obligations were imported/created and evidence was uploaded |
| Audit log shows no events | App is not capturing events (missing instrumentation) | Check backend code for captureAuditEvent calls; verify events are being logged to database |
| Slow performance | Database query timeout or many concurrent users | Check Render db metrics, add indexes if needed, consider connection pooling |

---

## Repeat This Checklist for Every Customer

Do not take shortcuts. Do not skip steps. Every new customer deserves the same high-quality onboarding. Document any deviations and escalate to founder for decision.
