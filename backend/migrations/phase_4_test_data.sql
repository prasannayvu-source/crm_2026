-- Phase 4 Test Data
-- Run this to populate sample data for testing Phase 4 features

-- Note: Replace 'YOUR_USER_ID' with an actual user ID from your profiles table
-- You can get this by running: SELECT id FROM profiles LIMIT 1;

-- Sample leads for analytics (if you don't have enough)
INSERT INTO leads (parent_name, email, phone, status, source, assigned_to, created_at, last_interaction_at)
VALUES
('Test Parent 1', 'parent1@test.com', '1234567890', 'new', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('Test Parent 2', 'parent2@test.com', '1234567891', 'attempted_contact', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
('Test Parent 3', 'parent3@test.com', '1234567892', 'connected', 'referral', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
('Test Parent 4', 'parent4@test.com', '1234567893', 'visit_scheduled', 'social', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '20 days', NOW()),
('Test Parent 5', 'parent5@test.com', '1234567894', 'enrolled', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
('Test Parent 6', 'parent6@test.com', '1234567895', 'lost', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days');

-- Sample interactions for analytics
INSERT INTO interactions (type, notes, lead_id, created_by, created_at)
SELECT 
  'call',
  'Follow-up call',
  id,
  (SELECT id FROM profiles LIMIT 1),
  created_at + INTERVAL '1 day'
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days'
LIMIT 10;

-- Sample tasks for alerts
INSERT INTO tasks (title, description, due_date, lead_id, assigned_to, status, created_by, created_at)
SELECT
  'Follow up with ' || parent_name,
  'Schedule visit',
  NOW() - INTERVAL '2 days',  -- Overdue task
  id,
  (SELECT id FROM profiles LIMIT 1),
  'pending',
  (SELECT id FROM profiles LIMIT 1),
  NOW() - INTERVAL '5 days'
FROM leads
WHERE status IN ('new', 'attempted_contact')
LIMIT 3;

-- Verify data
SELECT 'Leads Count:' as metric, COUNT(*) as value FROM leads
UNION ALL
SELECT 'Interactions Count:', COUNT(*) FROM interactions
UNION ALL
SELECT 'Tasks Count:', COUNT(*) FROM tasks
UNION ALL
SELECT 'Overdue Tasks:', COUNT(*) FROM tasks WHERE due_date < NOW() AND status = 'pending'
UNION ALL
SELECT 'Stale Leads (no interaction 7+ days):', COUNT(*) FROM leads 
WHERE (last_interaction_at IS NULL OR last_interaction_at < NOW() - INTERVAL '7 days')
AND status NOT IN ('enrolled', 'lost');
