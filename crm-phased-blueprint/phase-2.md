# Phase 2: Admissions Pipeline & Ownership

## 1. Purpose
This phase transforms the CRM from a "list" into a "process". It introduces visibility into *where* each lead is in the funnel, how long they've been stagnant, and who is accountable for moving them forward. It enables management by exception (focusing on stuck/overdue leads).

## 2. Features Included
- **Visual Pipeline (Board View)**: Drag-and-drop or column view of leads by Stage.
- **Advanced Lead Lifecycle**:
  - Track time-in-stage (Lead Aging).
  - Detect "stuck" leads (e.g., >3 days in 'New' without contact).
- **Ownership Management**:
  - Bulk Reassignment tool for Admins (e.g., when a counselor leaves).
  - "Unassigned Leads" pool logic.
- **Manager Dashboards**:
  - "Team Performance" widget.
  - "Pipeline Health" overview.
- **Smart Filters**:
  - "Saved Views" (e.g., "My High Priority Leads", "New This Week").

## 3. Pages & UI Components
- **Pipeline Board (`/pipeline`)**:
  - Columns for each Status (`New`, `Contacted`, `Visit`, `Application`, `Enrolled`).
  - Cards show Name, Child Grade, and **Red Badge** if overdue.
  - Drag-drop to change status triggers a modal ("Add Note/Task mandatory?").
- **Manager Dashboard (`/manager`)**:
  - "Leads by Stage" bar chart.
  - "Leads by Source" pie chart.
  - "Stale Leads" list (Alerts).
- **Bulk Edit Interface**:
  - Select multiple rows in List View -> "Reassign to [Name]".

## 4. Backend Logic (FastAPI)
- **Status Change Logic**:
  - When status updates, log entry in `lead_status_history`.
  - Calculate `days_in_stage` dynamically for aging alerts.
- **Overdue Detection**:
  - Background Job (Celery/Cron or just Query-time calculation) to flag leads past SLA thresholds (e.g., New > 24h = Overdue).
- **Bulk Operations**:
  - Transactional updates for renaming ownership of 100+ leads safely.

## 5. Database Models / Schema (Supabase)
### Tables
- **`lead_status_settings`** (Optional Config):
  - `status` (enum key)
  - `sla_hours` (int, expected max duration)
  - `mandatory_fields` (json, fields required to enter this stage)

- **`lead_history`**:
  - `id` (uuid)
  - `lead_id` (fk)
  - `previous_status`
  - `new_status`
  - `changed_by` (fk `profiles.id`)
  - `changed_at` (timestamptz)
  - `time_in_previous_stage` (interval)

### Indexes
- Index on `lead_history(lead_id, changed_at)` for quick timeline generation.

## 6. APIs & Integrations
- `GET /api/v1/pipeline/summary`: Counts per stage.
- `GET /api/v1/reports/aging`: List leads sorted by `last_status_change`.
- `POST /api/v1/leads/bulk-assign`: Payload `{ lead_ids: [], new_owner_id: ... }`.

## 7. Authentication & Permissions
- **Admin/Manager**: Can view EVERYONE'S pipe. Can bulk reassign.
- **Counselor**: Can only view THEIR pipe. Cannot reassign (unless logic allows "returning to pool").

## 8. Connection to Previous Phase
- Uses `leads` data from Phase 1.
- Adds the temporal dimension (Time) to the static data (Profile).

## 9. Outcome (What is possible AFTER this phase?)
- Managers can answer: "Why do we have 50 leads stuck in 'Contacted' for 2 weeks?"
- Counselors can answer: "What are my most urgent actions today?" (Stale leads bubble up).
