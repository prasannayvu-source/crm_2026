from database import supabase
import json

try:
    res = supabase.table("leads").select("*").execute()
    print(f"Total leads: {len(res.data)}")
    for lead in res.data:
        print(f"ID: {lead['id']}, Parent: {lead['parent_name']}, Assigned To: {lead.get('assigned_to')}, Status: {lead.get('status')}")

    # Also check users/profiles to see who is who
    # Note: 'auth.users' is not directly accessible usually via client unless service role... 
    # But 'profiles' table should be there
    print("\n--- Profiles ---")
    prof_res = supabase.table("profiles").select("*").execute()
    for p in prof_res.data:
        print(f"ID: {p['id']}, Name: {p.get('full_name')}, Role: {p.get('role')}, Email: {p.get('email')}")

except Exception as e:
    print(f"Error: {e}")
