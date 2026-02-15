# Analytics Data Not Showing - Troubleshooting Guide

## Problem
You have leads in the database (visible in the Leads page), but the Analytics dashboard shows all zeros.

## Root Cause
The analytics API endpoints require authentication, and there might be an issue with:
1. Session token not being sent correctly
2. User not being authenticated
3. Backend API errors
4. CORS issues

## Solution Steps

### Step 1: Check Browser Console (MOST IMPORTANT)

I've added detailed logging to help diagnose the issue. Follow these steps:

1. **Open Analytics Page**: http://localhost:3000/analytics
2. **Open Browser Console**: Press **F12** → Click **"Console"** tab
3. **Refresh the page**: Press **Ctrl + Shift + R**
4. **Look for these log messages**:

```
Fetching analytics with params: ...
KPIs response status: 200 (or error code)
KPIs data: {...}
Lead volume response status: 200
Lead volume data: [...]
Pipeline funnel response status: 200
Pipeline funnel data: [...]
Conversion response status: 200
Conversion data: [...]
Performance response status: 200
Performance data: [...]
Alerts response status: 200
Alerts data: [...]
```

### Step 2: Interpret the Console Output

#### ✅ **If you see status 200 and data:**
- **Good!** The API is working
- Data should appear on the dashboard
- If not, it might be a rendering issue

#### ❌ **If you see status 401 "Not authenticated":**
```
KPIs error: 401 {"detail":"Not authenticated"}
```
**Solution**: You're not logged in properly
1. Go to http://localhost:3000/login
2. Log in again
3. Go back to Analytics

#### ❌ **If you see status 403 "Forbidden":**
```
KPIs error: 403 {"detail":"Forbidden"}
```
**Solution**: Your user doesn't have permission
1. Check your user role in Supabase
2. Make sure you're an admin or counselor

#### ❌ **If you see status 500 "Internal Server Error":**
```
KPIs error: 500 Internal Server Error
```
**Solution**: Backend error
1. Check backend terminal logs
2. Look for Python errors
3. Might be a database query issue

#### ❌ **If you see "Failed to fetch" or CORS error:**
```
Error: Failed to fetch
Access-Control-Allow-Origin error
```
**Solution**: Backend not running or CORS issue
1. Check if backend is running: http://localhost:8000/docs
2. Restart backend if needed

### Step 3: Check Backend Logs

1. **Look at your backend terminal** (where uvicorn is running)
2. **Look for error messages** when you refresh Analytics
3. **Common errors**:

```python
# Database connection error
sqlalchemy.exc.OperationalError: ...

# Authentication error
fastapi.exceptions.HTTPException: 401

# Query error
psycopg2.errors.UndefinedColumn: ...
```

### Step 4: Verify Data in Database

Make sure you actually have data:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Open Table Editor**
3. **Check `leads` table**: Should have rows
4. **Run this query in SQL Editor**:

```sql
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'enrolled') as enrollments,
  COUNT(DISTINCT source) as sources
FROM leads;
```

Expected result:
```
total_leads | enrollments | sources
    9       |      1      |    1
```

If you see 0, you need to add data (see ADD_TEST_DATA_GUIDE.md)

### Step 5: Test API Directly

Test if the backend API is working:

1. **Go to**: http://localhost:8000/docs
2. **Find**: `GET /api/v1/analytics/kpis`
3. **Click "Try it out"**
4. **Click "Execute"**

**Expected Response** (200 OK):
```json
{
  "total_leads": 9,
  "total_enrollments": 1,
  "conversion_rate": 11.11,
  "active_pipeline": 8,
  "avg_time_to_convert": null,
  "trend_vs_last_period": {}
}
```

**If you get 401 Unauthorized**:
- You need to authenticate first
- Click the "Authorize" button at the top
- Enter your Bearer token

### Step 6: Get Your Bearer Token

If you need to test with authentication:

1. **Open Browser Console** on Analytics page
2. **Run this code**:

```javascript
(async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  console.log('Bearer Token:', session.access_token);
})();
```

3. **Copy the token**
4. **Use it in API testing** (Swagger UI or Postman)

## Quick Fixes

### Fix 1: Hard Refresh
```
Press: Ctrl + Shift + R
```
Clears cache and reloads everything

### Fix 2: Re-login
```
1. Go to: http://localhost:3000/login
2. Log out
3. Log in again
4. Go to Analytics
```

### Fix 3: Restart Backend
```powershell
# In backend terminal
Ctrl + C
uvicorn main:app --reload
```

### Fix 4: Restart Frontend
```powershell
# In frontend terminal
Ctrl + C
npm run dev
```

### Fix 5: Clear All Filters
```
Click "Clear All Filters" button on Analytics page
```
Sometimes filters exclude all data

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Not logged in** | 401 errors | Re-login |
| **No data** | All zeros, no errors | Add test data |
| **Backend down** | Failed to fetch | Restart backend |
| **Wrong endpoint** | 404 errors | Check API routes |
| **Database empty** | 200 OK but zeros | Add leads |
| **Filters too strict** | Data exists but shows 0 | Clear filters |
| **CORS error** | CORS in console | Check backend CORS config |

## Expected Console Output (Success)

When everything works, you should see:

```
Fetching analytics with params: 
KPIs response status: 200
KPIs data: {total_leads: 9, total_enrollments: 1, conversion_rate: 11.11, ...}
Lead volume response status: 200
Lead volume data: [{date: "2026-02-08", count: 9}]
Pipeline funnel response status: 200
Pipeline funnel data: [{stage: "new", count: 2}, {stage: "connected", count: 1}, ...]
Conversion response status: 200
Conversion data: [{source: "Walk_in", total: 9, enrolled: 1, rate: 11.11}]
Performance response status: 200
Performance data: [{counselor_name: "prasanna pannireddy", total_leads: 9, ...}]
Alerts response status: 200
Alerts data: []
```

## What I Changed

I added detailed logging to the Analytics page:
- ✅ Logs every API request
- ✅ Logs response status codes
- ✅ Logs response data
- ✅ Logs errors with details
- ✅ Shows alert if fetch fails

This will help you see exactly what's happening!

## Next Steps

1. **Refresh Analytics page** (Ctrl + Shift + R)
2. **Open Console** (F12)
3. **Look at the logs**
4. **Share the console output** if you need help

The console will tell you exactly what's wrong!

---

## Status
✅ **Enhanced logging added** - Console will show detailed debug info  
📊 **Ready to diagnose** - Refresh and check console  
🔍 **Look for**: Response status codes and error messages  

**Refresh the Analytics page now and check the browser console!** 🔍
