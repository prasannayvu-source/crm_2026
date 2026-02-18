from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from database import get_db
from models import Lead, LeadStatus, PipelineSummary
from dependencies import get_current_user, require_role, require_permission

router = APIRouter(
    prefix="/api/v1/pipeline",
    tags=["Pipeline"],
    responses={404: {"description": "Not found"}},
)

@router.get("/summary", response_model=List[PipelineSummary])
async def get_pipeline_summary(
    current_user: dict = Depends(require_role(["admin", "manager"])),
    db=Depends(get_db)
):
    """
    Get a summary of leads in each stage, including overdue counts.
    Optimized: Single DB query instead of loop.
    """
    # 1. Fetch all leads with necessary fields in ONE query
    response = db.table("leads").select("status, last_interaction_at").execute()
    leads = response.data or []
    
    # 2. Define SLA mapping (hours)
    sla_map = {
        "new": 24, # 1 day
        "attempted_contact": 48, # 2 days
        "connected": 72, # 3 days
        "visit_scheduled": 24 * 7, # 1 week
        "application_submitted": 72,
        "enrolled": 0,
        "lost": 0
    }
    
    # 3. Aggregate in memory
    summary_map = {s.value: {"count": 0, "overdue": 0} for s in LeadStatus}
    now = datetime.now(timezone.utc)

    for lead in leads:
        status_val = lead.get('status')
        if status_val not in summary_map:
            continue
            
        summary_map[status_val]["count"] += 1
        
        # Check overdue
        limit_hours = sla_map.get(status_val, 0)
        if limit_hours > 0:
            last_inter_str = lead.get('last_interaction_at')
            if last_inter_str:
                # Handle varying ISO formats if necessary, though Supabase is consistent
                try:
                    # Parse assuming UTC or offset-naive as UTC
                    # last_inter_str likely contains offset if from Supabase timestamptz
                    last_interaction = datetime.fromisoformat(last_inter_str.replace('Z', '+00:00'))
                    
                    # Ensure timezone awareness for comparison
                    if last_interaction.tzinfo is None:
                         last_interaction = last_interaction.replace(tzinfo=timezone.utc)
                         
                    if (now - last_interaction).total_seconds() / 3600 > limit_hours:
                        summary_map[status_val]["overdue"] += 1
                except ValueError:
                    pass # Skip invalid dates

    # 4. Convert dictionary to list of models
    summary = []
    for s in LeadStatus:
        stats = summary_map[s.value]
        summary.append(PipelineSummary(status=s, count=stats["count"], overdue_count=stats["overdue"]))
        
    return summary
    
from pydantic import BaseModel

class BulkAssignRequest(BaseModel):
    lead_ids: List[str]
    new_owner_id: str

@router.post("/bulk-assign")
async def bulk_assign_leads(
    request: BulkAssignRequest,
    current_user: dict = Depends(require_permission("leads.assign")),
    db=Depends(get_db)
):
    # Verify new owner exists
    # Check if user exists first (optional but good)
    # Perform update
    
    # Update leads
    # Using python client update with 'in' filter logic requires specific syntax or loop
    # db.table("leads").update(...).in_("id", list) works in recent versions
    
    data, count = db.table("leads").update({"assigned_to": str(request.new_owner_id)}).in_("id", [str(id) for id in request.lead_ids]).execute()
    
    return {"message": f"Successfully reassigned {len(data[1]) if data and len(data) > 1 else 'leads'}"}

@router.get("/aging")
async def get_aging_report(
    threshold_days: int = 3,
    current_user: dict = Depends(require_role(["admin", "manager"])),
    db=Depends(get_db)
):
    """
    Get leads that haven't had an interaction in `threshold_days`.
    """
    threshold_date = (datetime.now(timezone.utc) - timedelta(days=threshold_days)).isoformat()
    
    # Return leads where last_interaction_at < threshold and status is NOT won/lost
    # Note: last_interaction_at might be null for very old leads if migration didn't run, 
    # but we ran migration.
    response = db.table("leads").select("*")\
        .lt("last_interaction_at", threshold_date)\
        .not_.in_("status", ["enrolled", "lost"])\
        .execute()
        
    return response.data

@router.post("/run-sla-check")
async def run_sla_check(
    current_user: dict = Depends(require_role(["admin", "manager"])),
    db=Depends(get_db)
):
    """
    Check for overdue leads and create notifications for lead owners.
    """
    # 1. Reuse summary logic to identify overdue leads
    # Better to fetch overdue leads directly
    now = datetime.now(timezone.utc)
    
    # SLA Rules
    sla_map = {
        "new": 24, 
        "attempted_contact": 48,
        "connected": 72,
        "visit_scheduled": 24 * 7,
        "application_submitted": 72
    }
    
    notifications_created = 0
    
    for status, limit_hours in sla_map.items():
        if limit_hours <= 0: continue
            
        threshold_time = (now - timedelta(hours=limit_hours)).isoformat()
        
        # Find leads in this status updated before threshold
        leads_res = db.table("leads").select("id, parent_name, assigned_to, last_interaction_at")\
            .eq("status", status)\
            .lt("last_interaction_at", threshold_time)\
            .execute()
            
        overdue_leads = leads_res.data or []
        
        for lead in overdue_leads:
            owner_id = lead.get("assigned_to")
            if not owner_id: continue
            
            # Create notification
            # Check if recent notification exists to avoid spam? 
            # For now, just create. User can mark all read.
            
            msg = f"Lead {lead.get('parent_name')} is overdue (Status: {status}). Please follow up."
            
            notif = {
                "user_id": owner_id,
                "title": "SLA Warning: Overdue Lead",
                "message": msg,
                "read": False,
                "type": "alert",
                "link": f"/leads/{lead.get('id')}"
            }
            
            try:
                db.table("notifications").insert(notif).execute()
                notifications_created += 1
            except Exception as e:
                print(f"Failed to create notification for lead {lead.get('id')}: {e}")
                
    return {"message": f"SLA Check complete. Created {notifications_created} notifications."}
