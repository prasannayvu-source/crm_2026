from database import supabase
import json

try:
    print("Fetching custom_roles...")
    roles_res = supabase.table("custom_roles").select("*").execute()
    
    for r in roles_res.data:
        perms = r.get('permissions')
        if isinstance(perms, str):
            try:
                perms = json.loads(perms)
            except:
                pass
        print(f"Role: {r.get('name')} - Permissions: {perms}")

except Exception as e:
    print(f"Error: {e}")
