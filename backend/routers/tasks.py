from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import supabase
from models import Task, TaskCreate
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Task])
async def get_tasks(lead_id: Optional[str] = None, assigned_to: Optional[str] = None, user=Depends(get_current_user)):
    query = supabase.table("tasks")
    
    if lead_id:
        query = query.eq("lead_id", lead_id)
        
    if assigned_to:
        query = query.eq("assigned_to", assigned_to)
        
    response = query.execute()
    return response.data if response.data else []

@router.post("/", response_model=Task)
async def create_task(task: TaskCreate, user=Depends(get_current_user)):
    task_data = task.dict()
    # task_data["created_by"] = user.id # Column does not exist in tasks table
    if not task_data.get("assigned_to"):
        task_data["assigned_to"] = user.id
        
    response = supabase.table("tasks").insert(task_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create task")
        
    return response.data[0]

@router.patch("/{id}/complete")
async def complete_task(id: str, user=Depends(get_current_user)):
    response = supabase.table("tasks").update({"status": "completed"}).eq("id", id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]
