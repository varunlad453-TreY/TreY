-- ============================================
-- MIGRATION 005: Enterprise SSO & Identity
-- ============================================
-- Supporting SAML, Google Workspace, and Azure AD
-- Transitioning from local-only auth to federated identity

-- 1. Make password_hash nullable (SSO users don't have local passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Add identity provider tracking
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';
ALTER TABLE users ADD COLUMN sso_provider_id VARCHAR(255);

-- 3. Ensure uniqueness of SSO ID per provider
CREATE UNIQUE INDEX idx_users_sso_identity ON users(auth_provider, sso_provider_id) WHERE auth_provider != 'local';

-- 4. Audit logging for SSO events
-- We need to ensure we can track when someone logs in via SSO
-- (This will be handled via application layer into the existing audit_logs table)

