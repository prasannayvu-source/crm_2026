# Jeevana Vidya Online School CRM

A comprehensive, enterprise-grade Customer Relationship Management system designed specifically for educational institutions. Built with modern technologies and following pixel-perfect design standards inspired by PowerSchool, Canvas, and Infinite Campus.

## Project Overview

This CRM streamlines the admissions process, ensuring no parent enquiry is lost, providing complete visibility into the admissions pipeline, and automating communication to reduce manual overhead.

## Tech Stack

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Vanilla CSS with Glassmorphism design system
- **State Management**: React Hooks
- **Charts**: Recharts (for Analytics)
- **UI Components**: Custom component library

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Email, Google OAuth)
- **Storage**: Supabase Storage
- **API Documentation**: Auto-generated OpenAPI/Swagger

## Current Status

**✅ Phase 0-3: COMPLETED**
- Landing page & authentication
- Core CRM (leads, students, tasks)
- Visual pipeline with drag-and-drop
- Communication logging & automation
- Manager dashboards

**🚧 Phase 4: IN PLANNING**
- Analytics Dashboard (enterprise-grade)
- Reports Builder & Scheduler
- Admin Console (users, roles, integrations)

## Features

### Core Features (Phases 0-3)
- 🔐 **Secure Authentication**: Email/password and Google OAuth
- 👥 **Lead Management**: Complete parent and student profiles
- 📊 **Visual Pipeline**: Drag-and-drop Kanban board
- ✅ **Task Management**: Automated task creation and reminders
- 📝 **Interaction Logging**: Calls, notes, meetings timeline
- ⚠️ **SLA Monitoring**: Automatic "stall" detection for inactive leads
- 🎯 **Role-Based Access**: Admin, Manager, Counselor permissions

### Upcoming Features (Phase 4)
- 📈 **Analytics Dashboard**:
  - Real-time KPI cards (Total Leads, Conversion Rate, etc.)
  - Interactive charts (Lead Volume, Pipeline Funnel, Source Analysis)
  - Counselor Performance Grid
  - At-Risk Alerts Rail
  - Drill-down capabilities
  
- 📋 **Reports Center**:
  - 3-step Report Builder (Fields → Layout → Schedule)
  - Multiple export formats (CSV, PDF, Excel, Google Sheets)
  - Scheduled reports with email delivery
  - Report history and templates
  
- ⚙️ **Admin Console**:
  - User management with bulk actions
  - Role & permission matrix
  - Integrations (SMTP, Google Workspace, Webhooks, API Keys)
  - System health monitoring
  - Comprehensive audit logs
  - User impersonation (for support)

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- Supabase account (for database and auth)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your Supabase credentials to .env
uvicorn main:app --reload
```

Backend API will be available at `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

## Project Structure

```
crm_2026/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   │   ├── (main)/      # Authenticated routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── leads/
│   │   │   │   ├── pipeline/
│   │   │   │   ├── manager/
│   │   │   │   ├── analytics/  # Phase 4
│   │   │   │   ├── reports/    # Phase 4
│   │   │   │   └── admin/      # Phase 4
│   │   │   ├── login/
│   │   │   └── signup/
│   │   └── lib/             # Utilities and helpers
│   └── public/              # Static assets
│
├── backend/                 # FastAPI backend application
│   ├── routers/            # API route modules
│   │   ├── leads.py
│   │   ├── tasks.py
│   │   ├── pipeline.py
│   │   ├── interactions.py
│   │   ├── analytics.py    # Phase 4
│   │   ├── reports.py      # Phase 4
│   │   └── admin.py        # Phase 4
│   ├── models.py           # Pydantic models
│   ├── database.py         # Supabase client
│   ├── dependencies.py     # Auth & RBAC middleware
│   └── main.py             # FastAPI app entry point
│
└── crm-phased-blueprint/   # Comprehensive documentation
    ├── README.md           # Development roadmap
    ├── phase-0.md          # Landing & Auth
    ├── phase-1.md          # Core CRM
    ├── phase-2.md          # Pipeline & Ownership
    ├── phase-3.md          # Communication & Automation
    ├── phase-4.md          # Analytics, Reports & Admin ⭐
    └── UI_UX_Guidelines.md # Design system documentation
```

## Documentation

Comprehensive documentation is available in the `crm-phased-blueprint/` directory:

- **[Development Roadmap](./crm-phased-blueprint/README.md)**: Complete phased development plan
- **[Phase 4 Specifications](./crm-phased-blueprint/phase-4.md)**: Detailed specs for Analytics, Reports, and Admin tabs
- **[UI/UX Guidelines](./crm-phased-blueprint/UI_UX_Guidelines.md)**: Design system and component specifications
- **[Backend README](./backend/README.md)**: Backend-specific setup and API documentation

## Design Philosophy

**Inspiration**: PowerSchool, Canvas, Infinite Campus
**Theme**: Modern SaaS Dark + Glassmorphism
**Standards**: Pixel-perfect, responsive, accessible (WCAG 2.1 AA)

### Key Design Principles
- Dark background to minimize eye strain
- Glassmorphism for depth without clutter
- High contrast for readability
- Subtle animations for premium feel
- Mobile-first responsive design

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Key Endpoints
- `POST /api/v1/leads`: Create new lead
- `GET /api/v1/leads`: List leads with filters
- `GET /api/v1/pipeline/summary`: Pipeline statistics
- `POST /api/v1/interactions`: Log call/note
- `GET /api/v1/analytics/kpis`: Analytics KPIs (Phase 4)
- `POST /api/v1/reports/build`: Build custom report (Phase 4)
- `GET /api/v1/admin/users`: User management (Phase 4)

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
vercel --prod
```

### Backend (Railway/Render)
```bash
cd backend
# Deploy using your preferred platform
# Ensure environment variables are set
```

## Contributing

This is a private project for Jeevana Vidya Online School. For internal development guidelines, see the blueprint documentation.

## License

Proprietary - All rights reserved by Jeevana Vidya Online School

## Support

For technical support or questions, contact the development team.

---

**Current Version**: Phase 3 Complete, Phase 4 In Planning
**Last Updated**: February 2026
