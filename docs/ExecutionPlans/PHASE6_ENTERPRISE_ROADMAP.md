# PHASE 6: ENTERPRISE EXPANSION & WORKFLOW AUTOMATION

**Status:** Planned
**Context:** Based on a deep-dive audit of the current codebase, the core MVP is exceptionally mature. The backend supports TypeScript-driven Express routes, Neon Serverless PostgreSQL with immutable audit trails, JWT-based RBAC, SLA CRON jobs, PDF/ZIP generation for auditors, bulk CSV ingestion, deduplication, and a React-powered SLA dashboard.

The goal now shifts from building a *System of Record* into a *System of Automation*. To win CISO budgets, TreY must connect to where engineers already work and automatically verify evidence without human intervention.

---

## MILESTONE 1: BI-DIRECTIONAL WORKFLOW INTEGRATIONS (The "No Chasing" Engine)
CISOs don't want to log into another dashboard, and engineers hate leaving Slack/Jira.
*   **Slack/MS Teams Bots:** Allow TreY to ping an engineer when an SLA is at risk. Enable engineers to reply to the bot with their evidence (e.g., an architectural PDF), which TreY securely ingests, hashes, and attaches to the obligation.
*   **Jira/Linear Webhooks:** When a compliance gap is identified in TreY, automatically generate a Jira ticket. When the ticket is marked 'Done' in Jira, TreY automatically closes the compliance obligation and timestamps the audit log.

## MILESTONE 2: CONTINUOUS AUTOMATED EVIDENCE (The Vanta/Drata Pivot)
Manual uploads are error-prone. Enterprise tools connect directly to the stack.
*   **Cloud API Connectors (AWS/GCP):** Microservices that query the active cloud configuration (e.g., 'Is MFA enabled for root users?'). If true, TreY auto-signs the obligation in real-time. If false, it triggers an immediate SLA violation.
*   **Identity Connectors (Okta/Google Workspace):** Automatically pull reports on employee off-boarding to satisfy 'Access Revoked within 24 hours' controls without manual HR screenshots.

## MILESTONE 3: MULTI-FRAMEWORK CROSS-WALKING
Enterprises often face 3-4 audits simultaneously (SOC 2, ISO 27001, GDPR, RBI).
*   **Control Mapping Engine:** Build a relational mapper in the PostgreSQL database. When a piece of evidence (e.g., 'Annual Pen Test') evaluates as valid, it automatically cascades and clears the requirement across multiple distinct compliance frameworks, eliminating duplicate data entry.

## MILESTONE 4: ENTERPRISE IDENTITY & AUTHENTICATION
To deploy into a 1,000+ employee company, local email/password login is a blocker.
*   **SSO / SAML 2.0 Integration:** Implement OIDC/SAML to allow enterprise customers to log into TreY using their corporate credentials (Okta/Azure AD), instantly mapping them to their correct RBAC roles (CISO vs. SecEng).

## MILESTONE 5: READ-ONLY AUDITOR PORTAL
The PDF/ZIP export is fantastic, but we can go further.
*   **External Auditor View:** A stripped-down, read-only UI link valid for 30 days that lets an external accounting firm (EY, KPMG, etc.) natively browse the immutable evidence timeline, sparing the CISO from sending heavily encrypted attachments over email.
