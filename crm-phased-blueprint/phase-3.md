# Phase 3: Communication & Automation

## 1. Purpose
This phase moves the system from *passive* data storage to *active* assistance. It logs every touchpoint (calls, notes) to create a full history of the relationship and uses automation to ensure next steps are never missed. The goal is to reduce cognitive load on counselors.

## 2. Features Included
- **Comprehensive Timeline**:
  - Unified view of Calls, Notes, Tasks, and Status Changes.
  - "Append-Only" Notes for audit/accountability.
- **Integrated Call & Interaction Logging**:
  - "Log Call" modal (Outcome: Connected, No Answer, Voicemail).
  - Meeting notes (Visit feedback).
- **Intelligent Automation**:
  - **Auto-Task**: When Status = "Visit Scheduled" -> Create Task "Send Confirmation" + "Prepare Packet".
  - **Auto-Reminder**: If status "New" > 24h -> Notify Manager.
- **SLA Engine**:
  - Definitions for "Stale" leads per stage.
  - In-app Notifications for overdue items.

## 3. Pages & UI Components
- **Lead Detail View (Timeline Tab)**:
  - Vertical timeline stream.
  - Icons for different event types (Phone, Note, Task, Status).
  - "Add Note" text area (markdown supported).
- **Communication Modal**:
  - Log Call: Duration, Outcome (picklist), Summary.
- **Notification Bell**:
  - Dropdown showing "XYZ is overdue", "New Lead assigned".

## 4. Backend Logic (FastAPI)
- **Event Bus / Signal System**:
  - When specific actions occur (Status Update), emit signal.
  - Listeners create `Task` or `Notification`.
- **SLA Monitor**:
  - Scheduled job (Celery Beat or Supabase Cron) checks `last_interaction_at`.
- **Append-Only Logic**:
  - Notes cannot be edited after X minutes (or ever). Soft-delete only by Admin.

## 5. Database Models / Schema (Supabase)
### Tables
- **`interactions`**:
  - `id`, `lead_id`
  - `type` (enum: 'call', 'meeting', 'email', 'note', 'status_change')
  - `outcome` (enum: 'connected', 'no_answer', 'voicemail', 'positive', 'negative')
  - `summary` (text)
  - `created_by`, `created_at` (immutable mostly)

- **`notifications`**:
  - `id`, `user_id`
  - `title`, `message`, `link`
  - `read` (boolean)
  - `created_at`

### Triggers
- Update `leads.last_interaction_at` on insert to `interactions`.

## 6. APIs & Integrations
- `POST /api/v1/leads/{id}/interactions`: Log call/note.
- `GET /api/v1/leads/{id}/timeline`: Unified query of `interactions`, `tasks`, `history`.
- `POST /api/v1/notifications/mark-read`: Batch update.

## 7. Authentication & Permissions
- **All Users**: Can log interactions on their leads.
- **Admin**: Can view timeline of any lead.

## 8. Connection to Previous Phase
- Enriches the Lead Detail View (Phase 1) and utilizes Status Changes (Phase 2) to trigger automations.

## 9. Outcome (What is possible AFTER this phase?)
- "If a counselor leaves, the new owner knows EXACTLY what was said last Tuesday."
- "No lead is forgotten because the system proactively nags the counselor."
