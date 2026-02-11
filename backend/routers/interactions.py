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

@router.get("/", response_model=List[Interaction])
async def get_interactions(lead_id: Optional[str] = None, user=Depends(get_current_user)):
    query = supabase.table("interactions").select("*").order("created_at", desc=True)
    
    if lead_id:
        query = query.eq("lead_id", lead_id)
        
    response = query.execute()
    return response.data if response.data else []

@router.post("/", response_model=Interaction)
async def create_interaction(interaction: InteractionCreate, user=Depends(get_current_user)):
    data = interaction.dict()
    data["created_by"] = user.id
    
    response = supabase.table("interactions").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create interaction")
        
    return response.data[0]
