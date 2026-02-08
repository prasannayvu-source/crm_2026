# Phase 1: Core CRM (MVP)

## 1. Purpose
The MVP's core objective is to centralize parent and student information so that **no enquiry is lost**. This phase focuses on data entry, basic tracking, and ensuring every lead has an owner. It moves the organization from spreadsheets/sticky notes to a structured database.

## 2. Features Included
- **Lead & Student Management**:
  - Full profile creation (Parent details + Child details).
  - Manual "Add Lead" form (Walk-ins/Phone).
  - Basic "Public Enquiry" form (Web).
- **Ownership & Assignment**:
  - Auto-assign to creator or manual assignment by Admin.
  - "My Leads" view for counselors.
- **Workflow & Tasks**:
  - Log simple follow-up tasks ("Call back on Friday").
  - Basic status tracking (New -> Contacted -> Visit Scheduled).
- **Search**:
  - Global search bar to find leads by Name, Phone, or Email.

## 3. Pages & UI Components
- **Dashboard (`/dashboard`)**:
  - "My Tasks Today" widget.
  - "Recent Leads" list.
  - "Quick Add" button.
- **Lead List (`/leads`)**:
  - Table view with columns: Name, Stage, Owner, Last Contact.
  - Filters: Start simple (Status, Owner).
- **Lead Detail View (`/leads/[id]`)**:
  - **Header**: Name, Status Badge, Assignee Dropdown.
  - **Left Col**: Parent Info (Phone, Email, Tags), Student Info (Name, Grade).
  - **Right Col**: Task List (Due/Completed) + Basic Notes.
  - **Action Bar**: "Log Call (Simulated - Note only)", "Add Task", "Change Status".
- **Global Search**:
  - Modal overlay (`Cmd+K`) or persistent Top Bar query input.

## 4. Backend Logic (FastAPI)
- CRU[D] for `leads` (Delete is strictly limited/soft-delete).
- **Pagination**: Efficiently serve lists of leads (limit/offset).
- **Assignment Logic**: Admin can PATCH `assigned_to`.
- **Search Logic**: Postgres Full Text Search (search `name`, `phone`, `email`).

## 5. Database Models / Schema (Supabase)
### Tables
- **`leads`**:
  - `id` (uuid, pk)
  - `parent_name`, `email`, `phone` (indexed)
  - `status` (enum: 'new', 'attempted_contact', 'connected', 'visit_scheduled', 'application_submitted', 'enrolled', 'lost')
  - `source` (enum: 'website', 'walk_in', 'referral', 'social')
  - `assigned_to` (fk `profiles.id`)
  - `created_by` (fk `profiles.id`)
  - `created_at`, `updated_at`

- **`students`**:
  - `id`, `lead_id` (fk `leads.id`)
  - `name`, `grade_applying_for`, `dob`

- **`tasks`**:
  - `id`, `lead_id` (fk)
  - `title`, `description`, `due_date`
  - `status` (enum: 'pending', 'completed', 'overdue')
  - `assigned_to` (fk `profiles.id`)

### Migrations
- Trigger: `updated_at` on `leads`.

## 6. APIs & Integrations
- `GET /api/v1/leads`: List handling (filter `status`, `assigned_to`).
- `POST /api/v1/leads`: Create new enquiry.
- `GET /api/v1/leads/{id}`: Detailed view.
- `PATCH /api/v1/leads/{id}/assign`: Reassign owner.
- `POST /api/v1/tasks`: Create reminder.

## 7. Authentication & Permissions
- **Admin**: View/Edit ALL leads. Reassign anyone.
- **Manager**: View/Edit leads in their "Team" (Team logic later, for now equivalent to Admin or all).
- **Counselor**: View/Edit ONLY `assigned_to` leads + leads created by them? (Usually, strictly assigned. Leads created by them auto-assign to them).

## 8. Connection to Previous Phase
- Relies on **Users (Phase 0)** existing to be `assigned_to` leads.
- Authenticated session required to access any `/leads` route.

## 9. Outcome (What is possible AFTER this phase?)
- The database is the Single Source of Truth for *who* is interested.
- Counselors know *what* they need to do today (Tasks).
- Admins can see *how many* leads are coming in.
