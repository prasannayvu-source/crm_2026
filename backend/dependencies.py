from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from database import get_db
import time
from functools import lru_cache

security = HTTPBearer()

# Simple in-memory cache for user sessions (Disabled for development to ensure instant role updates)
_user_cache = {}
_cache_ttl = 0  # Disabled (was 300)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Client = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    token = credentials.credentials
    
    # Check cache first
    cache_key = token[:50]  # Use first 50 chars as key
    current_time = time.time()
    
    if cache_key in _user_cache:
        cached_user, cache_time = _user_cache[cache_key]
        if current_time - cache_time < _cache_ttl:
            print(f"✅ Using cached user session (age: {int(current_time - cache_time)}s)")
            return cached_user
    
    # Cache miss or expired - fetch from Supabase
    print(f"⏱️  Fetching user from Supabase...")
    fetch_start = time.time()
    
    try:
        user = db.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Fetch user profile to get role
        profile_response = db.table('profiles').select('*').eq('id', user.user.id).single().execute()
        
        profile_data = None
        
        if not profile_response.data:
            print(f"⚠️ Profile not found for {user.user.email}. Access Denied (Invite-Only).")
            # Strict Mode: Only allow users who exist in 'profiles' table (Created by Admin)
            raise HTTPException(status_code=403, detail="Access Denied: Your account is not authorized. Please contact the administrator.")
        
        profile_data = profile_response.data

        role_name = profile_data.get('role', 'counselor')
        permissions = {}
        
        print(f"🕵️‍♂️ Auth Analysis: User={user.user.email}, Role={role_name}")
        
        # Fetch permissions from custom_roles table (Case-Insensitive Match)
        try:
            # Use ilike for case-insensitive matching
            role_res = db.table('custom_roles').select('permissions').ilike('name', role_name).execute()
            
            if role_res.data:
                p_data = role_res.data[0]['permissions']
                # print(f"   -> Role '{role_name}' found. Raw Perms: {str(p_data)[:50]}...")
                
                if isinstance(p_data, dict):
                    permissions = p_data
                elif isinstance(p_data, str):
                    try:
                        import json
                        permissions = json.loads(p_data)
                    except:
                        print("   -> ❌ Failed to parse JSON permissions")
                        permissions = {}
            else:
                print(f"   -> ⚠️ Role '{role_name}' NOT found in custom_roles table. Defaulting to empty permissions.")
                permissions = {}
                
        except Exception as e:
            print(f"Error fetching permissions for {role_name}: {e}")
            permissions = {}
            

                
        print(f"   -> Final Calculated Permissions: {list(permissions.keys())}")
        
        # Build user dict
        user_dict = {
            "id": user.user.id,
            "email": user.user.email,
            "role": role_name,
            "permissions": permissions,
            "full_name": profile_data.get('full_name', ''),
            "status": profile_data.get('status', 'active')
        }
        
        # Cache it
        _user_cache[cache_key] = (user_dict, current_time)
        
        fetch_time = time.time() - fetch_start
        print(f"✅ Fetched and cached user in {fetch_time:.2f}s")
        
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Auth Exception: {e}"
        print(error_msg)
        try:
            with open("auth_debug.log", "a") as f:
                f.write(f"{time.ctime()}: {error_msg}\n")
        except:
            pass
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(allowed_roles: list[str]):
    async def role_dependency(user=Depends(get_current_user)):
        current_role = user.get('role')
        if current_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_dependency

def require_permission(required_perm: str):
    async def permission_dependency(user=Depends(get_current_user)):
        perms = user.get('permissions', {})
        # Admin wildcard check
        if perms.get('*'):
            return user
        # Specific permission check
        if not perms.get(required_perm):
             raise HTTPException(status_code=403, detail=f"Missing permission: {required_perm}")
        return user
    return permission_dependency
