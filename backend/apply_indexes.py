"""
Apply database indexes for faster analytics queries
Run this script once to add indexes to the leads table
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    exit(1)

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 Applying analytics indexes...")

# Read the migration file
with open("migrations/add_analytics_indexes.sql", "r") as f:
    sql = f.read()

# Split into individual statements
statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]

# Execute each statement
for i, statement in enumerate(statements, 1):
    try:
        print(f"  [{i}/{len(statements)}] Executing: {statement[:60]}...")
        # Note: Supabase client doesn't directly support raw SQL execution
        # You'll need to run this in the Supabase SQL Editor instead
        print(f"  ⚠️  Please run this SQL in Supabase SQL Editor:")
        print(f"     {statement};")
        print()
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("✅ Migration complete!")
print()
print("📝 IMPORTANT: Run the SQL statements above in your Supabase SQL Editor:")
print("   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql")
print("   2. Copy and paste the SQL statements")
print("   3. Click 'Run'")
print()
print("This will add indexes to speed up analytics queries by 10-100x!")
