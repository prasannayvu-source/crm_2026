# Phase 0: Landing, Entry & Access Control (MANDATORY START)

## 1. Purpose
This phase establishes the foundational security, user identity, and public presence of the CRM. It ensures that only authorized personnel can access the system and directs them to the appropriate dashboard based on their role. No CRM functionality is built here—only the "keys" to the building.

## 2. Features Included
- **Landing Page**: A high-converting public page explaining the CRM value proposition.
- **Authentication**: Secure signup and login via Gmail and Phone OTP.
- **Role-Based Access Control (RBAC)**: Distinct access levels for Admins, Counselors, and Managers.
- **System Pages**: Standard system overlays (Maintenance, Access Denied, 404).

## 3. Pages & UI Components
### Public Pages
- **Landing Page (`/`)**:
  - **Hero Section**: "Streamline Your Admissions". CTA: "Login" / "Get Started".
  - **Features Grid**: Highlights (Pipeline, Automation, Reports). Glassmorphic cards.
  - **Footer**: Copyright, Links.
- **Pricing / Payment Placeholder (`/pricing`)**: Static page indicating "Coming Soon" or simple tier display.

### Auth Pages
- **Login (`/login`)**:
  - Email/Password form (or Magic Link).
  - "Continue with Google" button.
  - "Login with Phone" toggle.
- **Signup (`/signup`)**:
  - Similar methods to Login.
  - Role selection is **hidden** (default is 'user' or 'counselor' pending approval, or specific invite-only flows). *Note: For MVP/Internal tool, usually Admin creates users, or Signup is open but requires Admin approval. We will assume open signup with default role 'guest' or 'applicant' for now, or strict Admin-invite only. For this blueprint, we will implement self-signup with default 'pending' state or basic access.*
- **Forgot Password**: Standard recovery flow.

### System Pages
- **Access Denied (`/403`)**: "You do not have permission to view this page."
- **Maintenance (`/503`)**: "System is under maintenance."

## 4. Backend Logic (FastAPI)
- **Auth Middleware**: Verify Supabase JWT tokens on every request.
- **Role Verification**: Dependency designed to block routes based on user role (`admin`, `manager`, `counselor`).
- **User Profiling**: Triggers (Supabase Edge Function or FastAPI hook) to create a public profile entry upon new user registration.

## 5. Database Models / Schema (Supabase)
### Tables
- **`profiles`** (extends `auth.users`):
  - `id` (uuid, references `auth.users.id`)
  - `full_name` (text)
  - `role` (enum: 'admin', 'manager', 'counselor', 'support')
  - `phone_number` (text)
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `status` (enum: 'active', 'inactive', 'pending')

### Security Policies (RLS)
- **`profiles`**:
  - specific roles (Admin) can read/write all.
  - Users can read/edit their own profile.

## 6. APIs & Integrations
- **Supabase Auth**:
  - Google OAuth provider configuration.
  - SMS Provider (Twilio/MessageBird via Supabase) configuration.
- **Endpoints**:
  - `GET /api/v1/auth/me`: Return current user profile and role.
  - `POST /api/v1/auth/invite`: (Admin only) Invite a new counselor/staff via email.

## 7. Authentication & Permissions
- **Admin**: Full access to all settings and user management actions.
- **Manager**: Access to team dashboards.
- **Counselor**: Access to own leads and tasks.
- **Support**: Read-only or limited write access (defined in Phase 1+).

## 8. Connection to Previous Phase
- **N/A**: This is the starting point.

## 9. Outcome (What is possible AFTER this phase?)
- Users can visit the URL and see a professional landing page.
- Users can log in securely.
- The system explicitly knows *who* is logged in and *what* they are allowed to do.
- Ready to accept actual CRM data (parent/student profiles) in Phase 1.
