
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

print("🔑 Admin Role Assigner")
print("----------------------")
print("Since the 'profiles' table uses IDs linked to Auth, please provide your User ID.")
print("You can find this in your Supabase Dashboard > Authentication > Users, or in the Local Storage of your browser (sb-access-token).")
print("")

user_id = input("Enter your User ID (UUID): ").strip()

if not user_id:
    print("❌ User ID is required.")
    exit(1)

print(f"🔍 Checking profile for ID: {user_id}...")

# Check if profile exists
try:
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()

    if not response.data:
        print(f"❌ User profile not found for ID {user_id}.")
        print("   Ensure the user has logged in at least once.")
    else:
        user = response.data[0]
        # In case 'full_name' or 'email' are not in profiles, handle gracefully
        name = user.get('full_name', 'Unknown Name')
        role = user.get('role', 'Unknown Role')
        
        print(f"✅ Profile found: {name} (Current Role: {role})")
        
        # Update role
        print(f"⚡ Updating role to 'admin'...")
        update_response = supabase.table("profiles").update({"role": "admin"}).eq("id", user_id).execute()
        
        if update_response.data:
            print(f"✅ SUCCESS! User is now an ADMIN.")
            print("   Please refresh the Admin Console page.")
        else:
            print(f"❌ Failed to update user role.")

except Exception as e:
    print(f"❌ Error talking to Supabase: {e}")
