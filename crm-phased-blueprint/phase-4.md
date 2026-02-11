# Phase 4: Analytics, Reports & Admin - Enterprise Grade

## 1. Purpose
Transform the CRM into a complete management platform with pixel-perfect, enterprise-grade Analytics, Reports, and Admin interfaces matching the quality of PowerSchool, Canvas, and Infinite Campus. This phase delivers comprehensive data insights, flexible reporting capabilities, and complete system administration tools.

## 2. Design Philosophy
**Inspiration**: PowerSchool / Canvas / Infinite Campus
**Standards**: Pixel-perfect, responsive, accessible (WCAG 2.1 AA)
**Performance**: Lazy-loaded charts, optimized queries, real-time updates
**Security**: Role-based permissions, audit logging, data encryption

---

## 3. ANALYTICS TAB (`/analytics`)

### 3.1 Overview
A comprehensive analytics dashboard providing real-time insights into admissions pipeline health, counselor performance, and conversion metrics.

### 3.2 UI Components

#### A. KPI Row (Top Section)
**Layout**: 4 equal-width cards in a horizontal row
**Cards**:
1. **Total Leads (30 Days)**
   - Large number display
   - Trend indicator (↑/↓ vs previous period)
   - Sparkline mini-chart
   
2. **New Enrollments (30 Days)**
   - Large number display
   - Conversion rate percentage
   - Color-coded status (green if above target)
   
3. **Conversion Rate**
   - Percentage display (e.g., 24.5%)
   - Comparison to target
   - Visual progress bar
   
4. **Active Pipeline Leads**
   - Current count
   - Stage distribution mini-pie
   - At-risk count badge

**Design Specs**:
- Card height: 120px
- Background: `rgba(255, 255, 255, 0.06)` with glassmorphism
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Padding: 20px
- Border radius: 12px

#### B. Filter Bar
**Position**: Below KPI row, sticky on scroll
**Filters**:
- **Date Range**: Dropdown (Last 7 days, 30 days, 90 days, Custom)
- **Lead Source**: Multi-select (Website, Walk-in, Referral, Social)
- **Status**: Multi-select (All pipeline stages)
- **Assigned To**: Counselor dropdown
- **Grade Level**: Multi-select

**Interaction**:
- Real-time chart updates on filter change
- "Clear All" button
- Active filter count badge
- Filter state persisted in URL params

#### C. Main Charts Section

**1. Lead Volume Over Time**
- **Type**: Area chart with gradient fill
- **X-Axis**: Date (daily granularity)
- **Y-Axis**: Lead count
- **Features**:
  - Hover tooltip showing exact count
  - Zoom/pan capability
  - Export chart as PNG
  - Toggle between daily/weekly/monthly view

**2. Pipeline Funnel**
- **Type**: Horizontal funnel chart
- **Stages**: New → Contacted → Visit → Application → Enrolled
- **Display**:
  - Stage name + count + percentage
  - Drop-off rate between stages
  - Color-coded by conversion health
  - Click to drill down

**3. Conversion by Source**
- **Type**: Stacked bar chart
- **Categories**: Lead sources
- **Metrics**: Total leads vs Enrolled
- **Features**: Click to filter entire dashboard

**4. Counselor Performance Grid**
- **Type**: Data table with sortable columns
- **Columns**:
  - Counselor Name (with avatar)
  - Leads Assigned
  - Interactions Logged
  - Enrollments
  - Conversion Rate
  - Avg Response Time
- **Features**:
  - Sort by any column
  - Click row to view detailed drilldown
  - Export to CSV
  - Visual indicators (badges, progress bars)

#### D. Alerts Rail (Right Sidebar)
**Width**: 280px
**Content**:
- **At-Risk Leads**: Leads stalled >3 days
- **Overdue Tasks**: Tasks past due date
- **Performance Alerts**: Counselors below target
- **System Notifications**: Data sync status

**Design**:
- Scrollable list
- Each alert is a compact card
- Priority color coding (red/yellow/blue)
- Click to navigate to detail

#### E. Slide-Over Drilldowns
**Trigger**: Click on chart segment or table row
**Behavior**: Slide from right (overlay)
**Width**: 600px
**Content**:
- Detailed breakdown of selected metric
- Sub-charts and tables
- Action buttons (Assign, Export, etc.)
- Close button (X) and backdrop click to dismiss

### 3.3 Technical Specifications

#### API Endpoints
```
GET /api/v1/analytics/kpis
  Query Params: date_from, date_to, source, status, assigned_to
  Response: { total_leads, new_enrollments, conversion_rate, active_pipeline }

GET /api/v1/analytics/lead-volume
  Query Params: date_from, date_to, granularity (day/week/month)
  Response: [{ date, count }]

GET /api/v1/analytics/funnel
  Query Params: date_from, date_to, source
  Response: [{ stage, count, percentage, drop_off_rate }]

GET /api/v1/analytics/conversion-by-source
  Response: [{ source, total_leads, enrolled, conversion_rate }]

GET /api/v1/analytics/counselor-performance
  Query Params: date_from, date_to
  Response: [{ counselor_id, name, leads, interactions, enrollments, conversion_rate, avg_response_time }]

GET /api/v1/analytics/alerts
  Response: [{ type, severity, title, description, link, created_at }]
```

#### Sample JSON Response (KPIs)
```json
{
  "total_leads": 342,
  "total_leads_trend": "+12.5%",
  "new_enrollments": 84,
  "new_enrollments_trend": "+8.2%",
  "conversion_rate": 24.5,
  "conversion_target": 25.0,
  "active_pipeline": 258,
  "at_risk_count": 23
}
```

#### Performance Requirements
- Initial page load: <2s
- Chart render time: <500ms
- Filter application: <300ms
- Lazy load charts on scroll
- Debounce filter changes (300ms)
- Cache API responses (5 min TTL)

#### Accessibility
- ARIA labels on all charts
- Keyboard navigation for filters
- Screen reader announcements for data updates
- High contrast mode support
- Focus indicators on interactive elements

---

## 4. REPORTS TAB (`/reports`)

### 4.1 Overview
A comprehensive report builder and management interface for generating, scheduling, and exporting custom reports.

### 4.2 UI Components

#### A. Reports Library (Left Panel)
**Width**: 320px
**Content**:
- **Search Bar**: Filter reports by name/category
- **Categories**:
  - My Reports
  - Shared Reports
  - System Reports
  - Scheduled Reports
- **Report List**:
  - Report name
  - Last run date
  - Created by
  - Favorite star icon
  - Quick actions (Run, Edit, Delete)

**Design**:
- Scrollable list
- Hover state on items
- Selected report highlighted
- Empty state illustration

#### B. Report Builder (Main Panel)

**Step 1: Select Fields**
- **Available Fields** (left column):
  - Lead Information
  - Student Details
  - Interaction History
  - Task Data
  - Status Changes
- **Selected Fields** (right column):
  - Drag-and-drop reordering
  - Remove button per field
  - Field alias/rename option
- **Search**: Filter available fields
- **Templates**: Pre-built field sets

**Step 2: Configure Layout**
- **Grouping**: Group by field dropdown
- **Sorting**: Sort by field + direction (ASC/DESC)
- **Filters**:
  - Add filter button
  - Field + Operator + Value
  - AND/OR logic builder
  - Filter preview count
- **Aggregations**:
  - Count, Sum, Average, Min, Max
  - Group by options

**Step 3: Schedule & Export**
- **Export Format**:
  - CSV (default)
  - PDF (formatted)
  - Google Sheets (direct export)
  - Excel (.xlsx)
- **Schedule Options**:
  - Run Once (immediate)
  - Daily (time picker)
  - Weekly (day + time)
  - Monthly (date + time)
- **Recipients**:
  - Email addresses (multi-input)
  - User role selection
  - CC/BCC options
- **Report Name**: Text input (required)
- **Description**: Textarea (optional)

#### C. Report Preview
**Position**: Modal overlay or right panel
**Content**:
- First 100 rows of data
- Column headers
- Pagination controls
- Row count display
- "Export Full Report" button

#### D. Scheduled Reports Manager
**Layout**: Data table
**Columns**:
- Report Name
- Schedule (Daily/Weekly/Monthly)
- Next Run
- Recipients
- Status (Active/Paused)
- Actions (Edit, Pause, Delete)

**Features**:
- Toggle active/inactive
- View run history
- Download last export
- Duplicate schedule

### 4.3 Technical Specifications

#### API Endpoints
```
GET /api/v1/reports/templates
  Response: [{ id, name, description, fields, filters }]

POST /api/v1/reports/build
  Body: { name, fields, filters, grouping, sorting }
  Response: { report_id, preview_data, row_count }

POST /api/v1/reports/export
  Body: { report_id, format (csv/pdf/xlsx/sheets) }
  Response: { download_url, expires_at }

POST /api/v1/reports/schedule
  Body: { report_id, frequency, time, recipients, format }
  Response: { schedule_id, next_run }

GET /api/v1/reports/scheduled
  Response: [{ id, name, frequency, next_run, recipients, status }]

PATCH /api/v1/reports/scheduled/{id}
  Body: { status: 'active' | 'paused' }

DELETE /api/v1/reports/scheduled/{id}

GET /api/v1/reports/history
  Query Params: report_id, limit, offset
  Response: [{ run_id, run_at, status, row_count, download_url }]
```

#### Sample JSON (Report Build)
```json
{
  "name": "Weekly Enrollment Report",
  "fields": ["parent_name", "student_name", "grade", "status", "enrolled_date", "assigned_to"],
  "filters": [
    { "field": "status", "operator": "equals", "value": "enrolled" },
    { "field": "enrolled_date", "operator": "between", "value": ["2026-02-01", "2026-02-07"] }
  ],
  "grouping": "assigned_to",
  "sorting": [{ "field": "enrolled_date", "direction": "desc" }],
  "aggregations": [{ "field": "id", "function": "count", "alias": "total_enrollments" }]
}
```

#### Performance Requirements
- Report preview generation: <3s
- Export generation (1000 rows): <5s
- Export generation (10000 rows): <30s (async with email notification)
- Scheduled report execution: Background job queue
- Export file retention: 7 days

---

## 5. ADMIN TAB (`/admin`)

### 5.1 Overview
Complete system administration interface for user management, permissions, integrations, system health monitoring, and audit logging.

### 5.2 UI Components

#### A. Admin Navigation (Left Sidebar)
**Sections**:
1. **Users & Access**
   - Users
   - Roles & Permissions
   - Teams
2. **System**
   - Integrations
   - System Health
   - Audit Logs
3. **Configuration**
   - General Settings
   - Dropdown Options
   - SLA Thresholds
   - Email Templates

#### B. Users Management

**User List Table**:
- **Columns**:
  - Avatar + Name
  - Email
  - Role
  - Status (Active/Inactive/Pending)
  - Last Login
  - Actions
- **Features**:
  - Search by name/email
  - Filter by role/status
  - Bulk actions (Activate, Deactivate, Delete)
  - Impersonate user (admin only)
  - Export user list

**Add/Edit User Modal**:
- Full Name (required)
- Email (required)
- Phone Number
- Role dropdown (Admin/Manager/Counselor)
- Status toggle (Active/Inactive)
- Send invitation email checkbox
- Assign to team dropdown

**Bulk Actions**:
- Select multiple users (checkbox)
- Bulk role change
- Bulk deactivate
- Bulk delete (with confirmation)
- Export selected users

**Impersonation**:
- "View as User" button
- Banner at top indicating impersonation mode
- "Exit Impersonation" button
- Audit log entry created

#### C. Roles & Permissions

**Role List**:
- Admin (System default)
- Manager (System default)
- Counselor (System default)
- Custom roles (user-created)

**Permission Matrix**:
- **Rows**: Features (Leads, Pipeline, Analytics, Reports, Admin)
- **Columns**: Permissions (View, Create, Edit, Delete, Export)
- **Cells**: Checkboxes
- **Scope Options**:
  - All (organization-wide)
  - Team (assigned team only)
  - Own (created by user)

**Create Custom Role**:
- Role name
- Description
- Permission checkboxes
- Assign users to role

#### D. Integrations

**Available Integrations**:
1. **Email (SMTP)**
   - Server, Port, Username, Password
   - Test connection button
   - Status indicator
   
2. **Google Workspace**
   - OAuth connection
   - Calendar sync
   - Contacts sync
   - Drive export
   
3. **Webhooks**
   - Event selection (Lead Created, Status Changed, etc.)
   - Endpoint URL
   - Secret key
   - Test webhook button
   
4. **API Keys**
   - Generate new API key
   - Key list with creation date
   - Revoke key button
   - Usage statistics

**Integration Card Design**:
- Logo/icon
- Name + description
- Status badge (Connected/Not Connected)
- Configure button
- Last sync time (if applicable)

#### E. System Health

**Dashboard View**:
1. **Server Status**
   - API uptime
   - Database connection
   - Storage usage
   - Memory usage
   
2. **Performance Metrics**
   - Avg response time
   - Error rate
   - Active users
   - Requests per minute
   
3. **Background Jobs**
   - Queue length
   - Failed jobs
   - Processing time
   
4. **Database Stats**
   - Total records
   - Growth rate
   - Query performance
   - Backup status

**Visualization**:
- Real-time charts (last 24 hours)
- Color-coded status indicators
- Alert thresholds
- Export metrics button

#### F. Audit Logs

**Log Table**:
- **Columns**:
  - Timestamp
  - User (with avatar)
  - Action (Created, Updated, Deleted, Viewed)
  - Resource (Lead, User, Setting, etc.)
  - Details (expandable)
  - IP Address
- **Filters**:
  - Date range
  - User
  - Action type
  - Resource type
- **Features**:
  - Search by keyword
  - Export logs (CSV)
  - Real-time updates
  - Pagination (100 per page)

**Detail View** (expandable row):
- Before/After values (for updates)
- Full request payload
- Response status
- Duration
- Related logs

### 5.3 Technical Specifications

#### API Endpoints

**Users**
```
GET /api/v1/admin/users
  Query Params: search, role, status, limit, offset
  Response: { users: [], total, page, limit }

POST /api/v1/admin/users
  Body: { full_name, email, phone, role, status, send_invite }
  Response: { user_id, invite_sent }

PATCH /api/v1/admin/users/{id}
  Body: { full_name?, email?, role?, status? }

DELETE /api/v1/admin/users/{id}

POST /api/v1/admin/users/{id}/impersonate
  Response: { impersonation_token, expires_at }

POST /api/v1/admin/users/bulk-action
  Body: { user_ids: [], action: 'activate' | 'deactivate' | 'delete' }
```

**Roles & Permissions**
```
GET /api/v1/admin/roles
  Response: [{ id, name, description, permissions, is_system }]

POST /api/v1/admin/roles
  Body: { name, description, permissions: { resource: { view, create, edit, delete, scope } } }

PATCH /api/v1/admin/roles/{id}
  Body: { name?, description?, permissions? }

DELETE /api/v1/admin/roles/{id}
  Note: Cannot delete system roles (admin, manager, counselor)
```

**Integrations**
```
GET /api/v1/admin/integrations
  Response: [{ type, name, status, config, last_sync }]

POST /api/v1/admin/integrations/{type}/connect
  Body: { credentials, config }
  Response: { status, connection_id }

DELETE /api/v1/admin/integrations/{type}/disconnect

POST /api/v1/admin/integrations/webhooks
  Body: { events: [], endpoint_url, secret }

GET /api/v1/admin/integrations/api-keys
  Response: [{ key_id, key_prefix, created_at, last_used, usage_count }]

POST /api/v1/admin/integrations/api-keys
  Response: { key_id, api_key (full key shown once) }

DELETE /api/v1/admin/integrations/api-keys/{id}
```

**System Health**
```
GET /api/v1/admin/health
  Response: {
    server: { uptime, status },
    database: { connection, query_time, storage_used },
    jobs: { queue_length, failed_count },
    performance: { avg_response_time, error_rate, active_users }
  }

GET /api/v1/admin/health/metrics
  Query Params: metric_type, time_range
  Response: [{ timestamp, value }]
```

**Audit Logs**
```
GET /api/v1/admin/audit-logs
  Query Params: date_from, date_to, user_id, action, resource, search, limit, offset
  Response: {
    logs: [{ id, timestamp, user, action, resource, details, ip_address }],
    total, page, limit
  }

GET /api/v1/admin/audit-logs/{id}
  Response: { full log details including before/after, request, response }
```

#### Sample JSON (User Object)
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "email": "john@school.edu",
  "phone": "+1234567890",
  "role": "counselor",
  "status": "active",
  "avatar_url": "https://...",
  "last_login": "2026-02-11T10:30:00Z",
  "created_at": "2026-01-15T08:00:00Z",
  "teams": ["admissions", "support"]
}
```

#### Security Requirements
- All admin actions require `admin` role
- Impersonation creates audit log entry
- Sensitive data (passwords, API keys) never returned in responses
- API key generation uses cryptographically secure random
- Webhook secrets hashed before storage
- Rate limiting on admin endpoints (100 req/min per user)

---

## 6. Cross-Tab Features

### 6.1 Responsive Design
- **Desktop**: Full layout as described
- **Tablet** (768px - 1024px):
  - Collapsible sidebars
  - Stacked charts (2 columns)
  - Simplified tables
- **Mobile** (<768px):
  - Bottom navigation
  - Single column layout
  - Swipeable charts
  - Accordion sections

### 6.2 Performance Optimization
- **Code Splitting**: Lazy load each tab
- **Chart Libraries**: Use lightweight libraries (Recharts)
- **Virtual Scrolling**: For long tables (>100 rows)
- **Image Optimization**: Compress avatars, icons
- **API Caching**: Redis cache for frequently accessed data
- **Database Indexing**: Optimize queries for analytics

### 6.3 Accessibility (WCAG 2.1 AA)
- **Keyboard Navigation**: All interactive elements
- **Screen Readers**: ARIA labels, live regions
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Indicators**: Visible focus states
- **Error Messages**: Clear, actionable
- **Alternative Text**: All images, charts

---

## 7. Acceptance Criteria

### Analytics Tab
- [ ] KPI cards display correct data with trend indicators
- [ ] All filters work and update charts in real-time
- [ ] Charts render in <500ms
- [ ] Drilldown slide-overs open smoothly
- [ ] Alerts rail shows current at-risk items
- [ ] Export chart as PNG works
- [ ] Responsive on mobile (single column)
- [ ] Screen reader announces data updates

### Reports Tab
- [ ] Report builder 3-step wizard completes successfully
- [ ] Field selection supports drag-and-drop reordering
- [ ] Filters apply correctly to preview
- [ ] Export generates file in selected format (CSV/PDF/XLSX)
- [ ] Scheduled reports create background jobs
- [ ] Email delivery works for scheduled reports
- [ ] Report history shows past runs
- [ ] Bulk actions work on scheduled reports

### Admin Tab
- [ ] User list loads with pagination
- [ ] Add/Edit user modal validates inputs
- [ ] Bulk user actions execute correctly
- [ ] Impersonation mode works and logs audit entry
- [ ] Role permission matrix saves changes
- [ ] Integration connections establish successfully
- [ ] System health metrics update in real-time
- [ ] Audit logs filter and search work
- [ ] All admin actions require `admin` role
- [ ] API keys generate and revoke correctly

---

## 8. Developer Handoff

### Design Assets
- Figma mockups (desktop + tablet + mobile)
- Component library (buttons, inputs, cards, etc.)
- Design tokens (colors, typography, spacing)
- Interaction prototypes (filters, drilldowns, modals)
- Icon set (SVG)

### Technical Specs
- API endpoint documentation (above)
- Database schema updates
- Sample JSON responses
- Error handling guidelines
- Performance benchmarks

### Testing Requirements
- Unit tests for all API endpoints
- Integration tests for report generation
- E2E tests for critical user flows
- Performance tests (load testing)
- Accessibility audit (WCAG 2.1 AA)

---

## 9. Timeline Estimate
- **Analytics Tab**: 3-4 weeks
- **Reports Tab**: 2-3 weeks
- **Admin Tab**: 2-3 weeks
- **Testing & Polish**: 1-2 weeks
- **Total**: 8-12 weeks

## 10. Success Metrics
- Page load time <2s
- Chart render time <500ms
- Report generation <5s (1000 rows)
- Zero accessibility violations
- 95%+ user satisfaction score
- <1% error rate on admin actions
