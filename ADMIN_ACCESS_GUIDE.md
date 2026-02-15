# Quick Fix Guide - Admin Access & Performance

## Issue 1: Slow Loading on Analytics Page

### Root Cause
The backend `get_current_user` function was returning a Supabase user object, but the analytics router expected a dictionary. This caused errors when trying to access user properties like `user.get("role")`.

### Fix Applied
Updated `backend/dependencies.py` to:
1. Fetch the user profile from the `profiles` table
2. Return a dictionary with user data including role
3. Simplified the `require_role` function

### Result
- Analytics page should now load much faster
- All API endpoints will work correctly
- Backend auto-reloaded with the fix

---

## Issue 2: Admin Tab Not Visible

### Why You Don't See the Admin Tab
The Admin tab only appears in the sidebar if your user has `role = 'admin'` in the profiles table.

### Current User
Based on the screenshot, you're logged in as:
- **Email**: prasannayvu@gmail.com
- **Current Role**: Likely "counselor" or "manager" (not admin)

### How to Get Admin Access

#### **Option 1: Using Supabase Dashboard (RECOMMENDED)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Table Editor**
   - Click "Table Editor" in the left sidebar
   - Select the `profiles` table

3. **Find Your User**
   - Look for the row with email: `prasannayvu@gmail.com`

4. **Update Role**
   - Click on the `role` cell for your user
   - Change it to: `admin`
   - Press Enter to save

5. **Refresh Your Browser**
   - Go back to http://localhost:3000
   - The Admin tab should now appear

#### **Option 2: Using SQL Editor**

1. **Open Supabase SQL Editor**
   - In Supabase Dashboard, click "SQL Editor"

2. **Run This Query**
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'prasannayvu@gmail.com';
   
   -- Verify the update
   SELECT id, email, full_name, role, status 
   FROM profiles 
   WHERE email = 'prasannayvu@gmail.com';
   ```

3. **Click "Run"**

4. **Refresh Your Browser**

#### **Option 3: Using the SQL Script**

I've created a SQL script for you at:
`backend/migrations/set_admin_role.sql`

1. Open Supabase SQL Editor
2. Copy the contents of `set_admin_role.sql`
3. Paste and run in Supabase
4. Refresh your browser

---

## Verification Steps

### 1. Check Backend is Running
The backend should have auto-reloaded. Look for this in the terminal:
```
INFO:     Application startup complete.
```

### 2. Test Analytics Page
1. Go to http://localhost:3000/analytics
2. Should load within 2-3 seconds
3. Should show KPI cards and charts

### 3. Check for Admin Tab
After updating your role to admin:
1. Refresh the browser
2. Look in the sidebar
3. You should see: Dashboard, Leads, Pipeline, Manager (if manager/admin), Analytics, Reports, **Admin**

---

## Available Roles

### Counselor (Default)
- Dashboard
- Leads (only assigned to them)
- Pipeline
- Analytics (their data only)
- Reports

### Manager
- All Counselor features
- Manager Dashboard
- Team data in Analytics
- Team reports

### Admin
- All Manager features
- **Admin Console**
- User management
- System settings
- Full data access

---

## Troubleshooting

### Analytics Still Loading Slowly?

1. **Check Backend Logs**
   - Look at the terminal running `uvicorn main:app --reload`
   - Check for any error messages

2. **Check Browser Console**
   - Press F12 in browser
   - Go to Console tab
   - Look for any red errors

3. **Verify Backend is Responding**
   Open a new terminal and run:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```
   Should return: `{"status":"ok",...}`

### Admin Tab Still Not Showing?

1. **Verify Role Update**
   Run this in Supabase SQL Editor:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'prasannayvu@gmail.com';
   ```
   Should show: `role: admin`

2. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Refresh page

3. **Log Out and Log In Again**
   - Click "Sign Out" in the sidebar
   - Log in again with prasannayvu@gmail.com
   - Admin tab should appear

---

## Quick Commands

### Restart Backend
```bash
# Stop: Ctrl+C
# Start:
cd backend
uvicorn main:app --reload
```

### Restart Frontend
```bash
# Stop: Ctrl+C
# Start:
cd frontend
npm run dev
```

### Check All Users and Roles
```sql
SELECT id, email, full_name, role, status 
FROM profiles 
ORDER BY created_at;
```

---

## Summary

✅ **Backend Fixed**: Updated dependencies.py for proper user data handling  
⚠️ **Admin Access**: Update your role to 'admin' in Supabase  
📧 **Your Email**: prasannayvu@gmail.com  
🔧 **Action Required**: Run the SQL update in Supabase Dashboard  

**After updating your role to admin, you will see:**
- Admin tab in sidebar
- User management features
- System health monitoring
- Audit logs
- Integration settings

---

**Date**: February 11, 2026  
**Time**: 19:35 IST  
**Status**: Backend fixed, awaiting role update
