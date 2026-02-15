-- Set User as Admin
-- This script will update your user profile to have admin role

-- Option 1: Update by email (RECOMMENDED)
-- Replace 'your-email@example.com' with your actual email address
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'prasannayvu@gmail.com';

-- Option 2: Update the first user in the database
-- Uncomment the line below if you want to make the first user an admin
-- UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM profiles LIMIT 1);

-- Option 3: Update by user ID
-- Replace 'YOUR_USER_ID' with your actual user ID from Supabase Auth
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';

-- Verify the update
SELECT id, email, full_name, role, status FROM profiles WHERE email = 'prasannayvu@gmail.com';

-- If you need to see all users and their roles:
-- SELECT id, email, full_name, role, status FROM profiles ORDER BY created_at;
