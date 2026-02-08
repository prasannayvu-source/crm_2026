from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import supabase
from models import Lead, LeadCreate, StudentCreate
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/leads",
    tags=["leads"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Lead])
async def get_leads(status: Optional[str] = None, assigned_to: Optional[str] = None, user=Depends(get_current_user)):
    # 1. Start query selecting all (*) from leads
    query = supabase.table("leads").select("*, students(*)")

    # 2. Filter by status if provided
    if status:
        query = query.eq("status", status)
    
    # 3. Filter by assigned_to if provided
    if assigned_to:
        query = query.eq("assigned_to", assigned_to)
    
    # RLS handles general permissions, but filtering is user-driven UI logic.
    response = query.execute()
    
    # Post-process to ensure students is a list
    data = response.data
    for lead in data:
        if not lead.get("students"):
            lead["students"] = []
            
    return data

@router.post("/", response_model=Lead)
async def create_lead(lead: LeadCreate, user=Depends(get_current_user)):
    # 1. Prepare Lead Data
    lead_data = lead.dict(exclude={"students"})
    lead_data["created_by"] = user.id
    # Default assigned_to to creator if not set
    if not lead_data.get("assigned_to"):
        lead_data["assigned_to"] = user.id

    # 2. Insert Lead
    response = supabase.table("leads").insert(lead_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create lead")
    
    new_lead = response.data[0]
    
    # 3. Insert Students
    if lead.students:
        students_data = [s.dict() for s in lead.students]
        for s in students_data:
            s["lead_id"] = new_lead["id"]
        
        student_res = supabase.table("students").insert(students_data).execute()
        new_lead["students"] = student_res.data
    else:
        new_lead["students"] = []

    return new_lead

@router.get("/{id}", response_model=Lead)
async def get_lead(id: str, user=Depends(get_current_user)):
    response = supabase.table("leads").select("*, students(*)").eq("id", id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_data = response.data
    if not lead_data.get("students"):
        lead_data["students"] = []
        
    return lead_data

@router.patch("/{id}/assign")
async def assign_lead(id: str, assigned_to: str, user=Depends(get_current_user)):
    # Simple role check - this logic could be moved to dependencies but is specific here
    # Query user profile to check role
    profile_check = supabase.table('profiles').select('role').eq('id', user.id).single().execute()
    if not profile_check.data or profile_check.data['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to reassign leads")
        
    response = supabase.table("leads").update({"assigned_to": assigned_to}).eq("id", id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Return updated lead with students to match response model
    updated_lead = response.data[0]
    # Fetch students again to be compliant with response model (or modify model to make students optional)
    stud_res = supabase.table("students").select("*").eq("lead_id", id).execute()
    updated_lead["students"] = stud_res.data if stud_res.data else []
    
    return updated_lead
