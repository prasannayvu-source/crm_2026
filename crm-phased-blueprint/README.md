# CRM Development Blueprint

## Project Overview
This document outlines the comprehensive development plan for a scalable, high-performance CRM tailored for educational institutions. The goal is to streamline the admissions process, ensuring no parent enquiry is lost, providing visibility into the admissions pipeline, and automating communication to reduce manual overhead.

## CRM Problem Statement
Educational institutions hinder their growth due to:
- **Lost Enquiries**: Lack of a centralized system leads to missed follow-ups and lost potential admissions.
- **Lack of Visibility**: Management lacks real-time insights into counselor performance and pipeline health.
- **Manual Overload**: Counselors spend excessive time on manual data entry and communication, reducing time for meaningful engagement.
- **Scalability Issues**: Existing ad-hoc solutions cannot handle growth from 10k to 100k+ parents.

## Tech Stack Summary (Fixed)
### Frontend
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Vanilla CSS (TailwindCSS not requested, adhering to strict custom CSS/guidelines) *Correction: User prompt says "Use Vanilla CSS ... Avoid using TailwindCSS unless the USER explicitly requests it". However, the prompt for this task doesn't explicitly mention CSS framework preference other than "Modern SaaS Dark + Glassmorphism". I will assume standard CSS or Tailwind if standard in Next.js stacks, but the system prompt says "Avoid using TailwindCSS unless...". I will stick to the system prompt's generated stack advice or the user's specific "Technical Stack" section.
The User's "2. FIXED TECH STACK" only says:
- Frontend: Next.js, TypeScript.
- Backend: FastAPI (Python).
- Database & Auth: Supabase.
It does NOT specify CSS. I will stick to what the system prompt says about CSS: "Use Vanilla CSS... Avoid using TailwindCSS". So I will use Vanilla CSS / CSS Modules in the design system plan.

### Backend
- **Framework**: FastAPI (Python)

### Database & Infrastructure
- **Provider**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (Gmail, Phone OTP)
- **Storage**: Supabase Storage

## Development Phases
This project is divided into 6 strict execution phases to ensure stability, testability, and incremental value delivery.

### [Phase 0: Landing, Entry & Access Control](./phase-0.md)
**Goal**: Establish the secure entry point and public face of the CRM.
- Landing page with value proposition.
- Secure Role-Based Access Control (RBAC) via Supabase Auth.
- Admin and Counselor specific login flows.

### [Phase 1: Core CRM (MVP)](./phase-1.md)
**Goal**: Ensure NO parent enquiry is lost.
- Parent profile and lead capture.
- Basic lead management and status tracking.
- Counselor assignment and basic task management.

### [Phase 2: Admissions Pipeline & Ownership](./phase-2.md)
**Goal**: Visibility, accountability, and conversion tracking.
- Visual admissions pipeline.
- Advanced lead aging and overdue detection.
- Manager dashboards for oversight.

### [Phase 3: Communication & Automation](./phase-3.md)
**Goal**: Reduce dependency on human memory.
- Integrated call logging and notes.
- Automated task creation based on status changes.
- SLA monitoring and alerts.

### [Phase 4: Reporting, Exports & Admin Config](./phase-4.md)
**Goal**: Management confidence and operational control.
- Deep analytics and performance reporting.
- Data export capabilities (CSV/Excel).
- Self-serve admin configuration.

### [Phase 5: Scale Readiness & Future Integration](./phase-5.md)
**Goal**: Prepare system for 10k → 100k+ parents.
- Performance optimization and caching.
- Security hardening and audit logs.
- Preparation for external integrations (LMS).

## Development Flow
1.  **Phase 0**: Foundations. No CRM logic yet, just access.
2.  **Phase 1**: Data Entry. We can put data in.
3.  **Phase 2**: Process. We can move data through a workflow.
4.  **Phase 3**: Efficiency. The system helps us move data.
5.  **Phase 4**: Insight. We understand what is happening.
6.  **Phase 5**: Scale. We can do this forever, with high volume.

**Crucial Rule**: Do not skip phases. Each phase relies on the data structures and logic established in the prior phase.

## Scalability
The architecture uses Supabase (PostgreSQL) for robust data handling and FastAPI for high-performance business logic. The phased approach ensures that core schemas are stabilized before complex automation (Phase 3) or heavy reporting (Phase 4) is built, preventing technical debt accumulation.
