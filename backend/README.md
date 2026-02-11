# OnlyAI CRM - Backend

This backend is built with FastAPI and connects to Supabase via the official Python client. It provides a comprehensive REST API for the CRM system with enterprise-grade features.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Create a `.env` file with:
    ```env
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    SUPABASE_ANON_KEY=your_anon_key
    ```

3.  **Run Development Server**:
    ```bash
    uvicorn main:app --reload
    ```
    API will be available at `http://localhost:8000`.
    Documentation: `http://localhost:8000/docs`.

## Structure

```
backend/
├── main.py              # FastAPI app entry point
├── database.py          # Supabase client initialization
├── dependencies.py      # Authentication and RBAC middleware
├── models.py            # Pydantic models for request/response
├── routers/             # API route modules
│   ├── leads.py         # Lead management endpoints
│   ├── tasks.py         # Task management endpoints
│   ├── pipeline.py      # Pipeline and funnel endpoints
│   ├── interactions.py  # Communication logging endpoints
│   ├── analytics.py     # Analytics & KPIs (Phase 4)
│   ├── reports.py       # Report builder & exports (Phase 4)
│   └── admin.py         # Admin console endpoints (Phase 4)
└── requirements.txt     # Python dependencies
```

## API Endpoints

### Authentication
All endpoints (except public routes) require a valid Supabase JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Phase 0-3: Core CRM Endpoints

#### Leads
- `GET /api/v1/leads` - List leads with filters
  - Query params: `status`, `source`, `assigned_to`, `search`, `limit`, `offset`
- `POST /api/v1/leads` - Create new lead
- `GET /api/v1/leads/{id}` - Get lead details
- `PATCH /api/v1/leads/{id}` - Update lead
- `PATCH /api/v1/leads/{id}/assign` - Reassign lead

#### Tasks
- `GET /api/v1/tasks` - List tasks
  - Query params: `lead_id`, `assigned_to`, `status`, `due_before`
- `POST /api/v1/tasks` - Create task
- `PATCH /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task

#### Pipeline
- `GET /api/v1/pipeline/summary` - Get pipeline stage counts
- `PATCH /api/v1/leads/{id}/status` - Move lead to new stage

#### Interactions
- `GET /api/v1/leads/{id}/interactions` - Get lead interaction history
- `POST /api/v1/leads/{id}/interactions` - Log new interaction
- `GET /api/v1/leads/{id}/timeline` - Unified timeline (interactions + tasks + history)

### Phase 4: Analytics, Reports & Admin Endpoints

#### Analytics (`/api/v1/analytics`)
- `GET /analytics/kpis` - Get KPI metrics
  - Query params: `date_from`, `date_to`, `source`, `status`, `assigned_to`
  - Response: Total leads, enrollments, conversion rate, active pipeline
  
- `GET /analytics/lead-volume` - Lead volume over time
  - Query params: `date_from`, `date_to`, `granularity` (day/week/month)
  - Response: Array of `{ date, count }`
  
- `GET /analytics/funnel` - Pipeline funnel analysis
  - Query params: `date_from`, `date_to`, `source`
  - Response: Array of `{ stage, count, percentage, drop_off_rate }`
  
- `GET /analytics/conversion-by-source` - Conversion rates by lead source
  - Response: Array of `{ source, total_leads, enrolled, conversion_rate }`
  
- `GET /analytics/counselor-performance` - Counselor metrics
  - Query params: `date_from`, `date_to`
  - Response: Array of counselor stats (leads, interactions, enrollments, conversion rate)
  
- `GET /analytics/alerts` - Get at-risk leads and system alerts
  - Response: Array of `{ type, severity, title, description, link, created_at }`

#### Reports (`/api/v1/reports`)
- `GET /reports/templates` - Get pre-built report templates
  - Response: Array of `{ id, name, description, fields, filters }`
  
- `POST /reports/build` - Build custom report
  - Body: `{ name, fields, filters, grouping, sorting, aggregations }`
  - Response: `{ report_id, preview_data, row_count }`
  
- `POST /reports/export` - Export report to file
  - Body: `{ report_id, format }` (csv/pdf/xlsx/sheets)
  - Response: `{ download_url, expires_at }`
  
- `POST /reports/schedule` - Schedule recurring report
  - Body: `{ report_id, frequency, time, recipients, format }`
  - Response: `{ schedule_id, next_run }`
  
- `GET /reports/scheduled` - List scheduled reports
  - Response: Array of scheduled report details
  
- `PATCH /reports/scheduled/{id}` - Update scheduled report
  - Body: `{ status }` (active/paused)
  
- `DELETE /reports/scheduled/{id}` - Delete scheduled report
  
- `GET /reports/history` - Get report run history
  - Query params: `report_id`, `limit`, `offset`
  - Response: Array of past report runs with download links

#### Admin (`/api/v1/admin`)
**Note**: All admin endpoints require `admin` role.

**User Management**
- `GET /admin/users` - List all users
  - Query params: `search`, `role`, `status`, `limit`, `offset`
  - Response: `{ users: [], total, page, limit }`
  
- `POST /admin/users` - Create new user
  - Body: `{ full_name, email, phone, role, status, send_invite }`
  - Response: `{ user_id, invite_sent }`
  
- `PATCH /admin/users/{id}` - Update user
  - Body: `{ full_name?, email?, role?, status? }`
  
- `DELETE /admin/users/{id}` - Delete user
  
- `POST /admin/users/{id}/impersonate` - Impersonate user
  - Response: `{ impersonation_token, expires_at }`
  
- `POST /admin/users/bulk-action` - Bulk user actions
  - Body: `{ user_ids: [], action }` (activate/deactivate/delete)

**Roles & Permissions**
- `GET /admin/roles` - List all roles
  - Response: Array of `{ id, name, description, permissions, is_system }`
  
- `POST /admin/roles` - Create custom role
  - Body: `{ name, description, permissions }`
  
- `PATCH /admin/roles/{id}` - Update role permissions
  
- `DELETE /admin/roles/{id}` - Delete custom role
  - Note: Cannot delete system roles (admin, manager, counselor)

**Integrations**
- `GET /admin/integrations` - List all integrations
  - Response: Array of `{ type, name, status, config, last_sync }`
  
- `POST /admin/integrations/{type}/connect` - Connect integration
  - Body: `{ credentials, config }`
  
- `DELETE /admin/integrations/{type}/disconnect` - Disconnect integration
  
- `POST /admin/integrations/webhooks` - Create webhook
  - Body: `{ events: [], endpoint_url, secret }`
  
- `GET /admin/integrations/api-keys` - List API keys
  
- `POST /admin/integrations/api-keys` - Generate new API key
  - Response: `{ key_id, api_key }` (full key shown once)
  
- `DELETE /admin/integrations/api-keys/{id}` - Revoke API key

**System Health**
- `GET /admin/health` - Get system health status
  - Response: Server, database, jobs, and performance metrics
  
- `GET /admin/health/metrics` - Get historical metrics
  - Query params: `metric_type`, `time_range`
  - Response: Time-series data for charts

**Audit Logs**
- `GET /admin/audit-logs` - Get audit log entries
  - Query params: `date_from`, `date_to`, `user_id`, `action`, `resource`, `search`, `limit`, `offset`
  - Response: `{ logs: [], total, page, limit }`
  
- `GET /admin/audit-logs/{id}` - Get detailed log entry
  - Response: Full log details including before/after values

## Authentication & Authorization

### Role-Based Access Control (RBAC)

The system implements three primary roles:

1. **Admin**
   - Full access to all features
   - User management
   - System configuration
   - Analytics and reports (all data)

2. **Manager**
   - View team analytics
   - Manage team leads
   - View reports
   - No admin access

3. **Counselor**
   - Manage assigned leads
   - Log interactions
   - View personal stats
   - No admin or team-wide access

### Implementing RBAC in Routes

```python
from dependencies import require_role

@router.get("/admin/users")
async def get_users(user=Depends(require_role(["admin"]))):
    # Only admins can access
    pass

@router.get("/leads")
async def get_leads(user=Depends(require_role(["admin", "manager", "counselor"]))):
    # All authenticated users can access
    # Filter data based on role in the function
    pass
```

## Database Schema

### Core Tables (Supabase)

- `profiles` - User profiles (extends auth.users)
- `leads` - Parent/student lead information
- `students` - Student details (linked to leads)
- `tasks` - Follow-up tasks
- `interactions` - Communication log (calls, notes, meetings)
- `lead_history` - Status change tracking
- `notifications` - In-app notifications

### Phase 4 Tables

- `app_settings` - System configuration (key-value store)
- `reports` - Saved report definitions
- `scheduled_reports` - Report schedules
- `report_runs` - Report execution history
- `roles` - Custom role definitions
- `permissions` - Role-permission mappings
- `integrations` - External integration configs
- `api_keys` - API key management
- `audit_logs` - System audit trail
- `webhooks` - Webhook configurations

## Development Guidelines

### Adding New Endpoints

1. Create or update router file in `routers/`
2. Define Pydantic models in `models.py`
3. Implement RBAC using `require_role` dependency
4. Add route to `main.py` using `app.include_router()`
5. Test endpoint in Swagger UI (`/docs`)

### Error Handling

Use FastAPI's `HTTPException` for errors:

```python
from fastapi import HTTPException

if not lead:
    raise HTTPException(status_code=404, detail="Lead not found")
```

### Logging

Use Python's logging module:

```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Lead {lead_id} updated by user {user.id}")
```

## Testing

### Manual Testing
Visit `http://localhost:8000/docs` for interactive API testing with Swagger UI.

### Automated Testing
```bash
pytest tests/
```

## Performance Optimization

### Database Queries
- Use appropriate indexes on frequently queried fields
- Implement pagination for list endpoints
- Use Supabase RPC for complex aggregations

### Caching
- Implement Redis caching for analytics endpoints
- Cache TTL: 5 minutes for KPIs, 1 hour for reports

### Background Jobs
- Use Celery or similar for long-running tasks (report generation, email sending)
- Queue scheduled reports for async execution

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Validate all inputs** using Pydantic models
3. **Implement rate limiting** on sensitive endpoints
4. **Log all admin actions** to audit logs
5. **Hash sensitive data** (API keys, webhook secrets)
6. **Use HTTPS** in production
7. **Implement CORS** properly (restrict origins)

## Phase Completion Status

### Phase 0: Landing & Auth ✅
- [x] Initial Setup
- [x] Database Schemas (`profiles`)
- [x] Auth Middleware (`dependencies.py`)
- [x] Health Check (`/api/v1/health`)

### Phase 1: Core CRM ✅
- [x] Lead CRUD endpoints
- [x] Student management
- [x] Task management
- [x] Search functionality

### Phase 2: Pipeline & Ownership ✅
- [x] Pipeline summary endpoint
- [x] Status change tracking
- [x] Lead history logging
- [x] Bulk assignment

### Phase 3: Communication & Automation ✅
- [x] Interaction logging
- [x] Timeline endpoint
- [x] Notification system
- [x] SLA monitoring

### Phase 4: Analytics, Reports & Admin 🚧
- [ ] Analytics endpoints
- [ ] Report builder
- [ ] Admin user management
- [ ] Audit logging
- [ ] Integration management

## Deployment

### Environment Variables (Production)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_key
ALLOWED_ORIGINS=https://your-frontend-domain.com
REDIS_URL=redis://your-redis-instance
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Deployment Platforms
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **AWS/GCP**: Use Docker container

## Support

For backend-specific issues or questions, refer to:
- FastAPI documentation: https://fastapi.tiangolo.com
- Supabase Python docs: https://supabase.com/docs/reference/python
- Project blueprint: `../crm-phased-blueprint/`
