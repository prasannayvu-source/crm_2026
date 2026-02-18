from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_db
from dependencies import get_current_user, require_permission
from models import (
    KPIMetrics, LeadVolumeData, FunnelStageData,
    ConversionBySource, CounselorPerformance, AlertItem
)
import time

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    user=Depends(require_permission("finance.view"))
):
    """🚀 ULTRA-FAST: Get ALL analytics data in a single request!"""
    start_time = time.time()
    print(f"🚀 Dashboard: Starting combined fetch...")
    
    try:
        supabase = get_db()
        
        # Single query to get ALL data at once
        query = supabase.table("leads").select("id, status, source, created_at, assigned_to").limit(1000)
        
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
        
        result = query.execute()
        leads = result.data if result.data else []
        total_leads = len(leads)
        
        # Calculate KPIs
        total_enrollments = sum(1 for l in leads if l.get("status") == "enrolled")
        conversion_rate = (total_enrollments / total_leads * 100) if total_leads > 0 else 0
        active_pipeline = sum(1 for l in leads if l.get("status") not in ["enrolled", "lost"])
        
        # Calculate lead volume by date
        volume_dict = {}
        for lead in leads:
            try:
                date_str = lead["created_at"][:10]
                volume_dict[date_str] = volume_dict.get(date_str, 0) + 1
            except:
                continue
        lead_volume = [{"date": date, "count": count} for date, count in sorted(volume_dict.items())]
        
        # Calculate funnel
        status_counts = {}
        for lead in leads:
            status = lead.get("status", "new")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        funnel = []
        for status, count in status_counts.items():
            percentage = (count / total_leads * 100) if total_leads > 0 else 0
            funnel.append({
                "stage": status,
                "count": count,
                "percentage": round(percentage, 2),
                "drop_off_rate": 0
            })
        
        # Calculate conversion by source
        source_data = {}
        for lead in leads:
            src = lead.get("source", "Unknown")
            if src not in source_data:
                source_data[src] = {"total": 0, "enrolled": 0}
            source_data[src]["total"] += 1
            if lead.get("status") == "enrolled":
                source_data[src]["enrolled"] += 1
        
        conversion_by_source = []
        for src, data in source_data.items():
            rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
            conversion_by_source.append({
                "source": src,
                "total_leads": data["total"],
                "enrolled": data["enrolled"],
                "conversion_rate": round(rate, 2)
            })
        
        # Calculate counselor performance
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
        
        # 🚀 OPTIMIZATION: Batch fetch counselor names
        # Instead of fetching one by one, we get them all in a single query
        counselor_ids = list(counselor_data.keys())
        counselor_names = {}
        
        if counselor_ids:
            try:
                profiles_query = supabase.table("profiles").select("id, full_name").in_("id", counselor_ids).execute()
                for profile in profiles_query.data:
                    counselor_names[profile["id"]] = profile.get("full_name") or "Unknown Counselor"
            except Exception as e:
                print(f"⚠️ Error fetching counselor names: {e}")

        counselor_performance = []
        for counselor_id, data in counselor_data.items():
            rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
            
            # Use real name if found, otherwise fallback to ID
            name = counselor_names.get(counselor_id, f"Counselor {counselor_id[:8]}")
            
            counselor_performance.append({
                "counselor_id": counselor_id,
                "counselor_name": name,
                "total_leads": data["total"],
                "interactions_count": 0,
                "enrollments": data["enrolled"],
                "conversion_rate": round(rate, 2)
            })
        
        total_time = time.time() - start_time
        
        # 🔍 DEBUG LOGGING
        print(f"📊 Dashboard Summary:")
        print(f"   Total leads fetched: {total_leads}")
        print(f"   Total enrollments: {total_enrollments}")
        print(f"   Conversion rate: {round(conversion_rate, 2)}%")
        print(f"   Active pipeline: {active_pipeline}")
        print(f"   Sources found: {list(source_data.keys())}")
        print(f"   Statuses found: {list(status_counts.keys())}")
        print(f"   Counselors found: {len(counselor_data)}")
        print(f"✅ Dashboard: ALL data fetched in {total_time:.2f}s")
        
        return {
            "kpis": {
                "total_leads": total_leads,
                "total_enrollments": total_enrollments,
                "conversion_rate": round(conversion_rate, 2),
                "active_pipeline": active_pipeline,
                "avg_time_to_convert": None,
                "trend_vs_last_period": {}
            },
            "lead_volume": lead_volume,
            "funnel": funnel,
            "conversion_by_source": sorted(conversion_by_source, key=lambda x: x["total_leads"], reverse=True),
            "counselor_performance": sorted(counselor_performance, key=lambda x: x["total_leads"], reverse=True),
            "alerts": []
        }
    except Exception as e:
        print(f"❌ Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "kpis": {"total_leads": 0, "total_enrollments": 0, "conversion_rate": 0.0, "active_pipeline": 0, "avg_time_to_convert": None, "trend_vs_last_period": {}},
            "lead_volume": [],
            "funnel": [],
            "conversion_by_source": [],
            "counselor_performance": [],
            "alerts": []
        }

@router.get("/kpis", response_model=KPIMetrics)
async def get_kpis(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    user=Depends(require_permission("finance.view"))
):
    """Get KPI metrics - SUPER OPTIMIZED WITH TIMING"""
    start_time = time.time()
    try:
        supabase = get_db()
        
        # LIMIT to 1000 leads max to prevent slowness
        query_start = time.time()
        query = supabase.table("leads").select("id, status", count="exact").limit(1000)
        
        # Apply basic filters only
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
        
        result = query.execute()
        query_time = time.time() - query_start
        print(f"⏱️  KPIs query took {query_time:.2f}s, got {len(result.data) if result.data else 0} leads")
        
        total_leads = result.count if result.count else 0
        leads = result.data if result.data else []
        
        # Simple calculations
        total_enrollments = sum(1 for l in leads if l.get("status") == "enrolled")
        conversion_rate = (total_enrollments / total_leads * 100) if total_leads > 0 else 0
        active_pipeline = sum(1 for l in leads if l.get("status") not in ["enrolled", "lost"])
        
        total_time = time.time() - start_time
        print(f"✅ KPIs endpoint completed in {total_time:.2f}s")
        
        return KPIMetrics(
            total_leads=total_leads,
            total_enrollments=total_enrollments,
            conversion_rate=round(conversion_rate, 2),
            active_pipeline=active_pipeline,
            avg_time_to_convert=None,
            trend_vs_last_period={}
        )
    except Exception as e:
        print(f"❌ KPI Error: {e}")
        return KPIMetrics(
            total_leads=0,
            total_enrollments=0,
            conversion_rate=0.0,
            active_pipeline=0,
            avg_time_to_convert=None,
            trend_vs_last_period={}
        )

@router.get("/lead-volume", response_model=List[LeadVolumeData])
async def get_lead_volume(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(require_permission("finance.view"))
):
    """Get lead volume - SUPER OPTIMIZED WITH TIMING"""
    start_time = time.time()
    try:
        supabase = get_db()
        query = supabase.table("leads").select("created_at").limit(1000)
        
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
        
        result = query.execute()
        query_time = time.time() - start_time
        print(f"⏱️  Lead volume query took {query_time:.2f}s")
        
        leads = result.data if result.data else []
        
        # Group by date
        volume_dict = {}
        for lead in leads:
            try:
                date_str = lead["created_at"][:10]
                volume_dict[date_str] = volume_dict.get(date_str, 0) + 1
            except:
                continue
        
        print(f"✅ Lead volume completed in {time.time() - start_time:.2f}s")
        return [LeadVolumeData(date=date, count=count) for date, count in sorted(volume_dict.items())]
    except Exception as e:
        print(f"❌ Volume Error: {e}")
        return []

@router.get("/funnel", response_model=List[FunnelStageData])
async def get_funnel_analysis(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    user=Depends(require_permission("finance.view"))
):
    """Get funnel - SUPER OPTIMIZED WITH TIMING"""
    start_time = time.time()
    try:
        supabase = get_db()
        query = supabase.table("leads").select("status").limit(1000)
        
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
        
        result = query.execute()
        query_time = time.time() - start_time
        print(f"⏱️  Funnel query took {query_time:.2f}s")
        
        leads = result.data if result.data else []
        
        # Count by status
        status_counts = {}
        for lead in leads:
            status = lead.get("status", "new")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # All possible stages
        stages = ["new", "attempted_contact", "connected", "visit_scheduled", "application_submitted", "enrolled", "lost"]
        
        total = len(leads) if leads else 1
        
        funnel_data = []
        for stage in stages:
            count = status_counts.get(stage, 0)
            percentage = (count / total * 100)
            
            funnel_data.append(FunnelStageData(
                stage=stage,
                count=count,
                percentage=round(percentage, 2),
                drop_off_rate=0.0
            ))
        
        print(f"✅ Funnel completed in {time.time() - start_time:.2f}s")
        return funnel_data
    except Exception as e:
        print(f"❌ Funnel Error: {e}")
        stages = ["new", "attempted_contact", "connected", "visit_scheduled", "application_submitted", "enrolled", "lost"]
        return [FunnelStageData(stage=s, count=0, percentage=0.0, drop_off_rate=0.0) for s in stages]

@router.get("/conversion-by-source", response_model=List[ConversionBySource])
async def get_conversion_by_source(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(require_permission("finance.view"))
):
    """Get conversion by source - SUPER OPTIMIZED WITH TIMING"""
    start_time = time.time()
    try:
        supabase = get_db()
        query = supabase.table("leads").select("source, status").limit(1000)
        
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
        
        result = query.execute()
        query_time = time.time() - start_time
        print(f"⏱️  Conversion query took {query_time:.2f}s")
        
        leads = result.data if result.data else []
        
        # Group by source
        source_data = {}
        for lead in leads:
            source = lead.get("source", "Unknown")
            if source not in source_data:
                source_data[source] = {"total": 0, "enrolled": 0}
            source_data[source]["total"] += 1
            if lead.get("status") == "enrolled":
                source_data[source]["enrolled"] += 1
        
        conversion_data = []
        for source, data in source_data.items():
            rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
            conversion_data.append(ConversionBySource(
                source=source,
                total_leads=data["total"],
                enrolled=data["enrolled"],
                conversion_rate=round(rate, 2)
            ))
        
        print(f"✅ Conversion completed in {time.time() - start_time:.2f}s")
        return sorted(conversion_data, key=lambda x: x.total_leads, reverse=True)
    except Exception as e:
        print(f"❌ Conversion Error: {e}")
        return []

@router.get("/counselor-performance", response_model=List[CounselorPerformance])
async def get_counselor_performance(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(require_permission("finance.view"))
):
    """Get counselor performance - SUPER OPTIMIZED WITH TIMING"""
    start_time = time.time()
    try:
        supabase = get_db()
        query = supabase.table("leads").select("assigned_to, status").limit(1000)
        
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
        
        result = query.execute()
        query_time = time.time() - start_time
        print(f"⏱️  Performance query took {query_time:.2f}s")
        
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
        
        # Batch fetch counselor names
        counselor_ids = list(counselor_data.keys())
        counselor_names = {}
        if counselor_ids:
            try:
                # Use .in_() for array filtering
                profiles_query = supabase.table("profiles").select("id, full_name").in_("id", counselor_ids).execute()
                if profiles_query.data:
                     for profile in profiles_query.data:
                        counselor_names[profile["id"]] = profile.get("full_name")
            except Exception as e:
                print(f"⚠️ Error fetching counselor names: {e}")

        performance_data = []
        for counselor_id, data in counselor_data.items():
            rate = (data["enrolled"] / data["total"] * 100) if data["total"] > 0 else 0
            
            # Use real name if found, fallback to formatted ID
            name = counselor_names.get(counselor_id)
            if not name:
                 name = f"Counselor {counselor_id[:8]}"
            
            performance_data.append(CounselorPerformance(
                counselor_id=counselor_id,
                counselor_name=name,
                total_leads=data["total"],
                interactions_count=0,  # Not tracking interactions for now
                enrollments=data["enrolled"],
                conversion_rate=round(rate, 2)
            ))
        
        print(f"✅ Performance completed in {time.time() - start_time:.2f}s")
        return sorted(performance_data, key=lambda x: x.total_leads, reverse=True)
    except Exception as e:
        print(f"❌ Performance Error: {e}")
        return []

@router.get("/alerts", response_model=List[AlertItem])
async def get_alerts(user=Depends(require_permission("finance.view"))):
    """Get alerts - SUPER OPTIMIZED WITH TIMING"""
    start_time = time.time()
    try:
        print(f"✅ Alerts completed in {time.time() - start_time:.2f}s")
        return []
    except Exception as e:
        print(f"❌ Alerts Error: {e}")
        return []
