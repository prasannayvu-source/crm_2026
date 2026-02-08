from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from enum import Enum

class LeadStatus(str, Enum):
    new = "new"
    attempted_contact = "attempted_contact"
    connected = "connected"
    visit_scheduled = "visit_scheduled"
    application_submitted = "application_submitted"
    enrolled = "enrolled"
    lost = "lost"

class LeadSource(str, Enum):
    website = "website"
    walk_in = "walk_in"
    referral = "referral"
    social = "social"

class StudentBase(BaseModel):
    name: str
    grade_applying_for: Optional[str] = None
    dob: Optional[date] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: UUID
    lead_id: UUID

class LeadBase(BaseModel):
    parent_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: LeadStatus = LeadStatus.new
    source: LeadSource = LeadSource.website
    assigned_to: Optional[UUID] = None

class LeadCreate(LeadBase):
    students: List[StudentCreate] = []

class Lead(LeadBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    students: List[Student] = []

    class Config:
        from_attributes = True

class TaskStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: TaskStatus = TaskStatus.pending
    assigned_to: Optional[UUID] = None

class TaskCreate(TaskBase):
    lead_id: UUID

class Task(TaskBase):
    id: UUID
    lead_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadHistoryBase(BaseModel):
    lead_id: UUID
    previous_status: Optional[LeadStatus]
    new_status: LeadStatus
    changed_by: Optional[UUID]
    changed_at: datetime

class LeadHistory(LeadHistoryBase):
    id: UUID
    
    class Config:
        from_attributes = True

class PipelineSummary(BaseModel):
    status: LeadStatus
    count: int
    overdue_count: int = 0
