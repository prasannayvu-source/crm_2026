
import os
from dotenv import load_dotenv
from supabase import create_client

# Load env from current directory
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
anon = os.environ.get("SUPABASE_KEY")

print(f"URL: {url}")
print(f"Service Key Length: {len(key) if key else 0}")
print(f"Anon Key Length: {len(anon) if anon else 0}")

if not key:
    print("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! Using Anon key logic?")
    if anon:
        key = anon
        print("Falling back to ANON key (RLS will apply).")
    else:
        print("No keys found.")
        exit(1)

try:
    supabase = create_client(url, key)
    print("Client initialized.")
    
    # 1. Simple Query
    print("Attempting to fetch ALL leads...")
    response = supabase.table("leads").select("*").execute()
    print(f"Result Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"First Lead ID: {response.data[0]['id']}")
        print(f"Assigned To: {response.data[0]['assigned_to']}")
    else:
        print("Result is empty. Likely RLS blocking or empty table.")

except Exception as e:
    print(f"Error: {e}")
