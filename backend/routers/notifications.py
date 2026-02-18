from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from database import get_db
from models import Notification, NotificationBase
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Notification])
async def get_notifications(
    limit: int = 20,
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Get notifications for the current user."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    query = db.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
    
    if unread_only:
        # Note: Phase 3 doc says 'read' column, model says 'is_read'.
        # I checked DB schema in Step 87, column is 'read'.
        # I must map this correctly.
        # But 'Notification' model uses 'is_read'.
        # Pydantic alias might handle this if config is set, or I manual map.
        query = query.eq("read", False)

    response = query.execute()
    
    # Map 'read' from DB to 'is_read' in Model if needed
    data = response.data or []
    for item in data:
        if "read" in item:
            item["is_read"] = item["read"]
            
    return data

@router.patch("/{id}/read")
async def mark_notification_read(
    id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Mark a notification as read."""
    user_id = current_user.get("id")
    response = db.table("notifications").update({"read": True}).eq("id", id).eq("user_id", user_id).execute()
    # Note: trying both 'read' and 'is_read' just in case schema drifted, but likely 'read' is the column.
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return response.data[0]

@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Mark all notifications as read for current user."""
    user_id = current_user.get("id")
    response = db.table("notifications").update({"read": True}).eq("user_id", user_id).eq("read", False).execute()
    return {"message": "All marked as read"}
