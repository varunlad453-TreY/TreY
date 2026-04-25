-- Migration 006: Integration Webhooks for Shadow Decisions
CREATE TABLE IF NOT EXISTS integration_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    obligation_id UUID NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- e.g., 'jira', 'slack'
    external_reference_id VARCHAR(255) NOT NULL, -- e.g., 'SEC-101'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_type, external_reference_id)
);

CREATE INDEX idx_integration_links_obligation ON integration_links(obligation_id);
CREATE INDEX idx_integration_links_external_ref ON integration_links(integration_type, external_reference_id);
