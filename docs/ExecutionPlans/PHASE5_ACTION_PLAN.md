# PHASE 5: GO-TO-MARKET & PRODUCTION READINESS
**Status:** In Progress
**Goal:** Transition from a functional local MVP into a public-facing, marketable product while simultaneously hardening the infrastructure for real-world enterprise use.

This phase is split into two concurrent tracks: **Marketing/Growth** and **Engineering**.

## TRACK B IMPLEMENTATION CHECKPOINT (AS OF 2026-04-23)

This checkpoint is based on repository verification, not plan assumptions.

### Step 1: Cloud Database Migration
**Status:** Core Implementation Complete
*   Database layer supports cloud-first config via `DATABASE_URL` with SSL and pool tuning.
*   Migration runner exists and is reusable for remote managed databases.
*   Completed now: one-click DB validation command added (`npm --prefix backend run validate:db`).
*   Completed now: production runbook checklist added (`docs/setup/PRODUCTION_DEPLOY_CHECKLIST.md`).
*   Remaining: execute the runbook against production environment.

### Step 2: Environment and Secrets Management
**Status:** Mostly Complete
*   Backend environment template exists and root `.gitignore` excludes `.env` variants.
*   Deploy blueprint exists.
*   Completed now: removed hardcoded `DATABASE_URL` credential from `render.yaml` and switched to secure runtime injection.
*   Completed now: `.env` and `.env.example` keys aligned for backend and frontend monitoring/storage variables.
*   Remaining: rotate any previously exposed credentials and enforce secret rotation cadence in operations.

### Step 3: File Storage Strategy (S3/R2)
**Status:** Core Implementation Complete
*   Provider-backed storage adapter added with `STORAGE_PROVIDER=local|s3` support.
*   Evidence upload path now supports S3/R2 object storage writes and stores canonical object locations (`s3://bucket/key`) in DB.
*   Evidence download now supports signed URL redirects for S3/R2 and local disk fallback for development.
*   Remaining: production bucket provisioning + least-privilege IAM policy rollout + migration plan for previously local evidence files.

### Step 4: Infrastructure Deployment
**Status:** Core Implementation Complete
*   Render deployment blueprint exists for backend and frontend.
*   CORS origin is environment-driven and tied to frontend URL.
*   Completed now: deployment verification checklist documented in `docs/setup/PRODUCTION_DEPLOY_CHECKLIST.md`.
*   Remaining: apply custom domains and TLS in production hosting environment.

### Step 5: Security Hardening
**Status:** Complete
*   Helmet, CORS control, and rate-limiting middleware are active.
*   Completed now: rate limits are environment-driven with production-safe defaults (`100` API / `5` auth per 15 minutes), while allowing non-production override for testing.
*   Completed now: stack traces are suppressed in production error responses.

### Step 6: CI/CD Pipeline Setup
**Status:** Complete
*   Completed now: GitHub Actions pipeline added at `.github/workflows/ci.yml`.
*   Current checks: backend typecheck, frontend production build, conditional phase validation when DB secrets are configured.
*   Completed now: optional backend/frontend deploy-hook jobs added for main branch releases.

### Step 7: Monitoring, Analytics and Logging
**Status:** Core Implementation Complete
*   Structured backend logging added via Winston (request + startup + error logs).
*   Optional Sentry integration added for exception capture (`SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`).
*   Completed now: frontend Sentry bootstrap support added (`REACT_APP_SENTRY_DSN`, `REACT_APP_SENTRY_TRACES_SAMPLE_RATE`).
*   Remaining: finalize production alert routing policy (Slack/Email/Pager) and set live DSN values.

## PHASE 5 CLOSURE STATUS (ENGINEERING TRACK)

**Repository-side implementation:** Complete

**External execution still required to declare fully complete in production:**
*   Rotate exposed credentials and apply rotation policy.
*   Configure production domains and TLS.
*   Provision production bucket IAM policy and run local->object storage migration if needed.
*   Configure live Sentry DSNs and alert routing destinations.
*   Execute the full production checklist in `docs/setup/PRODUCTION_DEPLOY_CHECKLIST.md`.

## ANTI-OVERENGINEERING REVIEW (2026-04-23)

This section defines what must be done now versus what should wait.

### Track A: Marketing and Outreach
**Should this exist at all?**
Yes. Early distribution and design-partner feedback are required to validate demand.

**Simplest version that gives ~80% value:**
*   One strong seed script with realistic data.
*   One core demo video covering dashboard risk view plus one-click auditor export.
*   One distribution channel first (LinkedIn), with weekly consistency.

**What to delete from scope now:**
*   Producing three separate polished videos before message-market fit is clear.
*   Heavy cinematic editing and multi-platform repackaging before first traction signals.

### Track B: Engineering and Production Readiness
**Should this exist at all?**
Yes. Without basic production readiness, growth activities convert into churn.

**Simplest version that gives ~80% value:**
*   Managed cloud DB + environment/secret hygiene.
*   Durable object storage for evidence.
*   One stable backend deploy + one stable frontend deploy.
*   Basic CI gate (test on main), plus crash reporting and structured logs.

**What to delete from scope now:**
*   Multi-cloud setup and advanced infra abstractions.
*   Complex CI/CD matrices, canary pipelines, and release orchestration before baseline reliability.
*   Premature analytics instrumentation that does not drive immediate product decisions.

---

## TRACK A: MARKETING & OUTREACH (THE DEMO STRATEGY)
*To be executed immediately to build a waitlist and secure design partners.*

### Step 1: The "Perfect Mock Data" Script
Before recording anything, the app needs to look like a bustling enterprise environment.
*   **Action:** Build a comprehensive `seed.ts` script.
*   **Content:** Generate dummy data mimicking a real SOC 2 or ISO 27001 audit.
*   **Elements to include:** 3-5 users, 50+ obligations (some overdue, some pending), a fully populated SLA Heatmap, and realistic evidence files ("AWS_Architecture_Diagram.pdf").

### Step 2: Demo Video #1 - "Chaos to Clarity" (The Hook)
*   **Target Audience:** Compliance Managers, CISOs, Founders.
*   **The Problem Showcased:** Tracking hundreds of spreadsheet rows and chasing people on Slack.
*   **The TreY Solution:** Open the dashboard. Show the **SLA Heatmap**, the clear "at-risk" indicators, and the real-time completion metrics. 
*   **Length:** 60-90 seconds. 
*   **LinkedIn Hook:** "Still tracking your SOC 2 compliance in a 400-row spreadsheet? There is a better way. Meet TreY's SLA Heatmap."


### Step 3: Demo Video #2 - "The 1-Click Auditor Handoff" (The Value)
*   **Target Audience:** Security Engineers and External Auditors.
*   **The Problem Showcased:** Downloading files from Google Drive, zipping them manually, and organizing them in folders for auditors.
*   **The TreY Solution:** Go to an obligation, show the full audit trail/timeline, click the **Export ZIP/PDF** button, and show the beautifully generated compliance package.
*   **Length:** 45-60 seconds.
*   **LinkedIn Hook:** "Auditors don't want screenshots inside Word docs. Give them a perfectly structured ZIP file in one click with TreY."

### Step 4: Demo Video #3 - "Accountability That Works" (The Engagement)
*   **Target Audience:** Non-security staff (Engineers, HR) who are assigned compliance tasks.
*   **The Problem Showcased:** Forgetting to upload evidence until the day before the audit.
*   **The TreY Solution:** Show the automated email notification, click the "Magic Link", log in seamlessly, upload a file, and watch the SLA clock stop.
*   **Length:** 60 seconds.

---

## TRACK B: ENGINEERING & PROD READINESS
*To be executed concurrently so that when people ask to use the beta, the platform is ready.*

### Step 1: Cloud Database Migration
*   **Current State:** Local PostgreSQL.
*   **Action:** Provision a managed cloud database (e.g., Neon, Supabase, or AWS RDS). Update `migrations/` and run them against the remote DB.

### Step 2: Environment & Secrets Management
*   **Current State:** Hardcoded API URLs, weak local JWT secrets.
*   **Action:** Centralize all configuration into `.env` files. Ensure secrets (Database URIs, JWT tokens, AWS S3 keys for file storage) are secure and git-ignored.

### Step 3: File Storage Strategy (S3 Integration)
*   **Current State:** Evidence files are uploaded to the local `uploads/` folder (wiped on server restart/deployment).
*   **Action:** Connect an AWS S3 bucket (or Cloudflare R2) to the backend so uploaded evidence persists securely in the cloud.

### Step 4: Infrastructure Deployment
*   **Backend (Node/Express):** Deploy to Render, Heroku, or AWS App Runner. Configure CORS to only accept requests from the frontend.
*   **Frontend (React):** Deploy to Vercel or Netlify. Connect it to a custom domain (e.g., `app.trey-compliance.com`).

### Step 5: Security Hardening (The "Trust" Factor)
*   **Action:** Implement Rate Limiting (prevent brute force logins), Helmet.js (secure HTTP headers), and rigorous input sanitization. This is critical for a compliance app.

### Step 6: CI/CD Pipeline Setup
*   **Action:** Set up GitHub Actions. Every time code is pushed to `main`, the pipeline must run the Jest test suite (the one we just fixed!). If tests pass, it triggers an auto-deploy to the cloud.
    
### Step 7: Monitoring, Analytics & Logging
*   **Action:** Integrate Sentry (for catching backend/frontend crashes before users report them) and structured logging (Winston) so you can debug production issues easily.
