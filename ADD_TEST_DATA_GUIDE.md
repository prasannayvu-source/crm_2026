# Adding Test Data to See Analytics

## Why You See No Data (All Zeros)

Your database is **empty** - there are no leads, interactions, or tasks. That's why:
- Total Leads: **0**
- Enrollments: **0**
- Conversion Rate: **0%**
- All graphs are **empty**

## Quick Fix: Add Test Data

### Option 1: Using Supabase Dashboard (EASIEST) ✅

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Open your project**
3. **Click "SQL Editor"** (left sidebar)
4. **Click "New Query"**
5. **Copy and paste this SQL**:

```sql
-- Add 20 sample leads with different statuses and sources
INSERT INTO leads (parent_name, email, phone, status, source, assigned_to, created_at, last_interaction_at)
VALUES
-- Recent leads (last 7 days)
('Rajesh Kumar', 'rajesh@example.com', '9876543210', 'new', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '1 day', NOW()),
('Priya Sharma', 'priya@example.com', '9876543211', 'attempted_contact', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('Amit Patel', 'amit@example.com', '9876543212', 'connected', 'referral', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '3 days', NOW()),
('Sneha Reddy', 'sneha@example.com', '9876543213', 'visit_scheduled', 'social', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '4 days', NOW()),
('Vikram Singh', 'vikram@example.com', '9876543214', 'enrolled', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),

-- Last 30 days
('Anita Desai', 'anita@example.com', '9876543215', 'new', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
('Rahul Verma', 'rahul@example.com', '9876543216', 'attempted_contact', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days'),
('Kavita Nair', 'kavita@example.com', '9876543217', 'connected', 'referral', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
('Suresh Iyer', 'suresh@example.com', '9876543218', 'application_submitted', 'social', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days'),
('Deepa Menon', 'deepa@example.com', '9876543219', 'enrolled', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days'),

-- Older leads
('Karthik Rao', 'karthik@example.com', '9876543220', 'new', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days'),
('Meera Joshi', 'meera@example.com', '9876543221', 'lost', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '40 days', NOW() - INTERVAL '35 days'),
('Arjun Pillai', 'arjun@example.com', '9876543222', 'enrolled', 'referral', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days'),
('Lakshmi Bhat', 'lakshmi@example.com', '9876543223', 'connected', 'social', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '50 days', NOW() - INTERVAL '2 days'),
('Naveen Gupta', 'naveen@example.com', '9876543224', 'visit_scheduled', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '55 days', NOW()),

-- More recent activity
('Pooja Kapoor', 'pooja@example.com', '9876543225', 'new', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),
('Sanjay Mehta', 'sanjay@example.com', '9876543226', 'attempted_contact', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
('Divya Krishnan', 'divya@example.com', '9876543227', 'connected', 'referral', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),
('Ravi Shankar', 'ravi@example.com', '9876543228', 'enrolled', 'social', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days'),
('Nisha Agarwal', 'nisha@example.com', '9876543229', 'application_submitted', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '11 days', NOW() - INTERVAL '4 days');

-- Add some interactions
INSERT INTO interactions (type, notes, lead_id, created_by, created_at)
SELECT 
  CASE (random() * 3)::int
    WHEN 0 THEN 'call'
    WHEN 1 THEN 'email'
    WHEN 2 THEN 'meeting'
    ELSE 'visit'
  END,
  'Follow-up interaction',
  id,
  (SELECT id FROM profiles LIMIT 1),
  created_at + INTERVAL '1 day'
FROM leads
WHERE created_at > NOW() - INTERVAL '60 days'
LIMIT 30;

-- Verify the data
SELECT 
  'Total Leads' as metric, 
  COUNT(*)::text as count 
FROM leads
UNION ALL
SELECT 
  'Enrolled', 
  COUNT(*)::text 
FROM leads 
WHERE status = 'enrolled'
UNION ALL
SELECT 
  'Interactions', 
  COUNT(*)::text 
FROM interactions;
```

6. **Click "Run"** (or press F5)
7. **Wait for success message**
8. **Refresh your Analytics page**

### Option 2: Quick Test (Just 5 Leads)

If you want just a few leads to test quickly:

```sql
INSERT INTO leads (parent_name, email, phone, status, source, assigned_to, created_at)
VALUES
('Test Parent 1', 'test1@example.com', '1111111111', 'new', 'website', (SELECT id FROM profiles LIMIT 1), NOW()),
('Test Parent 2', 'test2@example.com', '2222222222', 'connected', 'walk_in', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '5 days'),
('Test Parent 3', 'test3@example.com', '3333333333', 'enrolled', 'referral', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '10 days'),
('Test Parent 4', 'test4@example.com', '4444444444', 'visit_scheduled', 'social', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '3 days'),
('Test Parent 5', 'test5@example.com', '5555555555', 'attempted_contact', 'website', (SELECT id FROM profiles LIMIT 1), NOW() - INTERVAL '7 days');
```

## What You'll See After Adding Data

### KPI Cards Will Show:
- **Total Leads**: 20 (or 5 if you used quick test)
- **Enrollments**: 4-5
- **Conversion Rate**: ~20-25%
- **Active Pipeline**: 10-15

### Charts Will Show:
- **Lead Volume Over Time**: Line graph with data points
- **Pipeline Funnel**: Bars showing leads at each stage
- **Conversion by Source**: Pie chart with different sources
- **Counselor Performance**: Table with your performance

### Alerts Will Show:
- Overdue tasks (if any)
- Stale leads (no interaction in 7+ days)
- High-value leads

## Troubleshooting

### If You Get an Error About `profiles`
The query uses `(SELECT id FROM profiles LIMIT 1)` to get your user ID. If this fails:

1. **Find your user ID**:
```sql
SELECT id, email FROM profiles;
```

2. **Copy your ID** (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

3. **Replace in the INSERT query**:
```sql
-- Change this:
assigned_to, (SELECT id FROM profiles LIMIT 1)

-- To this (with your actual ID):
assigned_to, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

### If Data Doesn't Appear
1. **Hard refresh**: Ctrl + Shift + R
2. **Check browser console**: F12 → Console tab
3. **Verify data in Supabase**: Table Editor → leads table

## Expected Results

After adding 20 leads, your Analytics page should show:

```
┌─────────────────────────────────────────────────────────┐
│ TOTAL LEADS        ENROLLMENTS    CONVERSION   PIPELINE │
│     20                 4-5           20-25%      10-15  │
└─────────────────────────────────────────────────────────┘

Lead Volume Over Time
  ▲
20│     ●
  │   ●   ●
15│ ●       ●
  │           ●
10│             ●
  │               ●
 5│                 ●
  │___________________●_____▶
    Last 60 days

Pipeline Funnel
New              ████████ 8
Attempted        ██████ 6
Connected        ████ 4
Visit Scheduled  ███ 3
Enrolled         ████ 4
```

## Status
📊 **Database is empty** - Add test data to see analytics  
✅ **SQL script ready** - Copy and run in Supabase  
🎯 **Expected time**: 2 minutes  

---

**Run the SQL script now and refresh your Analytics page to see beautiful charts with data!** 📈
