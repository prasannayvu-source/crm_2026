-- Phase 5: Scale Readiness & Future Integration Tables
-- Execute this in Supabase SQL Editor

-- 1. Integration Logs (for Webhooks & External Syncs)
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL, -- Link to config
    event_name VARCHAR(100) NOT NULL, -- e.g., 'student.enrolled'
    payload JSONB, -- The data sent
    response_status INTEGER, -- HTTP Status Code
    response_body TEXT, -- Error message or success response
    attempt_count INTEGER DEFAULT 1,
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying logs by integration or status
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);

-- 2. Leads Archive (Cold Storage)
-- Stores deleted/old leads as a JSON dump to avoid schema dependency issues
CREATE TABLE IF NOT EXISTS leads_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_lead_id UUID, -- The ID from the leads table (before deletion)
    parent_name VARCHAR(255), -- Indexed for simple search
    email VARCHAR(255), -- Indexed for simple search
    archived_data JSONB NOT NULL, -- Full dump of lead data including interactions?
    archived_reason VARCHAR(100), -- 'manual', 'automation', 'stale'
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    archived_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_archive_email ON leads_archive(email);

-- 3. Rate Limit Tracking (Optional, can be Redis but Table is persistent backup)
-- We might not need a table if using Redis/Memory, but good for distributed if no Redis.
CREATE TABLE IF NOT EXISTS user_rate_limits (
    key VARCHAR(255) PRIMARY KEY, -- e.g., 'ip:127.0.0.1:login'
    request_count INTEGER DEFAULT 1,
    last_request TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
