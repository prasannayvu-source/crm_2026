import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
service_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
anon_key: str = os.environ.get("SUPABASE_KEY", "")

# intelligent key selection to avoid startup crashes if service key is missing/placeholder
key = service_key if service_key and "your-" not in service_key else anon_key

if not url or not key or "your-" in key:
    print("Warning: Missing valid SUPABASE_URL or API keys. Backend may not function correctly.")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    # Initialize with empty/dummy to allow import, will fail at runtime usage
    supabase = None

def get_db():
    return supabase
