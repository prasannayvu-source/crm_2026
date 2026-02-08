# Phase 4: Reporting, Exports & Admin Config

## 1. Purpose
This phase empowers leadership with data-driven insights. It provides the tools to measure organizational health, export data for external analysis (finance/marketing), and allows Admins to configure the CRM without needing a developer (e.g., adding a new lead source or modifying drop-downs).

## 2. Features Included
- **Executive Dashboards**:
  - Daily/Weekly/Monthly Lead Volume.
  - Conversion Rates per Source/Counselor.
  - Pipeline Velocity (Avg days to close).
- **Counselor Performance**:
  - Leaderboard: Calls made, Tasks completed, Revenue closed.
- **Data Export**:
  - "Export All Leads" to CSV/Excel.
  - Filters preserved in export.
- **Admin Configuration**:
  - Manage Dropdown Options (Lead Source, Status).
  - Manage Users (Create, Deactivate, Reset Password).
  - Define SLA thresholds (e.g., Change "Contact" SLA from 24h to 12h).

## 3. Pages & UI Components
- **Analytics Hub (`/analytics`)**:
  - Interactive charts (Line: Volume over time, Funnel: Conversion).
  - Date Range Picker (Last 30 days, Custom).
- **Reports Section (`/reports`)**:
  - **Download Center**: "Generate Report" button (async if large).
  - **Scheduled Reports**: Email daily summary opt-in.
- **Admin Settings (`/admin/settings`)**:
  - "General Config": School Name, Logo.
  - "Dropdown Editor": Add value to 'Lead Source'.
  - "User Management": Table of staff, Role editor.

## 4. Backend Logic (FastAPI)
- **Aggregation Pipelines**: Optimized SQL for grouping and counting.
- **CSV Generator**: Streaming response for large datasets (pandas or csv module).
- **Dynamic Options**: API endpoint serving dropdown choices from `settings` table instead of hardcoded enums (Phase 4 upgrade).

## 5. Database Models / Schema (Supabase)
### Tables
- **`app_settings`**:
  - `key` (varchar, unique)
  - `value` (jsonb, flexible)
  - `updated_by` (fk)

- **`daily_metrics`** (Materialized View or Table):
  - Pre-calculated stats for fast dashboard loading.

## 6. APIs & Integrations
- `GET /api/v1/analytics/funnel`: Query stage conversion.
- `GET /api/v1/analytics/performance`: User-wise stats.
- `POST /api/v1/export/leads`: Trigger CSV download.
- `PUT /api/v1/admin/settings/{key}`: Update global config.

## 7. Authentication & Permissions
- **Admin**: FULL access to all analytics and settings.
- **Manager**: View Analytics/Performance for their team. No access to global settings.
- **Counselor**: View strictly personal stats (Gamification).

## 8. Connection to Previous Phase
- Uses the `history` and `interaction` data from Phase 2 & 3 to calculate velocity and activity metrics.

## 9. Outcome (What is possible AFTER this phase?)
- "We know exactly which marketing channel has the highest ROI."
- "We can identify underperforming counselors based on data, not hunches."
- "Admins can unblock operations (e.g., add new counselor) without IT support."
