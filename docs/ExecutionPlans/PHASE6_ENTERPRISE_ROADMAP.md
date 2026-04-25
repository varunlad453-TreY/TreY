# PHASE 6: ENTERPRISE EXPANSION & WORKFLOW AUTOMATION

**Status:** In Progress (Milestone 1 foundation delivered; Milestones 2-5 pending)
**Last Updated:** 2026-04-23
**Context:** Based on a deep-dive audit of the current codebase, the core MVP is exceptionally mature. The backend supports TypeScript-driven Express routes, Neon Serverless PostgreSQL with immutable audit trails, JWT-based RBAC, SLA CRON jobs, PDF/ZIP generation for auditors, bulk CSV ingestion, deduplication, and a React-powered SLA dashboard.

The goal now shifts from building a *System of Record* into a *System of Automation*. To win CISO budgets, TreY must connect to where engineers already work and automatically verify evidence without human intervention.

## ANTI-OVERENGINEERING REVIEW (2026-04-23)

This section challenges each Phase 6 milestone before full build-out.

### Milestone 1: Workflow Integrations
**Should this exist at all?**
Yes. It directly reduces compliance chasing and has immediate user-visible value.

**Simplest version that gives ~80% value:**
*   Keep Jira + Slack only.
*   Support one inbound webhook flow per provider and one outbound action (create ticket/send alert).
*   Keep one deterministic mapping rule from external reference to obligation.

**What to delete from scope now:**
*   MS Teams/Linear in the same delivery window.
*   Rich bot command grammar before webhook reliability is battle-tested.
*   Custom per-tenant workflow DSLs.

### Milestone 2: Continuous Automated Evidence
**Should this exist at all?**
Yes, but only after Milestone 1 reliability is stable.

**Simplest version that gives ~80% value:**
*   Start with one cloud provider and one identity provider.
*   Implement 3-5 high-signal checks only (for example MFA/root/admin offboarding checks).
*   Run daily polling with audit-stamped evidence output.

**What to delete from scope now:**
*   Broad connector coverage across many providers at launch.
*   Real-time streaming ingestion for every integration.
*   Overly generic rule engines before core checks prove demand.

### Milestone 3: Multi-Framework Cross-Walking
**Should this exist at all?**
Yes, but not as an initial broad graph engine.

**Simplest version that gives ~80% value:**
*   Predefined mapping packs for the top two frameworks used by design partners.
*   One-way cascade resolution first; reopen logic in a second pass.

**What to delete from scope now:**
*   Fully customizable mapping UI for every customer in v1.
*   Deep cross-framework inference logic that is hard to audit and explain.

### Milestone 4: Enterprise Identity and Authentication
**Should this exist at all?**
Yes. Enterprise adoption depends on it.

**Simplest version that gives ~80% value:**
*   One enterprise-grade SSO path (OIDC first) with strict role mapping.
*   JIT provisioning with minimal role set and clear fallback policy.

**What to delete from scope now:**
*   Simultaneous OIDC + SAML + SCIM full coverage in one release.
*   Complex attribute-transformation frameworks before core login reliability is proven.

### Milestone 5: Read-Only Auditor Portal
**Should this exist at all?**
Yes, but only if it replaces recurring manual export burden.

**Simplest version that gives ~80% value:**
*   Time-bound, read-only token links scoped to one audit package.
*   Immutable evidence timeline view with download access.

**What to delete from scope now:**
*   Rich collaboration workflows for auditors (comments/tasks/chat) in v1.
*   Broad self-serve portal customization and branding controls in initial release.

## IMPLEMENTATION CHECKPOINT (AS OF 2026-04-23)

This section tracks what is already done versus what is still pending to reach production-level quality.

### Milestone 1 - BI-DIRECTIONAL WORKFLOW INTEGRATIONS
**Current State:** Partially Implemented (foundation in place)

**Done Already:**
*   Webhook routes are wired and mounted for link creation and provider callbacks (`/api/webhooks/link`, `/api/webhooks/jira`, `/api/webhooks/slack`).
*   Integration link persistence exists with `integration_links` migration and upsert behavior.
*   Jira webhook can auto-close linked obligations when status moves to Done.
*   Slack webhook can capture message-based evidence when `#evidence` is present.
*   Audit log writes are present for integration linking and webhook-driven actions.
*   Frontend includes Link Integration modal and renders linked integration badges on Obligation details.
*   API timeout protection added on frontend requests to avoid indefinite loading.

**Pending for Production - Inputs / Outputs:**
*   Outbound API actions are incomplete: automatic Jira ticket creation and Slack/Teams outbound notifications are not fully implemented.
*   Slack file attachment ingestion path is incomplete for production (currently text snapshot behavior, no full binary ingest pipeline).
*   MS Teams and Linear coverage is still missing.

**Pending for Production - Constraints:**
*   Third-party actor identity mapping to TreY users is not complete for enterprise trust boundaries.
*   Provider rate-limit governance and retry policy enforcement is missing (backoff, quota buckets, provider-specific limits).
*   Jira webhook validation should move to robust signature verification with strict canonical payload handling and secret rotation support.
*   Per-tenant secret/version management and secure key rotation runbooks are not yet formalized.

**Pending for Production - Edge Cases, Error Handling, Scalability:**
*   At-least-once webhook delivery needs durable idempotency keys and deduplication storage.
*   No dead-letter queue/replay pipeline exists for failed webhook processing.
*   Jira ticket moved/deleted/reopened reconciliation logic is missing.
*   Slack evidence pipeline lacks malware scanning, size enforcement, and content policy validation before persistence.
*   `fs.writeFileSync` in request path is a scalability bottleneck and should be replaced with async streaming to object storage.
*   SLO-grade observability is incomplete (structured correlation IDs, webhook latency metrics, failure-alerting thresholds).

### Milestone 2 - CONTINUOUS AUTOMATED EVIDENCE
**Current State:** Not Implemented

**Done Already:**
*   None in production connector architecture.

**Pending for Production - Inputs / Outputs:**
*   Build AWS/GCP/Okta connector services with normalized evidence output contracts.
*   Add polling/scheduling orchestration with checkpointed incremental sync.
*   Persist machine-generated evidence and map to obligations with deterministic provenance metadata.

**Pending for Production - Constraints:**
*   Implement secure credential model (short-lived tokens, role assumption, KMS-backed secret storage).
*   Enforce provider-specific quotas, retry budgets, and graceful degradation on upstream outages.

**Pending for Production - Edge Cases, Error Handling, Scalability:**
*   Token revocation/expiration recovery and reauthorization workflows.
*   Pagination-safe collectors for large tenants and high cardinality resources.
*   False-positive mitigation with rule confidence metadata and override audit controls.
*   Backpressure controls and queue-based fanout for high-volume evidence ingestion.

### Milestone 3 - MULTI-FRAMEWORK CROSS-WALKING
**Current State:** Not Implemented

**Done Already:**
*   None in mapping engine architecture.

**Pending for Production - Inputs / Outputs:**
*   Create mapping schemas between frameworks, controls, and evidence acceptance criteria.
*   Build cascade engine to resolve/reopen obligations across frameworks from one evidence decision.
*   Emit explicit audit trail events for every cascaded state transition.

**Pending for Production - Constraints:**
*   Versioned mapping rules are required (for example SOC2 edition drift).
*   Invalidation model must reopen downstream obligations when source evidence is revoked.

**Pending for Production - Edge Cases, Error Handling, Scalability:**
*   Graph cycle detection is required to prevent infinite cascades.
*   Idempotent cascade execution needed for retries and replay safety.
*   Bulk cascade performance controls needed for large enterprise control graphs.

### Milestone 4 - ENTERPRISE IDENTITY & AUTHENTICATION
**Current State:** Partially Implemented (Google OAuth baseline only)

**Done Already:**
*   Google OAuth login route and callback flow exist.
*   Basic SSO account linking/provisioning behavior exists for Google identities.

**Pending for Production - Inputs / Outputs:**
*   Full enterprise OIDC/SAML support is missing (Okta/Azure AD style tenant configuration).
*   IdP metadata ingestion and certificate lifecycle management are not implemented.
*   JIT provisioning and deprovisioning policy controls are incomplete.

**Pending for Production - Constraints:**
*   SAML replay prevention, strict assertion validation, nonce/state hardening, and bounded clock-skew enforcement need full implementation.
*   Enterprise role mapping policy engine and conflict handling are pending.

**Pending for Production - Edge Cases, Error Handling, Scalability:**
*   IdP certificate rotation resilience and fail-safe fallback handling are pending.
*   Account collision handling (email changes, subject ID mismatch, merge policies) needs deterministic rules.
*   Login burst handling and auth service observability are not production-complete.

### Milestone 5 - READ-ONLY AUDITOR PORTAL
**Current State:** Not Implemented

**Done Already:**
*   Existing PDF/ZIP exports from MVP (outside this milestone's portal scope).

**Pending for Production - Inputs / Outputs:**
*   Build auditor portal token issuance, revocation, and scoped access service.
*   Build read-only portal APIs and frontend views for timeline/evidence navigation.
*   Implement expiration-aware magic links with tenant and framework scoping.

**Pending for Production - Constraints:**
*   Strict least-privilege session scope enforcement is pending.
*   Token expiry, revocation, and anti-reuse protections need implementation.

**Pending for Production - Edge Cases, Error Handling, Scalability:**
*   Forwarded-link abuse mitigations are pending (OTP/email verification/device checks).
*   Point-in-time snapshot consistency for active audits is pending.
*   Caching and query-performance design for large evidence timelines is pending.

---

## MILESTONE 1: BI-DIRECTIONAL WORKFLOW INTEGRATIONS (The "No Chasing" Engine)
CISOs don't want to log into another dashboard, and engineers hate leaving Slack/Jira.
*   **Slack/MS Teams Bots:** Allow TreY to ping an engineer when an SLA is at risk. Enable engineers to reply to the bot with their evidence (e.g., an architectural PDF), which TreY securely ingests, hashes, and attaches to the obligation.
*   **Jira/Linear Webhooks:** When a compliance gap is identified in TreY, automatically generate a Jira ticket. When the ticket is marked 'Done' in Jira, TreY automatically closes the compliance obligation and timestamps the audit log.

**Inputs / Outputs:**
*   **Inputs:** Webhook payloads from Slack/Jira (JSON), files attached to Slack messages, webhook registration contexts.
*   **Outputs:** REST API calls to Jira/Slack to create tickets or send messages, updated Obligation status in DB, new Evidence records in DB.

**Constraints:**
*   Must map 3rd party user IDs to TreY users securely.
*   Must handle rate limits from Jira/Slack APIs.
*   Webhook endpoints must be secure, validating signatures (e.g., Slack signing secrets, Jira webhook tokens) to prevent spoofing.

**Edge Cases:**
*   Message delivery failure to Slack/Teams.
*   Jira ticket is deleted or moved to a different project without resolving the obligation.
*   Evidence uploaded via Slack exceeds size limits or is malware-infected.
*   Duplicate webhooks sent by Jira (at-least-once delivery).

## MILESTONE 2: CONTINUOUS AUTOMATED EVIDENCE (The Vanta/Drata Pivot)
Manual uploads are error-prone. Enterprise tools connect directly to the stack.
*   **Cloud API Connectors (AWS/GCP):** Microservices that query the active cloud configuration (e.g., 'Is MFA enabled for root users?'). If true, TreY auto-signs the obligation in real-time. If false, it triggers an immediate SLA violation.
*   **Identity Connectors (Okta/Google Workspace):** Automatically pull reports on employee off-boarding to satisfy 'Access Revoked within 24 hours' controls without manual HR screenshots.

**Inputs / Outputs:**
*   **Inputs:** Read-only API credentials (IAM Roles, OAuth tokens) for AWS/GCP/Okta, polling intervals.
*   **Outputs:** Automated Evidence records generated as JSON, automatic Obligation status updates, SLA Violation triggers.

**Constraints:**
*   We cannot store raw highly-sensitive AWS/GCP keys long-term without encryption at rest (KMS). Prefer OAuth/Role assumption.
*   Third-party API availability and rate-limits.

**Edge Cases:**
*   API keys get revoked or expire, causing automated checks to fail.
*   False positives in security checks due to unusual architectural configurations.
*   Pagination limits in Okta/AWS APIs when checking thousands of users/resources.

## MILESTONE 3: MULTI-FRAMEWORK CROSS-WALKING
Enterprises often face 3-4 audits simultaneously (SOC 2, ISO 27001, GDPR, RBI).
*   **Control Mapping Engine:** Build a relational mapper in the PostgreSQL database. When a piece of evidence (e.g., 'Annual Pen Test') evaluates as valid, it automatically cascades and clears the requirement across multiple distinct compliance frameworks, eliminating duplicate data entry.

**Inputs / Outputs:**
*   **Inputs:** Evidence ID, Framework ID, Control IDs mapping payload.
*   **Outputs:** Cascaded Obligation state changes (creating/resolving obligations for mapped controls), audit trail entries for cascaded resolutions.

**Constraints:**
*   Mapping rules must be strictly versioned (e.g., SOC2 2017 vs SOC2 2023).
*   Cascading deletes: If evidence is invalidated, all mapped obligations must reopen.

**Edge Cases:**
*   Circular mapping dependencies (A -> B -> A) causing infinite loops during cascade.
*   Evidence satisfies SOC2 but falls short of ISO27001 requirements due to specific metadata thresholds.

## MILESTONE 4: ENTERPRISE IDENTITY & AUTHENTICATION
To deploy into a 1,000+ employee company, local email/password login is a blocker.
*   **SSO / SAML 2.0 Integration:** Implement OIDC/SAML to allow enterprise customers to log into TreY using their corporate credentials (Okta/Azure AD), instantly mapping them to their correct RBAC roles (CISO vs. SecEng).

**Inputs / Outputs:**
*   **Inputs:** SAML assertions/OIDC tokens, Identity Provider metadata URL or XML.
*   **Outputs:** Synced User records, JWT session tokens for frontend, Role mappings.

**Constraints:**
*   Strict timeout and replay attack prevention on SAML assertions.
*   User provisioning/de-provisioning must be real-time (JIT provisioning).

**Edge Cases:**
*   User assigned a role in IdP that doesn't exist in TreY.
*   IdP email changes but user UUID remains the same.
*   SSO certificate rotation causing sudden lockout.

## MILESTONE 5: READ-ONLY AUDITOR PORTAL
The PDF/ZIP export is fantastic, but we can go further.
*   **External Auditor View:** A stripped-down, read-only UI link valid for 30 days that lets an external accounting firm (EY, KPMG, etc.) natively browse the immutable evidence timeline, sparing the CISO from sending heavily encrypted attachments over email.

**Inputs / Outputs:**
*   **Inputs:** Portal generation request (target auditor email, expiration date, scoped framework). 
*   **Outputs:** Secure Magic Link (UUID/JWT based), read-only Portal UI views.

**Constraints:**
*   Auditor session strictly limited to requested view.
*   Tokens must automatically expire after the configured timeframe.

**Edge Cases:**
*   Auditor forwarding the link to an unauthorized party (need email 2FA/OTP on portal login).
*   Data mutated during an active audit period (needs temporal "point-in-time" viewing capabilities).
