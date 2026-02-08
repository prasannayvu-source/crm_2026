from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from database import get_db

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Client = Depends(get_db)):
    token = credentials.credentials
    try:
        user = db.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(allowed_roles: list[str]):
    async def role_dependency(user=Depends(get_current_user), db: Client = Depends(get_db)):
        # Assuming user metadata or profile table stores the role
        # We query the profiles table using the user.id
        
        # Method 1: Check user_metadata (faster but requires sync)
        user_role = user.app_metadata.get('role') or user.user_metadata.get('role')
        
        # Method 2: Query profiles table (safer source of truth)
        profile_response = db.table('profiles').select('role').eq('id', user.id).single().execute()
        
        if not profile_response.data:
             raise HTTPException(status_code=403, detail="Profile not found")
             
        current_role = profile_response.data.get('role')
        
        if current_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
            
        return user
    return role_dependency
