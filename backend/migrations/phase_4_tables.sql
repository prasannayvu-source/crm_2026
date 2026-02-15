-- Phase 4: Analytics, Reports & Admin Tables
-- Execute this in Supabase SQL Editor

-- 1. App Settings Table (for system configuration)
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reports Table (saved report definitions)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL,
    filters JSONB,
    grouping VARCHAR(255),
    sorting JSONB,
    aggregations JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scheduled Reports Table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly')),
    schedule_time TIME,
    schedule_day INTEGER, -- Day of week (1-7) for weekly, day of month (1-31) for monthly
    recipients JSONB NOT NULL, -- Array of email addresses
    format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'pdf', 'xlsx', 'sheets')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    next_run TIMESTAMPTZ,
    last_run TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Report Runs Table (execution history)
CREATE TABLE IF NOT EXISTS report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    row_count INTEGER,
    download_url TEXT,
    error_message TEXT,
    run_by UUID REFERENCES profiles(id),
    run_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- 5. Custom Roles Table
CREATE TABLE IF NOT EXISTS custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Integrations Table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('smtp', 'google_workspace', 'webhook', 'api_key')),
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_by UUID REFERENCES profiles(id),
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    events JSONB NOT NULL, -- Array of event types
    endpoint_url TEXT NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'viewed', 'exported', 'impersonated')),
    resource VARCHAR(100) NOT NULL, -- e.g., 'lead', 'user', 'setting'
    resource_id UUID,
    details JSONB,
    before_data JSONB,
    after_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status ON scheduled_reports(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run);
CREATE INDEX IF NOT EXISTS idx_report_runs_report_id ON report_runs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_run_at ON report_runs(run_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON custom_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles
INSERT INTO custom_roles (name, description, permissions, is_system) VALUES
('admin', 'Full system access', '{"leads": {"view": true, "create": true, "edit": true, "delete": true, "export": true, "scope": "all"}, "analytics": {"view": true, "export": true, "scope": "all"}, "reports": {"view": true, "create": true, "edit": true, "delete": true, "export": true, "scope": "all"}, "admin": {"view": true, "create": true, "edit": true, "delete": true, "scope": "all"}}', true),
('manager', 'Team management access', '{"leads": {"view": true, "create": true, "edit": true, "delete": false, "export": true, "scope": "team"}, "analytics": {"view": true, "export": true, "scope": "team"}, "reports": {"view": true, "create": true, "edit": true, "delete": false, "export": true, "scope": "team"}}', true),
('counselor', 'Individual counselor access', '{"leads": {"view": true, "create": true, "edit": true, "delete": false, "export": false, "scope": "own"}, "analytics": {"view": true, "export": false, "scope": "own"}}', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default app settings
INSERT INTO app_settings (key, value) VALUES
('lead_sources', '["website", "walk_in", "referral", "social", "email", "phone"]'),
('lead_statuses', '["new", "attempted_contact", "connected", "visit_scheduled", "application_submitted", "enrolled", "lost"]'),
('sla_thresholds', '{"new": 24, "attempted_contact": 48, "connected": 72, "visit_scheduled": 168, "application_submitted": 72}'),
('conversion_target', '25.0'),
('school_name', '"Jeevana Vidya Online School"')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only for most tables)
CREATE POLICY "Admin full access to app_settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    ));

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own reports" ON reports
    FOR UPDATE USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "Admin can delete reports" ON reports
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Similar policies for other tables (admin-only for sensitive data)
CREATE POLICY "Admin full access to audit_logs" ON audit_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "Admin full access to integrations" ON integrations
    FOR ALL USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "Admin full access to api_keys" ON api_keys
    FOR ALL USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Grant necessary permissions
GRANT ALL ON app_settings TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON scheduled_reports TO authenticated;
GRANT ALL ON report_runs TO authenticated;
GRANT ALL ON custom_roles TO authenticated;
GRANT ALL ON integrations TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON webhooks TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
