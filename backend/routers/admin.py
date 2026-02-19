from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import json
import hashlib
import secrets
from database import get_db
from dependencies import get_current_user, require_role, require_permission
from models import (
    UserCreate, UserUpdate, User, UserListResponse, BulkUserAction,
    RoleCreate, RoleUpdate, Role, IntegrationCreate, Integration,
    WebhookCreate, Webhook, APIKeyCreate, APIKey, APIKeyCreateResponse,
    SystemHealth, AuditLog, AuditLogListResponse, AppSetting, ArchiveCriteria
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
# Force reload for psutil

# ============================================
# User Management Endpoints
# ============================================

@router.get("/users", response_model=UserListResponse)
async def get_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    user=Depends(require_permission("users.view"))
):
    """Get all users (admin only)"""
    supabase = get_db()
    
    query = supabase.table("profiles").select("*", count="exact").order("created_at", desc=True)
    
    if search:
        query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
    if role:
        query = query.eq("role", role)
    if status:
        query = query.eq("status", status)
    
    query = query.limit(limit).offset(offset)
    users = []
    try:
        result = query.execute()
        
        for profile in result.data if result.data else []:
            users.append(User(
                id=UUID(profile["id"]),
                full_name=profile.get("full_name") or "Unknown",
                email=profile.get("email") or "",
                phone=profile.get("phone_number"),
                role=profile.get("role") or "user",
                status=profile.get("status", "active"),
                last_login=datetime.fromisoformat(profile["last_login"]) if profile.get("last_login") else None,
                created_at=datetime.fromisoformat(profile["created_at"])
            ))
            
        return UserListResponse(
            users=users,
            total=result.count if result.count else 0,
            page=offset // limit + 1,
            limit=limit
        )
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
async def create_user(
    user_data: UserCreate,
    user=Depends(require_permission("users.create"))
):
    """Create a new user (admin only)"""
    supabase = get_db()
    
    # Create auth user
    try:
        user_id = None
        
        # 1. Create user in Supabase Auth
        try:
            if user_data.password:
                # Create user with password (confirmed immediately)
                attributes = {
                    "email": user_data.email,
                    "password": user_data.password,
                    "email_confirm": True,
                    "user_metadata": {"full_name": user_data.full_name}
                }
                auth_response = supabase.auth.admin.create_user(attributes)
                if hasattr(auth_response, 'user') and auth_response.user:
                     user_id = auth_response.user.id
                else:
                     raise ValueError("Auth response missing user object")
            else:
                # Invite user by email
                params = {
                     "email": user_data.email, 
                     "options": {"data": {"full_name": user_data.full_name}}
                }
                auth_response = supabase.auth.admin.invite_user_by_email(**params)
                if hasattr(auth_response, 'user') and auth_response.user:
                     user_id = auth_response.user.id
                else:
                     raise ValueError("Invite response missing user object")
        except Exception as auth_err:
            # Handle "User already registered" case
            err_str = str(auth_err).lower()
            if "already registered" in err_str or "already been registered" in err_str:
                print(f"⚠️ User {user_data.email} already exists in Auth. Linking to profile...")
                # Search for existing user ID
                # Note: list_users returns a list of User objects directly in python client v2
                all_users = supabase.auth.admin.list_users(per_page=1000)
                # If list_users returns an object with .users, handle it (older versions/wrappers)
                users_list = all_users if isinstance(all_users, list) else getattr(all_users, 'users', [])
                
                existing_user = next((u for u in users_list if hasattr(u, 'email') and u.email == user_data.email), None)
                
                if existing_user:
                    user_id = existing_user.id
                    print(f"✅ Found existing User ID: {user_id}")
                else:
                    raise HTTPException(status_code=400, detail="User exists in Auth but could not be found via Admin API.")
            else:
                raise auth_err

        if not user_id:
             raise HTTPException(status_code=500, detail="Failed to create or find auth user")

        # 2. Create Profile Entry
        profile_data = {
            "id": str(user_id),
            "full_name": user_data.full_name,
            "email": user_data.email,
            "phone_number": user_data.phone,
            "role": user_data.role,
            "status": user_data.status,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Use upsert to handle potential race conditions or pre-existing profile triggers
        result = supabase.table("profiles").upsert(profile_data).execute()
        
        if not result.data:
            # If profile creation fails, we might want to rollback auth user?
            # For now, just error out. Setup allows manual fix.
            print(f"Warning: Profile creation returned no data for {user_id}")
            # raise HTTPException(status_code=500, detail="Failed to create profile")
        
        # Log audit
        audit_data = {
            "user_id": user.get("id"),
            "action": "created",
            "resource": "user",
            "resource_id": str(user_id),
            "details": json.dumps({"email": user_data.email, "role": user_data.role})
        }
        supabase.table("audit_logs").insert(audit_data).execute()
        
        return {
            "user_id": str(user_id),
            "invite_sent": not bool(user_data.password)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    user=Depends(require_permission("users.edit"))
):
    """Update user details (admin only)"""
    supabase = get_db()
    
    # Get current user data for audit
    current_result = supabase.table("profiles").select("*").eq("id", str(user_id)).execute()
    if not current_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    before_data = current_result.data[0]
    
    # Build update data
    update_data = {}
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    if user_update.email is not None:
        update_data["email"] = user_update.email
    if user_update.phone is not None:
        update_data["phone_number"] = user_update.phone
    if user_update.role is not None:
        update_data["role"] = user_update.role
    if user_update.status is not None:
        update_data["status"] = user_update.status
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("profiles").update(update_data).eq("id", str(user_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log audit
    audit_data = {
        "user_id": user.get("id"),
        "action": "updated",
        "resource": "user",
        "resource_id": str(user_id),
        "before_data": json.dumps(before_data),
        "after_data": json.dumps(result.data[0])
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    user=Depends(require_permission("users.delete"))
):
    """Delete a user (admin only)"""
    supabase = get_db()
    
    # Get user data for audit
    user_result = supabase.table("profiles").select("*").eq("id", str(user_id)).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_result.data[0]
    
    # Delete user profile
    result = supabase.table("profiles").delete().eq("id", str(user_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Also delete from Supabase Auth logic
    try:
        supabase.auth.admin.delete_user(str(user_id))
    except Exception as e:
        print(f"Failed to delete auth user: {e}")
    
    # Log audit
    audit_data = {
        "user_id": user.get("id"),
        "action": "deleted",
        "resource": "user",
        "resource_id": str(user_id),
        "before_data": json.dumps(user_data)
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/impersonate")
async def impersonate_user(
    user_id: UUID,
    user=Depends(require_role(["admin"]))
):
    """Impersonate a user (admin only)"""
    supabase = get_db()
    
    # Get target user
    target_result = supabase.table("profiles").select("*").eq("id", str(user_id)).execute()
    if not target_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log audit
    audit_data = {
        "user_id": user.get("id"),
        "action": "impersonated",
        "resource": "user",
        "resource_id": str(user_id),
        "details": json.dumps({"impersonated_user": target_result.data[0]["email"]})
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    # In production, generate a special impersonation token
    impersonation_token = f"imp_{secrets.token_urlsafe(32)}"
    
    return {
        "impersonation_token": impersonation_token,
        "expires_at": datetime.now() + timedelta(hours=1)
    }

@router.post("/users/bulk-action")
async def bulk_user_action(
    bulk_action: BulkUserAction,
    user=Depends(require_permission("users.delete"))
):
    """Perform bulk action on users (admin only)"""
    supabase = get_db()
    
    if bulk_action.action == "activate":
        update_data = {"status": "active"}
    elif bulk_action.action == "deactivate":
        update_data = {"status": "inactive"}
    elif bulk_action.action == "delete":
        # Delete users
        for user_id in bulk_action.user_ids:
            supabase.table("profiles").delete().eq("id", str(user_id)).execute()
        
        # Log audit
        audit_data = {
            "user_id": user.get("id"),
            "action": "deleted",
            "resource": "user",
            "details": json.dumps({"bulk_delete": [str(uid) for uid in bulk_action.user_ids]})
        }
        supabase.table("audit_logs").insert(audit_data).execute()
        
        return {"message": f"{len(bulk_action.user_ids)} users deleted"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Update users
    for user_id in bulk_action.user_ids:
        supabase.table("profiles").update(update_data).eq("id", str(user_id)).execute()
    
    # Log audit
    audit_data = {
        "user_id": user.get("id"),
        "action": "updated",
        "resource": "user",
        "details": json.dumps({"bulk_action": bulk_action.action, "user_ids": [str(uid) for uid in bulk_action.user_ids]})
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return {"message": f"{len(bulk_action.user_ids)} users updated"}

# ============================================
# Roles & Permissions Endpoints
# ============================================

@router.get("/roles", response_model=List[Role])
async def get_roles(user=Depends(require_role(["admin"]))):
    """Get all roles (admin only)"""
    supabase = get_db()
    
    result = supabase.table("custom_roles").select("*").execute()
    
    roles = []
    for role_data in result.data if result.data else []:
        p = json.loads(role_data["permissions"]) if isinstance(role_data["permissions"], str) else role_data["permissions"]
        print(f"DEBUG: Role {role_data['name']} permissions: {p} (Type: {type(role_data['permissions'])})")
        roles.append(Role(
            id=UUID(role_data["id"]),
            name=role_data["name"],
            description=role_data.get("description"),
            permissions=p,
            is_system=role_data.get("is_system", False),
            created_by=UUID(role_data["created_by"]) if role_data.get("created_by") else None,
            created_at=datetime.fromisoformat(role_data["created_at"]),
            updated_at=datetime.fromisoformat(role_data["updated_at"])
        ))
    
    return roles

@router.post("/roles", response_model=Role)
async def create_role(
    role_data: RoleCreate,
    user=Depends(require_role(["admin"]))
):
    """Create a custom role (admin only)"""
    supabase = get_db()
    
    role_insert = {
        "name": role_data.name,
        "description": role_data.description,
        "permissions": role_data.permissions,
        "is_system": False,
        "created_by": user.get("id")
    }
    
    result = supabase.table("custom_roles").insert(role_insert).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create role")
    
    role = result.data[0]
    
    return Role(
        id=UUID(role["id"]),
        name=role["name"],
        description=role.get("description"),
        permissions=json.loads(role["permissions"]) if isinstance(role["permissions"], str) else role["permissions"],
        is_system=role.get("is_system", False),
        created_by=UUID(role["created_by"]) if role.get("created_by") else None,
        created_at=datetime.fromisoformat(role["created_at"]),
        updated_at=datetime.fromisoformat(role["updated_at"])
    )

@router.patch("/roles/{role_id}")
async def update_role(
    role_id: UUID,
    role_update: RoleUpdate,
    user=Depends(require_role(["admin"]))
):
    """Update role permissions (admin only)"""
    supabase = get_db()
    
    # Check if system role
    role_result = supabase.table("custom_roles").select("is_system").eq("id", str(role_id)).execute()
    if not role_result.data:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role_result.data[0].get("is_system"):
        raise HTTPException(status_code=403, detail="Cannot modify system roles")
    
    print(f"DEBUG: Updating role {role_id} with data: {role_update.dict(exclude_unset=True)}")
    
    update_data = {}
    if role_update.name is not None:
        update_data["name"] = role_update.name
    if role_update.description is not None:
        update_data["description"] = role_update.description
    if role_update.permissions is not None:
        update_data["permissions"] = role_update.permissions

    result = supabase.table("custom_roles").update(update_data).eq("id", str(role_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Role not found")
    
    print(f"DEBUG: Update result: {result.data[0]['permissions']}")
    return {"message": "Role updated successfully"}

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: UUID,
    user=Depends(require_role(["admin"]))
):
    """Delete a custom role (admin only)"""
    supabase = get_db()
    
    # Check if system role
    role_result = supabase.table("custom_roles").select("is_system").eq("id", str(role_id)).execute()
    if not role_result.data:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role_result.data[0].get("is_system"):
        raise HTTPException(status_code=403, detail="Cannot delete system roles")
    
    result = supabase.table("custom_roles").delete().eq("id", str(role_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {"message": "Role deleted successfully"}

# ============================================
# Integrations Endpoints
# ============================================

@router.get("/integrations", response_model=List[Integration])
async def get_integrations(user=Depends(require_role(["admin"]))):
    """Get all integrations (admin only)"""
    supabase = get_db()
    
    result = supabase.table("integrations").select("*").execute()
    
    integrations = []
    for integration_data in result.data if result.data else []:
        integrations.append(Integration(
            id=UUID(integration_data["id"]),
            type=integration_data["type"],
            name=integration_data["name"],
            config=json.loads(integration_data["config"]) if isinstance(integration_data["config"], str) else integration_data["config"],
            status=integration_data["status"],
            last_sync=datetime.fromisoformat(integration_data["last_sync"]) if integration_data.get("last_sync") else None,
            error_message=integration_data.get("error_message"),
            created_by=UUID(integration_data["created_by"]),
            created_at=datetime.fromisoformat(integration_data["created_at"]),
            updated_at=datetime.fromisoformat(integration_data["updated_at"])
        ))
    
    return integrations

@router.post("/integrations/{integration_type}/connect")
async def connect_integration(
    integration_type: str,
    integration_data: IntegrationCreate,
    user=Depends(require_role(["admin"]))
):
    """Connect an integration (admin only)"""
    supabase = get_db()
    
    integration_insert = {
        "type": integration_type,
        "name": integration_data.name,
        "config": json.dumps(integration_data.config),
        "status": "connected",
        "created_by": user.get("id")
    }
    
    result = supabase.table("integrations").insert(integration_insert).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to connect integration")
    
    return {"message": "Integration connected successfully"}

@router.delete("/integrations/{integration_type}/disconnect")
async def disconnect_integration(
    integration_type: str,
    user=Depends(require_role(["admin"]))
):
    """Disconnect an integration (admin only)"""
    supabase = get_db()
    
    result = supabase.table("integrations").delete().eq("type", integration_type).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return {"message": "Integration disconnected successfully"}

# ============================================
# System Health Endpoints
# ============================================

@router.get("/health", response_model=SystemHealth)
async def get_system_health(user=Depends(require_role(["admin"]))):
    """Get system health status (admin only)"""
    try:
        import psutil
        
        # 1. Get system metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # 2. Check Database Connection (Real Ping)
        try:
            # Execute a lightweight query to check connectivity
            supabase = get_db()
            supabase.table("custom_roles").select("id").limit(1).execute()
            database_status = "healthy"
        except Exception as e:
            print(f"Health Check DB Error: {e}")
            database_status = "disconnected"

        # 3. Determine Server Status based on load
        if cpu_usage > 90 or memory.percent > 95:
            server_status = "high_load"
        else:
            server_status = "healthy"
        
        return SystemHealth(
            server_status=server_status,
            database_status=database_status,
            database_connections=10,  # Placeholder (Supabase doesn't expose this easily via client)
            jobs_queue_size=0,
            cpu_usage=cpu_usage,
            memory_usage=memory.percent,
            disk_usage=disk.percent
        )
    except ImportError:
        # Fallback if psutil is not installed
        return SystemHealth(
            server_status="healthy",
            database_status="unknown",
            database_connections=0,
            jobs_queue_size=0,
            cpu_usage=0.0,
            memory_usage=0.0,
            disk_usage=0.0
        )

# ============================================
# Audit Logs Endpoints
# ============================================

@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user_id: Optional[UUID] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    user=Depends(require_role(["admin"]))
):
    """Get audit log entries (admin only)"""
    supabase = get_db()
    
    query = supabase.table("audit_logs").select("*, profiles(full_name, email)", count="exact").order("created_at", desc=True)
    
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)
    if user_id:
        query = query.eq("user_id", str(user_id))
    if action:
        query = query.eq("action", action)
    if resource:
        query = query.eq("resource", resource)
    
    query = query.limit(limit).offset(offset)
    result = query.execute()
    
    logs = []
    for log_data in result.data if result.data else []:
        user_profile = log_data.get("profiles")
        
        logs.append(AuditLog(
            id=UUID(log_data["id"]),
            user_id=UUID(log_data["user_id"]) if log_data.get("user_id") else None,
            user_name=user_profile.get("full_name") if user_profile else "System",
            user_email=user_profile.get("email") if user_profile else None,
            action=log_data["action"],
            resource=log_data["resource"],
            resource_id=UUID(log_data["resource_id"]) if log_data.get("resource_id") else None,
            details=json.loads(log_data["details"]) if log_data.get("details") and isinstance(log_data["details"], str) else log_data.get("details"),
            before_data=json.loads(log_data["before_data"]) if log_data.get("before_data") and isinstance(log_data["before_data"], str) else log_data.get("before_data"),
            after_data=json.loads(log_data["after_data"]) if log_data.get("after_data") and isinstance(log_data["after_data"], str) else log_data.get("after_data"),
            ip_address=log_data.get("ip_address"),
            user_agent=log_data.get("user_agent"),
            created_at=datetime.fromisoformat(log_data["created_at"])
        ))
    
    return AuditLogListResponse(
        logs=logs,
        total=result.count if result.count else 0,
        page=offset // limit + 1,
        limit=limit
    )

@router.get("/audit-logs/{log_id}", response_model=AuditLog)
async def get_audit_log_detail(
    log_id: UUID,
    user=Depends(require_role(["admin"]))
):
    """Get detailed audit log entry (admin only)"""
    supabase = get_db()
    
    result = supabase.table("audit_logs").select("*").eq("id", str(log_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    log_data = result.data[0]
    
    return AuditLog(
        id=UUID(log_data["id"]),
        user_id=UUID(log_data["user_id"]) if log_data.get("user_id") else None,
        action=log_data["action"],
        resource=log_data["resource"],
        resource_id=UUID(log_data["resource_id"]) if log_data.get("resource_id") else None,
        details=json.loads(log_data["details"]) if log_data.get("details") and isinstance(log_data["details"], str) else log_data.get("details"),
        before_data=json.loads(log_data["before_data"]) if log_data.get("before_data") and isinstance(log_data["before_data"], str) else log_data.get("before_data"),
        after_data=json.loads(log_data["after_data"]) if log_data.get("after_data") and isinstance(log_data["after_data"], str) else log_data.get("after_data"),
        ip_address=log_data.get("ip_address"),
        user_agent=log_data.get("user_agent"),
        created_at=datetime.fromisoformat(log_data["created_at"])
    )

# ============================================
# Phase 5: Integrations & Logs
# ============================================
@router.get("/integrations/logs")
async def get_integration_logs(
    limit: int = 50, 
    offset: int = 0, 
    user=Depends(require_role(["admin"]))
):
    """Fetch integration / webhook logs"""
    supabase = get_db()
    res = supabase.table("integration_logs") \
        .select("*", count="exact") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .offset(offset) \
        .execute()
        
    return {"logs": res.data if res.data else [], "count": res.count}

# ============================================
# Phase 5: Archival
# ============================================

@router.post("/archive-leads")
async def archive_leads(criteria: ArchiveCriteria, user=Depends(require_role(["admin"]))):
    """
    Archive leads older than X days to leads_archive table 
    and remove from primary leads table.
    """
    supabase = get_db()
    
    # Calculate cutoff
    cutoff = datetime.now() - timedelta(days=criteria.days_older_than)
    cutoff_str = cutoff.isoformat()
    
    # Fetch candidates
    query = supabase.table("leads").select("*") \
        .lt("created_at", cutoff_str)
    
    if criteria.statuses:
        query = query.in_("status", criteria.statuses)
        
    res = query.execute()
    leads_to_archive = res.data if res.data else []
    
    if not leads_to_archive:
        return {"message": "No leads match criteria", "count": 0, "dry_run": criteria.dry_run}

    if criteria.dry_run:
        return {
            "message": "Dry Run Result", 
            "count": len(leads_to_archive), 
            "preview": leads_to_archive[:5]
        }
    
    # Perform Archival
    archive_entries = []
    ids_to_delete = []
    
    for lead in leads_to_archive:
        ids_to_delete.append(lead['id'])
        entry = {
            "original_lead_id": lead['id'],
            "parent_name": lead.get('parent_name'),
            "email": lead.get('email'),
            "archived_data": lead, 
            "archived_reason": f"older_than_{criteria.days_older_than}_days",
            "archived_by": user['id']
        }
        archive_entries.append(entry)
    
    # Insert Archive Records
    chunk_size = 100
    for i in range(0, len(archive_entries), chunk_size):
        chunk = archive_entries[i:i+chunk_size]
        try:
            supabase.table("leads_archive").insert(chunk).execute()
        except Exception as e:
            # If insert fails, abort delete? Or log?
            # For simplicity, we abort delete of this chunk?
            # But we are iterating in memory.
            # We'll skip adding to deletion list if insert failed?
            # Too complex for MVP endpoint.
            # We'll assume success or HTTPException.
            # But let's raise so user knows.
            raise HTTPException(status_code=500, detail=f"Archival failed: {str(e)}")
        
    # Delete from Leads
    deleted_count = 0
    for i in range(0, len(ids_to_delete), chunk_size):
        chunk_ids = ids_to_delete[i:i+chunk_size]
        del_res = supabase.table("leads").delete().in_("id", chunk_ids).execute()
        deleted_count += len(del_res.data) if del_res.data else 0
        
    # Log Audit
    audit_entry = {
        "user_id": user['id'],
        "action": "archived",
        "resource": "leads",
        "details": {
            "count": deleted_count,
            "cutoff_date": cutoff_str,
            "statuses": criteria.statuses
        }
    }
    supabase.table("audit_logs").insert(audit_entry).execute()
        
    return {"message": "Archival Complete", "count": deleted_count}
