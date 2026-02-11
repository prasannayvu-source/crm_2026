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
    last_interaction_at: Optional[datetime] = None

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

class InteractionType(str, Enum):
    call = "call"
    meeting = "meeting"
    email = "email"
    note = "note"
    status_change = "status_change"

class InteractionOutcome(str, Enum):
    connected = "connected"
    no_answer = "no_answer"
    voicemail = "voicemail"
    positive = "positive"
    negative = "negative"
    scheduled = "scheduled"

class InteractionBase(BaseModel):
    type: InteractionType
    outcome: Optional[InteractionOutcome] = None
    summary: Optional[str] = None

class InteractionCreate(InteractionBase):
    lead_id: UUID

class Interaction(InteractionBase):
    id: UUID
    lead_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    title: str
    message: Optional[str] = None
    link: Optional[str] = None
    read: bool = False

class NotificationCreate(NotificationBase):
    user_id: UUID

class Notification(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime

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
