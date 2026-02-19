from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime, time
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

class LeadUpdate(BaseModel):
    parent_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[LeadStatus] = None
    source: Optional[LeadSource] = None
    assigned_to: Optional[UUID] = None
    last_interaction_at: Optional[datetime] = None

class TaskStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    cancelled = "cancelled"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    lead_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    status: TaskStatus = TaskStatus.pending

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[UUID] = None
    status: Optional[TaskStatus] = None

class InteractionType(str, Enum):
    call = "call"
    email = "email"
    meeting = "meeting"
    note = "note"
    status_change = "status_change"

class InteractionBase(BaseModel):
    type: InteractionType
    summary: Optional[str] = None
    outcome: Optional[str] = None
    lead_id: UUID

class InteractionCreate(InteractionBase):
    pass

class Interaction(InteractionBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    link: Optional[str] = None
    user_id: UUID

class Notification(NotificationBase):
    id: UUID
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PipelineSummary(BaseModel):
    status: LeadStatus
    count: int
    overdue_count: int = 0

# ============================================
# Phase 4: Analytics, Reports & Admin Models
# ============================================

# Analytics Models
class KPIMetrics(BaseModel):
    total_leads: int
    total_enrollments: int
    conversion_rate: float
    active_pipeline: int
    avg_time_to_convert: Optional[float] = None
    trend_vs_last_period: Dict[str, float] = {}

class LeadVolumeData(BaseModel):
    date: str
    count: int

class FunnelStageData(BaseModel):
    stage: str
    count: int
    percentage: float
    drop_off_rate: Optional[float] = None

class ConversionBySource(BaseModel):
    source: str
    total_leads: int
    enrolled: int
    conversion_rate: float

class CounselorPerformance(BaseModel):
    counselor_id: UUID
    counselor_name: str
    total_leads: int
    interactions_count: int
    enrollments: int
    conversion_rate: float
    avg_response_time: Optional[float] = None

class AlertItem(BaseModel):
    id: UUID
    type: str  # 'stale_lead', 'overdue_task', 'low_conversion', etc.
    severity: str  # 'critical', 'warning', 'info'
    title: str
    description: str
    link: Optional[str] = None
    created_at: datetime

# Reports Models
class ReportTemplate(BaseModel):
    id: str
    name: str
    description: str
    fields: List[str]
    filters: Optional[Dict[str, Any]] = None
    is_system: bool = False

class ReportCreate(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[str]
    filters: Optional[Dict[str, Any]] = None
    grouping: Optional[str] = None
    sorting: Optional[Dict[str, str]] = None
    aggregations: Optional[Dict[str, str]] = None

class Report(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    fields: List[str]
    filters: Optional[Dict[str, Any]] = None
    grouping: Optional[str] = None
    sorting: Optional[Dict[str, str]] = None
    aggregations: Optional[Dict[str, str]] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportBuildResponse(BaseModel):
    report_id: Optional[UUID] = None
    preview_data: List[Dict[str, Any]]
    row_count: int

class ReportExportRequest(BaseModel):
    report_id: Optional[str] = None
    report_config: Optional[dict] = None  # Full report definition for unsaved exports
    format: str  # 'csv', 'pdf', 'xlsx', 'sheets'

class ReportExportResponse(BaseModel):
    download_url: str
    expires_at: datetime

class ScheduledReportCreate(BaseModel):
    report_id: UUID
    frequency: str  # 'once', 'daily', 'weekly', 'monthly'
    schedule_time: Optional[time] = None
    schedule_day: Optional[int] = None
    recipients: List[str]  # Email addresses
    format: str

class ScheduledReport(BaseModel):
    id: UUID
    report_id: UUID
    frequency: str
    schedule_time: Optional[time] = None
    schedule_day: Optional[int] = None
    recipients: List[str]
    format: str
    status: str
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportRun(BaseModel):
    id: UUID
    report_id: Optional[UUID] = None
    scheduled_report_id: Optional[UUID] = None
    status: str
    row_count: Optional[int] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None
    run_by: UUID
    run_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Admin Models
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: Optional[str] = None
    phone: Optional[str] = None
    role: str
    status: str = 'active'
    send_invite: bool = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class User(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    status: str
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[User]
    total: int
    page: int
    limit: int

class BulkUserAction(BaseModel):
    user_ids: List[UUID]
    action: str  # 'activate', 'deactivate', 'delete'

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, Any]

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None

class Role(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    permissions: Dict[str, Any]
    is_system: bool
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IntegrationCreate(BaseModel):
    type: str
    name: str
    config: Dict[str, Any]

class Integration(BaseModel):
    id: UUID
    type: str
    name: str
    config: Dict[str, Any]
    status: str
    last_sync: Optional[datetime] = None
    error_message: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WebhookCreate(BaseModel):
    events: List[str]
    endpoint_url: str
    secret: str

class Webhook(BaseModel):
    id: UUID
    events: List[str]
    endpoint_url: str
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class APIKeyCreate(BaseModel):
    name: str
    expires_at: Optional[datetime] = None

class APIKey(BaseModel):
    id: UUID
    key_prefix: str
    name: Optional[str] = None
    created_by: UUID
    last_used: Optional[datetime] = None
    usage_count: int
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class APIKeyCreateResponse(BaseModel):
    key_id: UUID
    api_key: str  # Full key shown only once

class SystemHealth(BaseModel):
    server_status: str
    database_status: str
    database_connections: int
    jobs_queue_size: int
    cpu_usage: float
    memory_usage: float
    disk_usage: float

class AuditLog(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    resource: str
    resource_id: Optional[UUID] = None
    details: Optional[Dict[str, Any]] = None
    before_data: Optional[Dict[str, Any]] = None
    after_data: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    logs: List[AuditLog]
    total: int
    page: int
    limit: int

class AppSetting(BaseModel):
    id: UUID
    key: str
    value: Any
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArchiveCriteria(BaseModel):
    days_older_than: int
    statuses: List[str]
    dry_run: bool = True
