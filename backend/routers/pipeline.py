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
    response = db.table("leads").select("status, updated_at").execute()
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
            updated_str = lead.get('updated_at')
            if updated_str:
                # Handle varying ISO formats if necessary, though Supabase is consistent
                try:
                    updated_at = datetime.fromisoformat(updated_str.replace('Z', '+00:00'))
                    if (now - updated_at).total_seconds() / 3600 > limit_hours:
                        summary_map[status_val]["overdue"] += 1
                except ValueError:
                    pass # Skip invalid dates

    # 4. Convert dictionary to list of models
    summary = []
    for s in LeadStatus:
        stats = summary_map[s.value]
        summary.append(PipelineSummary(status=s, count=stats["count"], overdue_count=stats["overdue"]))
        
    return summary

@router.post("/bulk-assign")
async def bulk_assign_leads(
    lead_ids: List[UUID],
    new_owner_id: UUID,
    current_user: dict = Depends(require_permission("leads.assign")),
    db=Depends(get_db)
):
    """
    Bulk reassign leads to a new owner. Only Admins/Managers.
    """
    if not lead_ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided")
        
    data, count = db.table("leads").update({"assigned_to": str(new_owner_id)}).in_("id", [str(id) for id in lead_ids]).execute()
    
    return {"message": f"Successfully reassigned {len(data[1]) if data and len(data) > 1 else 'leads'}"}

@router.get("/aging")
async def get_aging_report(
    threshold_days: int = 3,
    current_user: dict = Depends(require_role(["admin", "manager"])),
    db=Depends(get_db)
):
    """
    Get leads that haven't been updated in `threshold_days`.
    """
    threshold_date = (datetime.now(timezone.utc) - timedelta(days=threshold_days)).isoformat()
    
    # Return leads where updated_at < threshold and status is NOT won/lost
    response = db.table("leads").select("*")\
        .lt("updated_at", threshold_date)\
        .not_.in_("status", ["enrolled", "lost"])\
        .execute()
        
    return response.data
