-- Add indexes to leads table for faster analytics queries

-- Index on created_at for date range filtering
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Index on status for status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Index on source for source filtering
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Index on assigned_to for counselor filtering
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- Composite index for common query patterns (created_at + status)
CREATE INDEX IF NOT EXISTS idx_leads_created_status ON leads(created_at, status);

-- Composite index for analytics dashboard (created_at + source + status)
CREATE INDEX IF NOT EXISTS idx_leads_analytics ON leads(created_at, source, status, assigned_to);
