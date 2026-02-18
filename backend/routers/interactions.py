from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import supabase
from models import Interaction, InteractionCreate
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/interactions",
    tags=["interactions"],
    responses={404: {"description": "Not found"}},
)

@router.get("/timeline/{lead_id}")
async def get_timeline(lead_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get a unified timeline of interactions and tasks for a lead.
    """
    # 1. Fetch Interactions
    interactions_res = supabase.table("interactions").select("*").eq("lead_id", lead_id).order("created_at", desc=True).limit(50).execute()
    interactions = interactions_res.data or []
    
    # 2. Fetch Tasks
    tasks_res = supabase.table("tasks").select("*").eq("lead_id", lead_id).order("created_at", desc=True).limit(50).execute()
    tasks = tasks_res.data or []
    
    # 3. Combine and sort
    timeline = []
    for i in interactions:
        i["event_type"] = "interaction"
        timeline.append(i)
        
    for t in tasks:
        t["event_type"] = "task"
        t["type"] = "task"
        # Map task fields to common timeline structure
        t["summary"] = f"Task: {t.get('title', 'Untitled')} ({t.get('status')})"
        timeline.append(t)
        
    # Sort by created_at desc
    timeline.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return timeline

@router.post("/", response_model=Interaction)
async def create_interaction(interaction: InteractionCreate, current_user: dict = Depends(get_current_user)):
    data = interaction.dict()
    data["created_by"] = current_user.get("id")
    
    # 1. Insert Interaction
    response = supabase.table("interactions").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create interaction")
        
    new_interaction = response.data[0]
    
    # 2. Update Lead's last_interaction_at
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("leads").update({"last_interaction_at": now}).eq("id", str(interaction.lead_id)).execute()
        
    return new_interaction
