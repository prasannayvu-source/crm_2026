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
    """Get KPI metrics for the analytics dashboard - OPTIMIZED"""
    try:
        supabase = get_db()
        
        # Build base query - only select needed columns
        query = supabase.table("leads").select("id, status, created_at, updated_at", count="exact")
        
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
            team_ids = [member["id"] for member in team_result.data] if team_result.data else []
            team_ids.append(user.get("id"))
            query = query.in_("assigned_to", team_ids)
        
        result = query.execute()
        
        total_leads = result.count if result.count else 0
        leads_data = result.data if result.data else []
        
        # Calculate enrollments
        total_enrollments = sum(1 for lead in leads_data if lead.get("status") == "enrolled")
        
        # Calculate conversion rate
        conversion_rate = (total_enrollments / total_leads * 100) if total_leads > 0 else 0
        
        # Calculate active pipeline (leads not enrolled or lost)
        active_pipeline = sum(1 for lead in leads_data if lead.get("status") not in ["enrolled", "lost"])
        
        # Calculate average time to convert (simplified)
        avg_time_to_convert = None
        enrolled_leads = [lead for lead in leads_data if lead.get("status") == "enrolled"]
        if enrolled_leads:
            total_days = 0
            count = 0
            for lead in enrolled_leads:
                try:
                    created = datetime.fromisoformat(lead["created_at"].replace("Z", "+00:00"))
                    updated = datetime.fromisoformat(lead["updated_at"].replace("Z", "+00:00"))
                    days = (updated - created).days
                    total_days += days
                    count += 1
                except:
                    continue
            avg_time_to_convert = total_days / count if count > 0 else None
        
        return KPIMetrics(
            total_leads=total_leads,
            total_enrollments=total_enrollments,
            conversion_rate=round(conversion_rate, 2),
            active_pipeline=active_pipeline,
            avg_time_to_convert=round(avg_time_to_convert, 1) if avg_time_to_convert else None,
            trend_vs_last_period={}
        )
    except Exception as e:
        print(f"Error in get_kpis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lead-volume", response_model=List[LeadVolumeData])
async def get_lead_volume(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get lead volume over time - OPTIMIZED"""
    try:
        supabase = get_db()
        
        # Build query - only select created_at
        query = supabase.table("leads").select("created_at")
        
        # Apply filters
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
            team_ids = [member["id"] for member in team_result.data] if team_result.data else []
            team_ids.append(user.get("id"))
            query = query.in_("assigned_to", team_ids)
        
        result = query.execute()
        leads = result.data if result.data else []
        
        # Group by date
        volume_dict = {}
        for lead in leads:
            try:
                date_str = lead["created_at"][:10]  # Extract YYYY-MM-DD
                volume_dict[date_str] = volume_dict.get(date_str, 0) + 1
            except:
                continue
        
        # Convert to list and sort
        volume_data = [
            LeadVolumeData(date=date, count=count)
            for date, count in sorted(volume_dict.items())
        ]
        
        return volume_data
    except Exception as e:
        print(f"Error in get_lead_volume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/funnel", response_model=List[FunnelStageData])
async def get_funnel_analysis(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get pipeline funnel analysis - OPTIMIZED"""
    try:
        supabase = get_db()
        
        # Build query - only select status
        query = supabase.table("leads").select("status")
        
        # Apply filters
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
            team_ids = [member["id"] for member in team_result.data] if team_result.data else []
            team_ids.append(user.get("id"))
            query = query.in_("assigned_to", team_ids)
        
        result = query.execute()
        leads = result.data if result.data else []
        
        # Count by status
        status_counts = {}
        for lead in leads:
            status = lead.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Define funnel stages in order
        stages = ["new", "attempted_contact", "connected", "visit_scheduled", "application_submitted", "enrolled", "lost"]
        
        funnel_data = [
            FunnelStageData(stage=stage, count=status_counts.get(stage, 0))
            for stage in stages
        ]
        
        return funnel_data
    except Exception as e:
        print(f"Error in get_funnel_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversion-by-source", response_model=List[ConversionBySource])
async def get_conversion_by_source(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get conversion rates by lead source - OPTIMIZED"""
    try:
        supabase = get_db()
        
        # Build query - only select source and status
        query = supabase.table("leads").select("source, status")
        
        # Apply filters
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
            team_ids = [member["id"] for member in team_result.data] if team_result.data else []
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
            rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
            conversion_data.append(ConversionBySource(
                source=source,
                total_leads=data["total"],
                enrolled=data["enrolled"],
                conversion_rate=round(rate, 2)
            ))
        
        return sorted(conversion_data, key=lambda x: x.total_leads, reverse=True)
    except Exception as e:
        print(f"Error in get_conversion_by_source: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/counselor-performance", response_model=List[CounselorPerformance])
async def get_counselor_performance(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get counselor performance metrics - OPTIMIZED"""
    try:
        # Only admins and managers can view this
        if user.get("role") not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="Not authorized to view counselor performance")
        
        supabase = get_db()
        
        # Build query - select assigned_to and status
        query = supabase.table("leads").select("assigned_to, status")
        
        # Apply filters
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
        
        # Apply role-based filtering for managers
        if user.get("role") == "manager":
            team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
            team_result = team_query.execute()
            team_ids = [member["id"] for member in team_result.data] if team_result.data else []
            team_ids.append(user.get("id"))
            query = query.in_("assigned_to", team_ids)
        
        result = query.execute()
        leads = result.data if result.data else []
        
        # Group by counselor
        counselor_data = {}
        for lead in leads:
            counselor_id = lead.get("assigned_to")
            if not counselor_id:
                continue
            if counselor_id not in counselor_data:
                counselor_data[counselor_id] = {"total": 0, "enrolled": 0}
            counselor_data[counselor_id]["total"] += 1
            if lead.get("status") == "enrolled":
                counselor_data[counselor_id]["enrolled"] += 1
        
        # Get counselor names
        if counselor_data:
            counselor_ids = list(counselor_data.keys())
            profiles_query = supabase.table("profiles").select("id, full_name").in_("id", counselor_ids)
            profiles_result = profiles_query.execute()
            profiles = {p["id"]: p["full_name"] for p in profiles_result.data} if profiles_result.data else {}
        else:
            profiles = {}
        
        # Calculate performance
        performance_data = []
        for counselor_id, data in counselor_data.items():
            rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
            performance_data.append(CounselorPerformance(
                counselor_id=counselor_id,
                counselor_name=profiles.get(counselor_id, "Unknown"),
                total_leads=data["total"],
                enrolled=data["enrolled"],
                conversion_rate=round(rate, 2)
            ))
        
        return sorted(performance_data, key=lambda x: x.total_leads, reverse=True)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_counselor_performance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=List[AlertItem])
async def get_alerts(
    user=Depends(get_current_user)
):
    """Get at-risk leads and system alerts - OPTIMIZED"""
    try:
        supabase = get_db()
        alerts = []
        
        # Get stale leads (no interaction in 7+ days) - simplified query
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        
        stale_query = supabase.table("leads").select("id, parent_name, last_interaction_at")
        stale_query = stale_query.lt("last_interaction_at", seven_days_ago)
        stale_query = stale_query.not_.in_("status", ["enrolled", "lost"])
        
        # Apply role-based filtering
        if user.get("role") == "counselor":
            stale_query = stale_query.eq("assigned_to", user.get("id"))
        elif user.get("role") == "manager":
            team_query = supabase.table("profiles").select("id").eq("manager_id", user.get("id"))
            team_result = team_query.execute()
            team_ids = [member["id"] for member in team_result.data] if team_result.data else []
            team_ids.append(user.get("id"))
            stale_query = stale_query.in_("assigned_to", team_ids)
        
        stale_query = stale_query.limit(5)  # Limit to 5 most critical
        stale_result = stale_query.execute()
        
        if stale_result.data:
            for lead in stale_result.data:
                days_since = 7  # Simplified
                alerts.append(AlertItem(
                    id=str(lead["id"]),
                    type="stale_lead",
                    severity="warning",
                    title=f"Stale Lead: {lead['parent_name']}",
                    description=f"No interaction in {days_since}+ days",
                    link=f"/leads/{lead['id']}",
                    created_at=datetime.now().isoformat()
                ))
        
        return alerts
    except Exception as e:
        print(f"Error in get_alerts: {str(e)}")
        return []  # Return empty list on error instead of failing
