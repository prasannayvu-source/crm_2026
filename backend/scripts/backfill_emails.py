import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

try:
    supabase: Client = create_client(url, key)

    # Get all users using admin API
    # Note: Default page size is 50, need pagination for large sets
    # Assuming small set for now, or just handle first page
    response = supabase.auth.admin.list_users() # lists 50 by default
    users = response
    
    # If more than 50, fetch next page
    # user.next_page logic depends on library version
    # Simple loop for basic needs:
    while True:
        # process current batch
        for user in users:
            print(f"Processing user: {user.email} ({user.id})")
            try:
                # Check if profile exists
                profile = supabase.table("profiles").select("*").eq("id", user.id).execute()
                
                if profile.data:
                    # Update existing profile
                    update_data = {"email": user.email}
                    res = supabase.table("profiles").update(update_data).eq("id", user.id).execute()
                    if res.data:
                         print(f"Updated email for {user.email}")
                    else:
                         print(f"Create new profile logic skipped (only updating existing)")
                else:
                    print(f"No profile found for {user.email}, skipping.")
            except Exception as e:
                print(f"Error updating {user.email}: {e}")

        # Check for more pages?
        # Supabase-py list_users doesn't return 'next_page' token directly usually, 
        # it returns UserResponse with users list.
        # Pagination usually handled by `page` and `per_page` args.
        # But for now, let's assume default is sufficient for small user base.
        # If needed, add loop with page params.
        break

    print("Backfill complete.")

except Exception as e:
    print(f"Critical Error: {e}")
    sys.exit(1)
