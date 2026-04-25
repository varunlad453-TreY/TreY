# PHASE 4: EXECUTION & MVP COMPLETION PLAN

**Date:** April 10, 2026
**Context:** TypeScript migration (Phases 1-3) is complete. The system architecture has been established. This plan outlines the exact priority sequence to get the system fully operational and production-ready.

## ANTI-OVERENGINEERING REVIEW (2026-04-23)

This section forces a product check before adding any more implementation complexity.

**How to read this section:**
- This is a scope-decision log, not a task checklist.
- Items under "What to delete from scope now" are intentionally documented guardrails so future contributors do not reintroduce dropped work.
- If an item is listed here, it means "do not prioritize in Phase 4" unless a production incident requires it.

### Priority 1: Core API Restoration
**Should this exist at all?**
Yes. Without route-controller wiring, there is no functioning product surface.

**Simplest version that gives ~80% value:**
*   Wire only critical user paths first: auth, obligations, evidence, SLA.
*   Return consistent errors and status codes; postpone advanced response shaping.

**What to delete from scope now:**
*   Any route-level refactor not required for a working request path.
*   Non-blocking route abstractions introduced only for "clean architecture" aesthetics.

### Priority 2: SLA Alert System
**Should this exist at all?**
Yes. SLA alerting is core to TreY's enforcement promise.

**Simplest version that gives ~80% value:**
*   Single daily scheduler.
*   Email alert only for overdue and near-breach obligations.
*   Audit log per alert attempt.

**What to delete from scope now:**
*   Multi-channel notifications in this phase (SMS, Slack, Teams).
*   Complex escalation trees and per-user custom schedules.

### Priority 3: Security and Compliance Lockdown
**Should this exist at all?**
Yes. This is baseline trust, not optional polish.

**Simplest version that gives ~80% value:**
*   Rate limiting, JWT expiry, Helmet, password policy enforcement.
*   Block obvious abuse vectors and log high-risk auth actions.

**What to delete from scope now:**
*   Advanced zero-trust features that require major platform redesign.
*   Security controls with no measurable risk reduction in the current threat model.

### Priority 4: Frontend Integration and Verification
**Should this exist at all?**
Yes, but only as validation of key business flows.

**Simplest version that gives ~80% value:**
*   Verify one end-to-end golden path: Create -> Assign -> Evidence -> Close.
*   Ensure SLA risk display and error handling work with live backend responses.

**What to delete from scope now:**
*   Pixel-perfect UI polishing unrelated to functional confidence.
*   Non-critical animation/design tweaks while lifecycle bugs remain.

---

## PRIORITY 1: CORE API RESTORATION (The "Plumbing")
**Status:** ✅ COMPLETED
**Why it's first:** Although we created all the TypeScript controllers, repositories, and validators, the Express routes are still disconnected. The API is currently non-functional until the routes route traffic to these new controllers.

**Tasks:**
- [x] 1. Update `backend/src/routes/auth.ts` -> Connect to `authController.ts`
- [x] 2. Update `backend/src/routes/obligations.ts` -> Connect to `obligationController.ts`
- [x] 3. Update `backend/src/routes/evidence.ts` -> Connect to `evidenceController.ts`
- [x] 4. Update `backend/src/routes/sla.ts` -> Connect to `slaController.ts`
- [x] 5. Connect remaining routes (alerts, audit, export, ingestion, organizations, users).
- [x] 6. Verify Express initialization in `backend/src/index.ts`.

---

## PRIORITY 2: THE SLA ALERT SYSTEM (MVP Blocker)
**Status:** ✅ COMPLETED
**Why it's second:** This is listed as the P0 Blocker in `PRODUCTION_READINESS.md`. Without automated SLA breach warnings, the system fails its primary objective as an enforcement tool.

**Tasks:**
- [x] 1. Implement `backend/src/services/alertService.ts` (SMTP setup via nodemailer).
- [x] 2. Implement `backend/src/jobs/slaAlertJob.ts` (node-cron job running at 9 AM IST).
- [x] 3. Connect alerts to the `audit_logs` table to ensure an immutable record of every alert sent.

---

## PRIORITY 3: SECURITY & COMPLIANCE LOCKDOWN
**Status:** ✅ COMPLETED
**Why it's third:** Before ingesting any real NBFC data, the application must be fortified against abuse.

**Tasks:**
- [x] 1. Implement global API Rate Limiting (100 req/15min) and strict Auth Rate Limiting (5 req/15min).
- [x] 2. Enforce JWT expiry to 8 hours and implement standard Helmet security headers.
- [x] 3. Validate that database-level triggers (preventing `DELETE` and timestamp updates) are perfectly intact via a check script.
- [x] 4. Implement strict Password Policy (12+ chars, expiry, history) if not already inside validators.

---

## PRIORITY 4: FRONTEND INTEGRATION & VERIFICATION
**Status:** ✅ COMPLETED
**Why it's last:** The frontend components (now in `.tsx`) need a stable and secure backend API to render the SLA Risk Dashboard and Notification Panels reliably.

**Tasks:**
- [x] 1. Verify `frontend/src/api/index.ts` perfectly aligns with the new TypeScript backend routes.
- [x] 2. End-to-End test of the Obligation lifecycle (Create -> Assign -> Add Evidence -> Close).
- [x] 3. Verify "Late Evidence" logic displays properly on the React dashboard.

---

## ENFORCEMENT RULES FOR IMPLEMENTATION:
- **No scope creep.** Stick strictly to the tasks above.
- **Maintain immutability.** If we touch the database, it must remain append-only.
- **Regulator-grade code.** Handle every error gracefully and log it to the audit system.

---

## PHASE 4 RE-VALIDATION CHECKPOINT (2026-04-23)

Even though Phase 4 is marked completed, a re-validation pass found lifecycle consistency drift that could break runtime flows.

### Fixes Completed Today
- [x] Aligned obligation default status creation with database enum (`open` instead of `pending`).
- [x] Removed invalid `updated_at` write from obligation status update query (column does not exist in obligations schema).
- [x] Aligned backend obligation status types to canonical enum (`open`, `closed`, `breached`).
- [x] Aligned status update validator to accepted transition targets (`closed`, `breached`).

### Why These Fixes Matter
- Prevents SQL/runtime failures during status updates.
- Restores consistent lifecycle semantics between schema, service logic, validators, and repository behavior.

### Next Phase 4 Execution Steps
- [x] Run focused obligation lifecycle smoke test: Create -> Assign Owner -> Add Evidence -> Close.
- [x] Confirm frontend status expectations are compatible with backend canonical states.
- [x] Add one regression test for status transition validation.

### Validation Runner Added
- Command: `npm --prefix backend run validate:phase4`
- Script: `backend/src/scripts/validatePhase4.ts`
- Coverage:
	- Lifecycle smoke path (Create -> Reassign -> Evidence Upload -> Auto-Close).
	- Status transition regression checks (reject invalid `open` update and reject re-update on closed obligation).

### Current Blocker
- None. `npm --prefix backend run validate:phase4` passes in the current environment.
