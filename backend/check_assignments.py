from database import supabase
import sys

try:
    print("Fetching profiles...")
    prof_res = supabase.table("profiles").select("*").execute()
    profiles = {p['id']: p for p in prof_res.data}
    
    print(f"\nTotal users: {len(prof_res.data)}")
    for p in prof_res.data:
        print(f"User: {p.get('full_name')} ({p.get('email')}) - Role: {p.get('role')} - ID: {p.get('id')}")

    print("\nFetching leads stats...")
    leads_res = supabase.table("leads").select("status, assigned_to").execute()
    print(f"Total Leads in DB: {len(leads_res.data)}")
    
    assigned_counts = {}
    for l in leads_res.data:
        u_id = l.get('assigned_to')
        u_name = profiles.get(u_id, {}).get('full_name', 'Unknown') if u_id else 'Unassigned'
        assigned_counts[u_name] = assigned_counts.get(u_name, 0) + 1
        
    print("\nLeads by Assignee:")
    for name, count in assigned_counts.items():
        print(f" - {name}: {count}")

except Exception as e:
    print(f"Error: {e}")
