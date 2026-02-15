from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from database import get_db
from dependencies import get_current_user
from models import (
    KPIMetrics, LeadVolumeData, FunnelStageData,
    ConversionBySource, CounselorPerformance, AlertItem
)

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/kpis", response_model=KPIMetrics)
async def get_kpis(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get KPI metrics for the analytics dashboard"""
    supabase = get_db()
    
    # Build query
    query = supabase.table("leads").select("*", count="exact")
    
    # Apply filters
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)
    if source:
        query = query.eq("source", source)
    if status:
        query = query.eq("status", status)
    if assigned_to:
        query = query.eq("assigned_to", assigned_to)
    
    # Apply role-based filtering
    if user.get("role") == "counselor":
        query = query.eq("assigned_to", user.get("id"))
    elif user.get("role") == "manager":
        # Get team members for manager
        team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
        team_result = team_query.execute()
        team_ids = [member["id"] for member in team_result.data]
        team_ids.append(user.get("id"))
        query = query.in_("assigned_to", team_ids)
    
    result = query.execute()
    
    total_leads = result.count if result.count else 0
    leads_data = result.data if result.data else []
    
    # Calculate enrollments
    total_enrollments = len([lead for lead in leads_data if lead.get("status") == "enrolled"])
    
    # Calculate conversion rate
    conversion_rate = (total_enrollments / total_leads * 100) if total_leads > 0 else 0
    
    # Calculate active pipeline (leads not enrolled or lost)
    active_pipeline = len([
        lead for lead in leads_data 
        if lead.get("status") not in ["enrolled", "lost"]
    ])
    
    # Calculate average time to convert (simplified)
    avg_time_to_convert = None
    enrolled_leads = [lead for lead in leads_data if lead.get("status") == "enrolled"]
    if enrolled_leads:
        total_days = 0
        for lead in enrolled_leads:
            created = datetime.fromisoformat(lead["created_at"].replace("Z", "+00:00"))
            updated = datetime.fromisoformat(lead["updated_at"].replace("Z", "+00:00"))
            days = (updated - created).days
            total_days += days
        avg_time_to_convert = total_days / len(enrolled_leads)
    
    # Calculate trends (compare with previous period)
    trend_vs_last_period = {}
    if date_from and date_to:
        date_from_dt = datetime.fromisoformat(date_from)
        date_to_dt = datetime.fromisoformat(date_to)
        period_days = (date_to_dt - date_from_dt).days
        
        prev_date_from = (date_from_dt - timedelta(days=period_days)).isoformat()
        prev_date_to = date_from_dt.isoformat()
        
        prev_query = supabase.table("leads").select("*", count="exact")
        prev_query = prev_query.gte("created_at", prev_date_from).lte("created_at", prev_date_to)
        
        if user.get("role") == "counselor":
            prev_query = prev_query.eq("assigned_to", user.get("id"))
        elif user.get("role") == "manager":
            prev_query = prev_query.in_("assigned_to", team_ids)
        
        prev_result = prev_query.execute()
        prev_total = prev_result.count if prev_result.count else 0
        
        if prev_total > 0:
            trend_vs_last_period["total_leads"] = ((total_leads - prev_total) / prev_total) * 100
        else:
            trend_vs_last_period["total_leads"] = 100.0 if total_leads > 0 else 0.0
    
    return KPIMetrics(
        total_leads=total_leads,
        total_enrollments=total_enrollments,
        conversion_rate=round(conversion_rate, 2),
        active_pipeline=active_pipeline,
        avg_time_to_convert=round(avg_time_to_convert, 1) if avg_time_to_convert else None,
        trend_vs_last_period=trend_vs_last_period
    )

@router.get("/lead-volume", response_model=List[LeadVolumeData])
async def get_lead_volume(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    granularity: str = Query("day", regex="^(day|week|month)$"),
    user=Depends(get_current_user)
):
    """Get lead volume over time"""
    supabase = get_db()
    
    # Build query
    query = supabase.table("leads").select("created_at")
    
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)
    
    # Apply role-based filtering
    if user.get("role") == "counselor":
        query = query.eq("assigned_to", user.get("id"))
    elif user.get("role") == "manager":
        team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
        team_result = team_query.execute()
        team_ids = [member["id"] for member in team_result.data]
        team_ids.append(user.get("id"))
        query = query.in_("assigned_to", team_ids)
    
    result = query.execute()
    leads = result.data if result.data else []
    
    # Group by date
    volume_dict = {}
    for lead in leads:
        created_at = datetime.fromisoformat(lead["created_at"].replace("Z", "+00:00"))
        
        if granularity == "day":
            date_key = created_at.strftime("%Y-%m-%d")
        elif granularity == "week":
            date_key = created_at.strftime("%Y-W%W")
        else:  # month
            date_key = created_at.strftime("%Y-%m")
        
        volume_dict[date_key] = volume_dict.get(date_key, 0) + 1
    
    # Convert to list and sort
    volume_data = [
        LeadVolumeData(date=date, count=count)
        for date, count in sorted(volume_dict.items())
    ]
    
    return volume_data

@router.get("/funnel", response_model=List[FunnelStageData])
async def get_funnel_analysis(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get pipeline funnel analysis"""
    supabase = get_db()
    
    # Build query
    query = supabase.table("leads").select("status")
    
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)
    if source:
        query = query.eq("source", source)
    
    # Apply role-based filtering
    if user.get("role") == "counselor":
        query = query.eq("assigned_to", user.get("id"))
    elif user.get("role") == "manager":
        team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
        team_result = team_query.execute()
        team_ids = [member["id"] for member in team_result.data]
        team_ids.append(user.get("id"))
        query = query.in_("assigned_to", team_ids)
    
    result = query.execute()
    leads = result.data if result.data else []
    
    total_leads = len(leads)
    
    # Count by status
    status_counts = {}
    for lead in leads:
        status = lead.get("status", "new")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Define funnel stages in order
    funnel_stages = [
        "new",
        "attempted_contact",
        "connected",
        "visit_scheduled",
        "application_submitted",
        "enrolled"
    ]
    
    funnel_data = []
    prev_count = total_leads
    
    for stage in funnel_stages:
        count = status_counts.get(stage, 0)
        percentage = (count / total_leads * 100) if total_leads > 0 else 0
        drop_off_rate = ((prev_count - count) / prev_count * 100) if prev_count > 0 else 0
        
        funnel_data.append(FunnelStageData(
            stage=stage,
            count=count,
            percentage=round(percentage, 2),
            drop_off_rate=round(drop_off_rate, 2) if stage != "new" else None
        ))
        
        prev_count = count
    
    return funnel_data

@router.get("/conversion-by-source", response_model=List[ConversionBySource])
async def get_conversion_by_source(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get conversion rates by lead source"""
    supabase = get_db()
    
    # Build query
    query = supabase.table("leads").select("source, status")
    
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)
    
    # Apply role-based filtering
    if user.get("role") == "counselor":
        query = query.eq("assigned_to", user.get("id"))
    elif user.get("role") == "manager":
        team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
        team_result = team_query.execute()
        team_ids = [member["id"] for member in team_result.data]
        team_ids.append(user.get("id"))
        query = query.in_("assigned_to", team_ids)
    
    result = query.execute()
    leads = result.data if result.data else []
    
    # Group by source
    source_data = {}
    for lead in leads:
        source = lead.get("source", "unknown")
        if source not in source_data:
            source_data[source] = {"total": 0, "enrolled": 0}
        
        source_data[source]["total"] += 1
        if lead.get("status") == "enrolled":
            source_data[source]["enrolled"] += 1
    
    # Calculate conversion rates
    conversion_data = []
    for source, data in source_data.items():
        conversion_rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
        conversion_data.append(ConversionBySource(
            source=source,
            total_leads=data["total"],
            enrolled=data["enrolled"],
            conversion_rate=round(conversion_rate, 2)
        ))
    
    return sorted(conversion_data, key=lambda x: x.conversion_rate, reverse=True)

@router.get("/counselor-performance", response_model=List[CounselorPerformance])
async def get_counselor_performance(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get counselor performance metrics"""
    supabase = get_db()
    
    # Only admins and managers can view this
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get counselors
    counselor_query = supabase.table("profiles").select("id, full_name").eq("role", "counselor")
    
    if user.get("role") == "manager":
        counselor_query = counselor_query.eq("manager_id", user.get("id"))
    
    counselors_result = counselor_query.execute()
    counselors = counselors_result.data if counselors_result.data else []
    
    performance_data = []
    
    for counselor in counselors:
        counselor_id = counselor["id"]
        counselor_name = counselor["full_name"]
        
        # Get leads for this counselor
        leads_query = supabase.table("leads").select("status").eq("assigned_to", counselor_id)
        
        if date_from:
            leads_query = leads_query.gte("created_at", date_from)
        if date_to:
            leads_query = leads_query.lte("created_at", date_to)
        
        leads_result = leads_query.execute()
        leads = leads_result.data if leads_result.data else []
        
        total_leads = len(leads)
        enrollments = len([l for l in leads if l.get("status") == "enrolled"])
        conversion_rate = (enrollments / total_leads * 100) if total_leads > 0 else 0
        
        # Get interactions count
        interactions_query = supabase.table("interactions").select("id", count="exact")
        interactions_query = interactions_query.eq("created_by", counselor_id)
        
        if date_from:
            interactions_query = interactions_query.gte("created_at", date_from)
        if date_to:
            interactions_query = interactions_query.lte("created_at", date_to)
        
        interactions_result = interactions_query.execute()
        interactions_count = interactions_result.count if interactions_result.count else 0
        
        performance_data.append(CounselorPerformance(
            counselor_id=UUID(counselor_id),
            counselor_name=counselor_name,
            total_leads=total_leads,
            interactions_count=interactions_count,
            enrollments=enrollments,
            conversion_rate=round(conversion_rate, 2),
            avg_response_time=None  # TODO: Calculate from interaction timestamps
        ))
    
    return sorted(performance_data, key=lambda x: x.conversion_rate, reverse=True)

@router.get("/alerts", response_model=List[AlertItem])
async def get_alerts(
    user=Depends(get_current_user)
):
    """Get at-risk leads and system alerts"""
    supabase = get_db()
    alerts = []
    
    # Get stale leads (no interaction in 7+ days)
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    
    stale_query = supabase.table("leads").select("id, parent_name, last_interaction_at, status")
    stale_query = stale_query.neq("status", "enrolled").neq("status", "lost")
    stale_query = stale_query.or_(f"last_interaction_at.is.null,last_interaction_at.lt.{seven_days_ago}")
    
    # Apply role-based filtering
    if user.get("role") == "counselor":
        stale_query = stale_query.eq("assigned_to", user.get("id"))
    elif user.get("role") == "manager":
        team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
        team_result = team_query.execute()
        team_ids = [member["id"] for member in team_result.data]
        team_ids.append(user.get("id"))
        stale_query = stale_query.in_("assigned_to", team_ids)
    
    stale_result = stale_query.execute()
    stale_leads = stale_result.data if stale_result.data else []
    
    for lead in stale_leads[:10]:  # Limit to 10 alerts
        days_stale = 7
        if lead.get("last_interaction_at"):
            last_interaction = datetime.fromisoformat(lead["last_interaction_at"].replace("Z", "+00:00"))
            days_stale = (datetime.now(last_interaction.tzinfo) - last_interaction).days
        
        alerts.append(AlertItem(
            id=UUID(lead["id"]),
            type="stale_lead",
            severity="warning" if days_stale < 14 else "critical",
            title=f"Stale Lead: {lead['parent_name']}",
            description=f"No interaction in {days_stale} days",
            link=f"/leads/{lead['id']}",
            created_at=datetime.now()
        ))
    
    # Get overdue tasks
    now = datetime.now().isoformat()
    overdue_query = supabase.table("tasks").select("id, title, due_date, lead_id")
    overdue_query = overdue_query.eq("status", "pending").lt("due_date", now)
    
    if user.get("role") == "counselor":
        overdue_query = overdue_query.eq("assigned_to", user.get("id"))
    elif user.get("role") == "manager":
        overdue_query = overdue_query.in_("assigned_to", team_ids)
    
    overdue_result = overdue_query.execute()
    overdue_tasks = overdue_result.data if overdue_result.data else []
    
    for task in overdue_tasks[:5]:  # Limit to 5 alerts
        alerts.append(AlertItem(
            id=UUID(task["id"]),
            type="overdue_task",
            severity="critical",
            title=f"Overdue Task: {task['title']}",
            description=f"Due: {task['due_date']}",
            link=f"/leads/{task['lead_id']}" if task.get("lead_id") else None,
            created_at=datetime.now()
        ))
    
    return alerts
