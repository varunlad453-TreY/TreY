# Production Rollout Sequence (Strict Order)

**Status:** Database live, Google Workspace OAuth working.
**Next:** Complete these 6 items in strict sequence before declaring production ready.

---

## 1. CREDENTIAL ROTATION & SECRET MANAGEMENT
**Estimated Time:** 30 mins
**Owner:** Ops/Deployment Lead

### 1.1 Identify Previously Exposed Credentials
Check git history for any committed secrets:
```bash
git log -S "DATABASE_URL" --oneline
git log -S "JWT_SECRET" --oneline
git log -S "S3_" --oneline
git log -S "GOOGLE_CLIENT" --oneline
```

### 1.2 Rotate All Secrets
- [ ] Generate new `JWT_SECRET` (minimum 32 chars, alphanumeric + special)
- [ ] Generate new `GOOGLE_CLIENT_SECRET` in Google Cloud Console (revoke old one)
- [ ] Generate new S3/R2 API credentials (delete old ones)
- [ ] Generate new SMTP credentials (if applicable)
- [ ] Store all rotated secrets ONLY in Render secret manager (do not commit)

### 1.3 Set Quarterly Rotation Cadence
Add to your ops calendar:
- Every 3 months: rotate `JWT_SECRET`, database password (if user-managed), S3 credentials
- Every 6 months: rotate `GOOGLE_CLIENT_SECRET`
- On each rotation: log the date and who performed it

### Verification
```bash
# Confirm no secrets appear in last 100 commits
git log -100 --oneline | grep -i secret || echo "✓ Clean"
```

### Go/No-Go
- [ ] All rotated secrets are in Render, not in git
- [ ] Rotation calendar is documented and shared with team

---

## 2. OBJECT STORAGE (S3/R2) PRODUCTION SETUP
**Estimated Time:** 45 mins
**Owner:** Ops/DevOps

### 2.1 Create Production Bucket
Using Cloudflare R2 (recommended) or AWS S3:

**Cloudflare R2:**
```bash
# Go to Cloudflare dashboard → R2 → Create bucket
# Bucket name: trey-evidence-prod
# Region: ap-south-1 (Asia Pacific - India)
```

**AWS S3:**
```bash
# Go to AWS Console → S3 → Create bucket
# Bucket name: trey-evidence-prod
# Region: ap-south-1
# Block all public access: YES
```

### 2.2 Create Least-Privilege IAM Policy
Create a token/access key with permissions ONLY for:
- `s3:PutObject` on `trey-evidence-prod/evidence/*`
- `s3:GetObject` on `trey-evidence-prod/evidence/*`
- `s3:DeleteObject` on `trey-evidence-prod/evidence/*`

**R2 Token Example:**
```json
{
  "name": "trey-production-token",
  "permissions": ["object:read", "object:write", "object:delete"],
  "bucket": "trey-evidence-prod"
}
```

**AWS IAM Policy Example:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::trey-evidence-prod/evidence/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::trey-evidence-prod",
      "Condition": {
        "StringLike": {
          "s3:prefix": "evidence/*"
        }
      }
    }
  ]
}
```

### 2.3 Set Environment Variables in Render
Go to Render Dashboard → trey-backend → Environment:

```
STORAGE_PROVIDER=s3
S3_BUCKET=trey-evidence-prod
S3_REGION=ap-south-1
S3_ENDPOINT=https://r2.example.com (for R2) OR leave blank (for AWS S3)
S3_ACCESS_KEY_ID=<your_access_key>
S3_SECRET_ACCESS_KEY=<your_secret_key>
```

### 2.4 Upload/Download Smoke Test
```bash
# SSH into Render backend or run locally with production DB URL
# Create an obligation, upload evidence, then download it
# Verify the file appears in your S3/R2 bucket console

curl -X POST http://localhost:5000/api/evidence/upload \
  -H "Authorization: Bearer <jwt_token>" \
  -F "file=@test.pdf"

# Should return: { "url": "s3://trey-evidence-prod/evidence/..." }
```

### Verification
- [ ] Bucket is created in ap-south-1 region
- [ ] IAM policy is least-privilege (read/write/delete on `evidence/*` only)
- [ ] All S3 env vars are set in Render (not in git)
- [ ] Upload/download smoke test passes
- [ ] Evidence files appear in S3/R2 console

---

## 3. DOMAIN & TLS CONFIGURATION
**Estimated Time:** 1 hour (mostly waiting for DNS propagation)
**Owner:** Ops/DevOps

### 3.1 Configure Frontend Domain
Go to Render Dashboard → trey-frontend → Settings:
- [ ] Add custom domain (e.g., `trey.yourcompany.com` or `app.trey.com`)
- [ ] Render will auto-generate SSL certificate
- [ ] Add CNAME record to your DNS provider pointing to Render
- [ ] Wait for DNS propagation (~5-30 mins)

### 3.2 Configure Backend API Domain
Go to Render Dashboard → trey-backend → Settings:
- [ ] Add custom domain (e.g., `api.trey.yourcompany.com`)
- [ ] Render will auto-generate SSL certificate
- [ ] Add CNAME record to your DNS provider
- [ ] Wait for DNS propagation

### 3.3 Update Environment Variables
Set these in Render secret manager (both backend and frontend):

**Backend:**
```
FRONTEND_URL=https://trey.yourcompany.com
```

**Frontend (as env var at build time):**
```
REACT_APP_API_URL=https://api.trey.yourcompany.com/api
FRONTEND_URL=https://trey.yourcompany.com
```

### 3.4 Verify HTTPS
```bash
curl -I https://api.trey.yourcompany.com/api/health
# Should return: HTTP/2 200, with valid SSL cert

curl -I https://trey.yourcompany.com/
# Should return: HTTP/2 200, with valid SSL cert
```

### Verification
- [ ] Frontend domain resolves to Render static site
- [ ] Backend API domain resolves to Render backend service
- [ ] Both have valid HTTPS certificates (green lock in browser)
- [ ] API health check returns 200
- [ ] Frontend loads without mixed-content warnings

---

## 4. CI/CD DEPLOY HOOKS
**Estimated Time:** 20 mins
**Owner:** DevOps

### 4.1 Get Render Deploy Hooks
Go to Render Dashboard:
- trey-backend → Settings → Deploy Hook → Copy URL
- trey-frontend → Settings → Deploy Hook → Copy URL

### 4.2 Add GitHub Secrets
Go to GitHub repo → Settings → Secrets and Variables → Actions:

```
RENDER_BACKEND_DEPLOY_HOOK=https://api.render.com/deploys/...
RENDER_FRONTEND_DEPLOY_HOOK=https://api.render.com/deploys/...
DATABASE_URL=<your_production_database_url>
JWT_SECRET=<your_production_jwt_secret>
```

### 4.3 Verify CI/CD Workflow
Check `.github/workflows/ci.yml` for these jobs:
- [ ] Backend typecheck (on PR and main)
- [ ] Frontend build (on PR and main)
- [ ] Database validation (on main, if DATABASE_URL is set)
- [ ] Deploy hooks (on main only, after all checks pass)

### 4.4 Test the Pipeline
Push a small change to main branch:
```bash
git commit --allow-empty -m "test: verify deploy hooks"
git push origin main
```

Monitor GitHub Actions and Render dashboard. You should see:
- ✓ GitHub Actions checks pass
- ✓ Render backend deployment starts automatically
- ✓ Render frontend deployment starts automatically
- ✓ Both services restart with new code

### Verification
- [ ] GitHub secrets are set (DATABASE_URL, JWT_SECRET, deploy hooks)
- [ ] CI workflow runs on PR without deploying
- [ ] CI workflow runs on main and triggers deployments
- [ ] Both backend and frontend redeploy after green checks

---

## 5. MONITORING & ALERT ROUTING
**Estimated Time:** 30 mins
**Owner:** DevOps/On-Call Lead

### 5.1 Set Sentry DSNs
Create Sentry projects for backend and frontend (if not done):
- Go to sentry.io → Create org/project
- Get DSN for backend
- Get DSN for frontend

### 5.2 Add to Render Environment
**Backend:**
```
SENTRY_DSN=https://your-backend-dsn@sentry.io/xxxxx
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_ENVIRONMENT=production
```

**Frontend:**
```
REACT_APP_SENTRY_DSN=https://your-frontend-dsn@sentry.io/xxxxx
REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 5.3 Configure Alert Routing in Sentry
Go to Sentry → Settings → Alerts:

**Critical Alerts** (P0 - on-call page):
- Error rate > 5% in 5 mins
- → Route to PagerDuty / Slack #critical-alerts

**Error Spikes** (P1 - team awareness):
- Unique error threshold exceeded
- → Route to Slack #errors

**Daily Summaries** (P2 - trend tracking):
- Daily digest of errors and transactions
- → Route to Email (ops@yourcompany.com)

### 5.4 Test Alerting
Trigger a test exception:
```bash
# In backend: Add a route that throws
GET /api/test-sentry-error

# Or in production logs, you should see error captured
# Check Sentry dashboard → Issues → new error
```

### Verification
- [ ] Sentry DSNs are set in Render (not in git)
- [ ] Test error appears in Sentry dashboard within 2 mins
- [ ] Critical alert routing is configured
- [ ] At least one team member is on the on-call rotation

---

## 6. FINAL PRODUCTION GO-LIVE SMOKE TESTS
**Estimated Time:** 30 mins
**Owner:** QA/DevOps

### 6.1 Pre-Flight Checks
```bash
# Run these against production database
npm --prefix backend run typecheck
# Expected: ✓ No errors

npm --prefix frontend run build
# Expected: ✓ Compiled successfully

npm --prefix backend run validate:db
# Expected: [Env Validate] PASSED

npm --prefix backend run validate:phase4
# Expected: [Phase 4 Validator] PASSED
```

### 6.2 Production Smoke Test: Create Obligation
1. Log in to production frontend with Google Workspace account
2. Dashboard loads without errors
3. Click "New Obligation"
4. Fill in fields (Title, Description, Due Date, Owner)
5. Click Save
6. Verify obligation appears in dashboard list
7. Check backend logs: no errors

### 6.3 Production Smoke Test: Assign Owner
1. Click on created obligation
2. Click "Assign Owner"
3. Select a team member
4. Save
5. Verify owner updates in UI
6. Check audit log: assignment is recorded

### 6.4 Production Smoke Test: Upload Evidence
1. Click obligation → Evidence tab
2. Upload a PDF or image file (< 50MB)
3. Verify file appears in list
4. Check S3/R2 bucket: file exists at `s3://trey-evidence-prod/evidence/...`
5. Backend logs: no errors

### 6.5 Production Smoke Test: Download Evidence
1. Click on uploaded file → Download
2. File downloads successfully
3. File is identical to original (check file size + MD5)
4. Verify download was fast (< 3 secs)

### 6.6 Production Smoke Test: Export ZIP/PDF
1. Click obligation → Export
2. Select format (ZIP with evidence + PDF audit trail)
3. Click Generate
4. File downloads successfully
5. Open ZIP: contains evidence files + metadata
6. Open PDF: shows audit trail with timestamps

### Verification Checklist
- [ ] Dashboard loads (no 5xx errors)
- [ ] Create obligation: passed, audit log recorded
- [ ] Assign owner: passed, audit log recorded
- [ ] Upload evidence: passed, file in S3/R2
- [ ] Download evidence: passed, file integrity verified
- [ ] Export ZIP: passed, contents correct
- [ ] Export PDF: passed, audit trail legible
- [ ] Zero 5xx errors in Sentry in last 30 mins
- [ ] Zero timeout errors (API response time < 3 secs)

---

## PRODUCTION GO-LIVE SIGN-OFF

When all 6 items are complete and all verification checks are passing:

- [ ] **Section 1:** Credentials rotated and secret rotation cadence set
- [ ] **Section 2:** S3/R2 production bucket live, smoke tests passing
- [ ] **Section 3:** Custom domains configured, HTTPS verified
- [ ] **Section 4:** CI/CD deploy hooks working, automatic deployments verified
- [ ] **Section 5:** Sentry monitoring active, alert routing configured
- [ ] **Section 6:** All production smoke tests passing, no 5xx errors

**PRODUCTION IS NOW LIVE AND READY FOR CUSTOMER USE.**

Next steps:
1. Announce to design partners / early customers
2. Monitor Sentry and logs for first 24 hours
3. Enable on-call rotation
4. Document any issues found and create follow-up tickets for Phase 6
