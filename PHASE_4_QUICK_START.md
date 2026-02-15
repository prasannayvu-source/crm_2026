# Phase 4 Quick Start Guide
## Analytics, Reports & Admin Features

This guide will help you quickly get started with the new Phase 4 features.

---

## 🚀 Getting Started

### 1. Start the Application

**Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Access the Application
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

---

## 📊 Analytics Dashboard

### Accessing Analytics
1. Log in to the CRM
2. Click **"Analytics"** in the sidebar
3. View real-time KPIs and charts

### Using Filters
1. **Date Range**: Select "From Date" and "To Date"
2. **Source**: Filter by lead source (Website, Walk-in, etc.)
3. **Status**: Filter by lead status
4. Click **"Clear Filters"** to reset

### Understanding KPIs
- **Total Leads**: All leads in the system
- **Enrollments**: Successfully enrolled students
- **Conversion Rate**: Percentage of leads converted
- **Active Pipeline**: Leads currently in progress

### Charts Available
1. **Lead Volume Over Time**: Track lead generation trends
2. **Pipeline Funnel**: See conversion at each stage
3. **Conversion by Source**: Compare source effectiveness
4. **Counselor Performance**: Team performance metrics

### Alerts & Notifications
- **Stale Leads**: Leads with no interaction in 7+ days
- **Overdue Tasks**: Tasks past their due date
- Click **"View Details"** to navigate to the lead

---

## 📈 Reports Center

### Creating a Report

#### Using Templates
1. Navigate to **"/reports"**
2. Select a template from the sidebar:
   - Leads Overview
   - Enrollment Report
   - Pipeline Status
   - Counselor Activity
   - Lead Source Analysis
3. Click **"Export as CSV"**, **"Excel"**, or **"PDF"**

#### Custom Reports (Advanced)
1. Click **"Build Custom Report"**
2. Select fields to include
3. Add filters
4. Preview the data
5. Export in your preferred format

### Exporting Reports
- **CSV**: For Excel/Google Sheets
- **Excel (XLSX)**: With formatting
- **PDF**: For presentations
- **Google Sheets**: Direct integration (requires setup)

### Scheduling Reports (Coming Soon)
- Set frequency (Daily, Weekly, Monthly)
- Add email recipients
- Choose export format
- Reports sent automatically

---

## ⚙️ Admin Console

### User Management

#### Adding a New User
1. Go to **"/admin"**
2. Click **"Users"** in the sidebar
3. Click **"Add User"**
4. Fill in:
   - Full Name
   - Email
   - Phone (optional)
   - Role (Admin, Manager, Counselor)
   - Status (Active/Inactive)
5. Click **"Create"**

#### Editing a User
1. Find the user in the table
2. Click **"Edit"**
3. Update details
4. Click **"Save"**

#### Bulk Actions
1. Select multiple users (checkboxes)
2. Choose action:
   - Activate
   - Deactivate
   - Delete
3. Confirm action

### Roles & Permissions

#### System Roles
- **Admin**: Full system access
- **Manager**: Team management and reporting
- **Counselor**: Lead management

#### Creating Custom Roles
1. Click **"Roles & Permissions"**
2. Click **"Create Role"**
3. Define permissions:
   - Leads: View, Create, Edit, Delete
   - Tasks: View, Create, Edit, Delete
   - Reports: View, Create, Export
   - Analytics: View
4. Save role

### Integrations

#### Connecting SMTP Email
1. Click **"Integrations"**
2. Find **"SMTP Email"**
3. Click **"Configure"**
4. Enter:
   - SMTP Server
   - Port
   - Username
   - Password
5. Test connection
6. Save

#### Google Workspace
1. Click **"Connect"** on Google Workspace card
2. Authorize with Google
3. Select calendars/contacts to sync
4. Save settings

#### Managing Webhooks
1. Click **"Webhooks"** → **"Manage"**
2. Click **"Add Webhook"**
3. Enter:
   - Events to subscribe (lead.created, lead.updated, etc.)
   - Endpoint URL
   - Secret key
4. Save webhook

#### API Keys
1. Click **"API Keys"** → **"Manage"**
2. Click **"Generate Key"**
3. Enter key name
4. Set expiration (optional)
5. **Copy the key** (shown only once!)
6. Use in API requests:
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

### System Health

#### Monitoring
1. Click **"System Health"**
2. View metrics:
   - Server Status
   - Database Status
   - CPU Usage
   - Memory Usage
   - Disk Usage

#### Troubleshooting
- **Server Status: Error** → Restart backend
- **Database Status: Error** → Check Supabase connection
- **High CPU/Memory** → Check for long-running queries

### Audit Logs

#### Viewing Logs
1. Click **"Audit Logs"**
2. Browse recent activity
3. Filter by:
   - Date range
   - User
   - Action (created, updated, deleted)
   - Resource (user, lead, task)

#### Understanding Logs
- **Timestamp**: When action occurred
- **Action**: What was done
- **Resource**: What was affected
- **User ID**: Who did it
- **Details**: Before/after data

---

## 🧪 Testing with Sample Data

### Populate Test Data
1. Open Supabase SQL Editor
2. Run `backend/migrations/phase_4_test_data.sql`
3. This creates:
   - Sample leads
   - Interactions
   - Overdue tasks
   - Stale leads

### Verify Data
```sql
-- Check lead count
SELECT COUNT(*) FROM leads;

-- Check for stale leads
SELECT * FROM leads 
WHERE last_interaction_at < NOW() - INTERVAL '7 days'
AND status NOT IN ('enrolled', 'lost');

-- Check overdue tasks
SELECT * FROM tasks 
WHERE due_date < NOW() 
AND status = 'pending';
```

---

## 🔐 Security Best Practices

### For Admins
1. **Strong Passwords**: Enforce password policies
2. **Regular Audits**: Review audit logs weekly
3. **API Key Rotation**: Rotate keys every 90 days
4. **User Access Review**: Quarterly access reviews
5. **Backup Data**: Daily database backups

### For All Users
1. **Logout**: Always logout when done
2. **Secure Devices**: Don't leave sessions open
3. **Report Issues**: Report suspicious activity
4. **Data Privacy**: Don't share sensitive data

---

## 🐛 Troubleshooting

### Analytics Not Loading
1. Check backend is running
2. Verify token in localStorage
3. Check browser console for errors
4. Ensure you have data in the database

### Reports Export Failing
1. Check backend logs
2. Verify report ID is valid
3. Ensure you have permission
4. Try a different format

### Admin Access Denied
1. Verify your role is "admin"
2. Check JWT token is valid
3. Re-login if necessary
4. Contact system administrator

### Charts Not Displaying
1. Ensure recharts is installed: `npm install recharts`
2. Clear browser cache
3. Check for JavaScript errors
4. Verify data format from API

---

## 📞 Support

### Getting Help
- **Documentation**: Check README files
- **API Docs**: http://localhost:8000/docs
- **Logs**: Check browser console and backend logs
- **Database**: Use Supabase dashboard

### Common Commands

**Check Backend Status:**
```bash
curl http://localhost:8000/api/v1/health
```

**Test Authentication:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/v1/auth/me
```

**View Backend Logs:**
```bash
# In backend directory
tail -f logs/app.log
```

---

## 🎯 Quick Tips

### Analytics
- Use date filters to compare periods
- Export charts as images (browser screenshot)
- Monitor alerts daily
- Track counselor performance weekly

### Reports
- Save frequently used reports as templates
- Schedule reports for automatic delivery
- Export to Excel for advanced analysis
- Share reports with stakeholders

### Admin
- Review audit logs regularly
- Keep user list up to date
- Monitor system health
- Backup before major changes

---

## 📚 Additional Resources

- **Full Documentation**: See `PHASE_4_COMPLETION_REPORT.md`
- **API Reference**: http://localhost:8000/docs
- **UI/UX Guidelines**: `crm-phased-blueprint/UI_UX_Guidelines.md`
- **Database Schema**: `backend/migrations/phase_4_tables.sql`

---

**Last Updated**: February 11, 2026  
**Version**: 1.0.0  
**Phase**: 4 - Analytics, Reports & Admin
