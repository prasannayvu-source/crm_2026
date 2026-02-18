from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import json
import csv
import io
from fastapi.responses import StreamingResponse
from database import get_db
from dependencies import get_current_user, require_permission
from models import (
    ReportTemplate, ReportCreate, Report, ReportBuildResponse,
    ReportExportRequest, ReportExportResponse, ScheduledReportCreate,
    ScheduledReport, ReportRun
)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

# Pre-built report templates
REPORT_TEMPLATES = [
    {
        "id": "leads_overview",
        "name": "Leads Overview",
        "description": "Complete overview of all leads with key metrics",
        "fields": ["parent_name", "email", "phone", "status", "source", "created_at", "assigned_to"],
        "filters": {}
    },
    {
        "id": "enrollment_report",
        "name": "Enrollment Report",
        "description": "All enrolled students with details",
        "fields": ["parent_name", "email", "phone", "student_name", "grade", "enrolled_date"],
        "filters": {"status": "enrolled"}
    },
    {
        "id": "pipeline_status",
        "name": "Pipeline Status Report",
        "description": "Current pipeline status breakdown",
        "fields": ["status", "count", "percentage"],
        "filters": {}
    },
    {
        "id": "counselor_activity",
        "name": "Counselor Activity Report",
        "description": "Counselor performance and activity metrics",
        "fields": ["counselor_name", "total_leads", "interactions", "enrollments", "conversion_rate"],
        "filters": {}
    },
    {
        "id": "source_analysis",
        "name": "Lead Source Analysis",
        "description": "Lead generation and conversion by source",
        "fields": ["source", "total_leads", "enrolled", "conversion_rate"],
        "filters": {}
    }
]

@router.get("/templates", response_model=List[ReportTemplate])
async def get_report_templates(user=Depends(require_permission("reports.view"))):
    """Get report templates (system + custom)"""
    supabase = get_db()
    
    # 1. Get system templates
    templates = [ReportTemplate(**template, is_system=True) for template in REPORT_TEMPLATES]
    
    # 2. Get custom reports from DB
    try:
        query = supabase.table("reports").select("*")
        # Optional: Filter by user or team if needed
        # query = query.eq("created_by", user.get("id")) 
        result = query.execute()
        
        if result.data:
            for item in result.data:
                # Handle JSON fields which might be returned as strings or dicts depending on Supabase client
                fields = item.get("fields")
                if isinstance(fields, str):
                    fields = json.loads(fields)
                
                filters = item.get("filters")
                if isinstance(filters, str):
                    filters = json.loads(filters)
                
                templates.append(ReportTemplate(
                    id=item["id"],
                    name=item["name"],
                    description=item.get("description", ""),
                    fields=fields or [],
                    filters=filters or {},
                    is_system=False
                ))
    except Exception as e:
        print(f"⚠️ Error fetching custom reports: {e}")
        # Continue with just system templates if DB fails
    
    return templates

@router.post("/build", response_model=ReportBuildResponse)
async def build_report(
    report: ReportCreate,
    save: bool = Query(False),
    user=Depends(require_permission("reports.view"))
):
    """Build a custom report and return preview data"""
    supabase = get_db()
    
    report_id = None
    
    if save:
        # Save report definition
        report_data = {
            "name": report.name,
            "description": report.description,
            "fields": json.dumps(report.fields),
            "filters": json.dumps(report.filters) if report.filters else None,
            "grouping": report.grouping,
            "sorting": json.dumps(report.sorting) if report.sorting else None,
            "aggregations": json.dumps(report.aggregations) if report.aggregations else None,
            "created_by": user.get("id")
        }
        
        insert_result = supabase.table("reports").insert(report_data).execute()
        
        if not insert_result.data:
            raise HTTPException(status_code=500, detail="Failed to create report")
        
        report_id = insert_result.data[0]["id"]
    
    # Build query based on report definition
    query = supabase.table("leads").select("*")
    
    # Apply filters
    if report.filters:
        for key, value in report.filters.items():
            if key == "status":
                query = query.eq("status", value)
            elif key == "source":
                query = query.eq("source", value)
            elif key == "assigned_to":
                query = query.eq("assigned_to", value)
            elif key == "date_from":
                query = query.gte("created_at", value)
            elif key == "date_to":
                query = query.lte("created_at", value)
    
    # Apply permission-based filtering (Role Agnostic)
    perms = user.get("permissions", {})
    can_view_all = perms.get("leads.view_all") or perms.get("*")
    
    if not can_view_all:
        query = query.eq("assigned_to", user.get("id"))
    
    result = query.execute()
    data = result.data if result.data else []
    
    # Filter fields
    preview_data = []
    for row in data[:100]:  # Limit preview to 100 rows
        filtered_row = {field: row.get(field) for field in report.fields if field in row}
        preview_data.append(filtered_row)
    
    return ReportBuildResponse(
        report_id=UUID(report_id) if report_id else None,
        preview_data=preview_data,
        row_count=len(data)
    )

@router.post("/export")
async def export_report(
    export_request: ReportExportRequest,
    user=Depends(require_permission("reports.view"))
):
    """Export report to specified format"""
    supabase = get_db()
    
    # Get report definition
    report = None
    
    # 0. Check for passed config (unsaved report)
    if export_request.report_config:
        report = export_request.report_config
        # Ensure consistency in filter/field access
        # The logic below expects dict with keys "fields" (list or json string) and "filters" (dict or json string)
        # report_config from request is already a dict
        
    # 1. Check pre-built templates
    if not report and export_request.report_id:
        report = next((t for t in REPORT_TEMPLATES if t["id"] == str(export_request.report_id)), None)
    
    # 2. If not found, check database (custom reports)
    if not report and export_request.report_id:
        try:
            report_result = supabase.table("reports").select("*").eq("id", str(export_request.report_id)).execute()
            if report_result.data:
                report = report_result.data[0]
        except Exception:
            # Ignore invalid UUID errors or DB errors here execution continues to 404 check
            pass
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Build query
    query = supabase.table("leads").select("*")
    
    # Apply filters from report
    if report.get("filters"):
        filters = json.loads(report["filters"]) if isinstance(report["filters"], str) else report["filters"]
        for key, value in filters.items():
            if key == "status":
                query = query.eq("status", value)
            elif key == "source":
                query = query.eq("source", value)
    
    # Apply permission-based filtering (Role Agnostic)
    perms = user.get("permissions", {})
    can_view_all = perms.get("leads.view_all") or perms.get("*")
    
    if not can_view_all:
        query = query.eq("assigned_to", user.get("id"))
    
    result = query.execute()
    data = result.data if result.data else []
    
    # Get fields
    fields = json.loads(report["fields"]) if isinstance(report["fields"], str) else report["fields"]
    
    # Filter data by fields
    filtered_data = []
    for row in data:
        filtered_row = {field: row.get(field) for field in fields}
        filtered_data.append(filtered_row)
    
    # Generate export file (simplified - in production, use pandas/openpyxl)
    # Generate content based on format
    content_stream = None
    media_type = "text/plain"
    filename = "report.txt"

    if export_request.format == "csv":
        try:
            output = io.StringIO()
            fieldnames = fields if fields else (list(filtered_data[0].keys()) if filtered_data else [])
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(filtered_data)
            output.seek(0)
            content_stream = output
            media_type = "text/csv"
            filename = "report_export.csv"
        except Exception as e:
            # Fallback for CSV generation error
            content_stream = io.StringIO(f"Error generating CSV: {str(e)}")
            filename = "error.txt"

    elif export_request.format == "xlsx":
        try:
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            
            # Write header
            fieldnames = fields if fields else (list(filtered_data[0].keys()) if filtered_data else [])
            ws.append(fieldnames)
            
            # Write rows
            for row in filtered_data:
                ws.append([row.get(field, "") for field in fieldnames])
            
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            
            content_stream = output
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = "report_export.xlsx"
        except Exception as e:
            content_stream = io.BytesIO(f"Error generating Excel: {str(e)}".encode())
            media_type = "text/plain"
            filename = "error.txt"

    elif export_request.format == "pdf":
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            
            output = io.BytesIO()
            doc = SimpleDocTemplate(output, pagesize=landscape(letter))
            elements = []
            
            styles = getSampleStyleSheet()
            elements.append(Paragraph(f"Report: {report.get('name', 'Export')}", styles['Title']))
            elements.append(Spacer(1, 12))
            
            # Prepare data for table
            # Header
            fieldnames = fields if fields else (list(filtered_data[0].keys()) if filtered_data else [])
            data = [[f.replace('_', ' ').title() for f in fieldnames]]
            
            # Rows
            for row in filtered_data:
                # Convert all values to string for PDF
                data.append([str(row.get(field, "")) for field in fieldnames])
            
            if not data:
                data = [["No Data"]]

            # Create Table
            # Dynamic column width? Auto for now
            t = Table(data)
            
            # Add style
            style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
            ])
            t.setStyle(style)
            elements.append(t)
            
            doc.build(elements)
            output.seek(0)
            
            content_stream = output
            media_type = "application/pdf"
            filename = "report_export.pdf"
            
        except Exception as e:
            content_stream = io.BytesIO(f"Error generating PDF: {str(e)}".encode())
            media_type = "text/plain"
            filename = "error.txt"

    elif export_request.format == "sheets":
        # Phase 5 Placeholder
        msg = f"The Google Sheets export feature is part of Phase 5.\nPlease use 'Export as CSV' for now to get your data."
        content_stream = io.BytesIO(msg.encode())
        filename = f"feature_coming_soon_{export_request.format}.txt"

    # Log report run (Safely)
    try:
        run_data = {
            "report_id": str(export_request.report_id) if isinstance(export_request.report_id, UUID) else None,
            "status": "completed",
            "row_count": len(filtered_data),
            "download_url": "Direct Download",
            "run_by": user.get("id"),
            "completed_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        # Only try to insert if we have a valid UUID for report_id, or if schema allows generic text
        # To be safe, we skip insert if it's likely to fail, or just try/except it (which we do)
        supabase.table("report_runs").insert(run_data).execute()
    except Exception as e:
        print(f"⚠️ Report logging failed (ignoring): {e}")

    return StreamingResponse(
        iter([content_stream.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/schedule", response_model=ScheduledReport)
async def schedule_report(
    scheduled_report: ScheduledReportCreate,
    user=Depends(require_permission("reports.view"))
):
    """Schedule a recurring report"""
    supabase = get_db()
    
    # Calculate next run time
    now = datetime.now()
    if scheduled_report.frequency == "daily":
        next_run = now.replace(
            hour=scheduled_report.schedule_time.hour if scheduled_report.schedule_time else 9,
            minute=scheduled_report.schedule_time.minute if scheduled_report.schedule_time else 0
        )
        if next_run <= now:
            next_run += timedelta(days=1)
    elif scheduled_report.frequency == "weekly":
        next_run = now + timedelta(days=7)
    elif scheduled_report.frequency == "monthly":
        next_run = now + timedelta(days=30)
    else:  # once
        next_run = now + timedelta(hours=1)
    
    schedule_data = {
        "report_id": str(scheduled_report.report_id),
        "frequency": scheduled_report.frequency,
        "schedule_time": scheduled_report.schedule_time.isoformat() if scheduled_report.schedule_time else None,
        "schedule_day": scheduled_report.schedule_day,
        "recipients": json.dumps(scheduled_report.recipients),
        "format": scheduled_report.format,
        "status": "active",
        "next_run": next_run.isoformat(),
        "created_by": user.get("id")
    }
    
    result = supabase.table("scheduled_reports").insert(schedule_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to schedule report")
    
    scheduled_data = result.data[0]
    
    return ScheduledReport(
        id=UUID(scheduled_data["id"]),
        report_id=UUID(scheduled_data["report_id"]),
        frequency=scheduled_data["frequency"],
        schedule_time=scheduled_data.get("schedule_time"),
        schedule_day=scheduled_data.get("schedule_day"),
        recipients=json.loads(scheduled_data["recipients"]) if isinstance(scheduled_data["recipients"], str) else scheduled_data["recipients"],
        format=scheduled_data["format"],
        status=scheduled_data["status"],
        next_run=datetime.fromisoformat(scheduled_data["next_run"]) if scheduled_data.get("next_run") else None,
        last_run=datetime.fromisoformat(scheduled_data["last_run"]) if scheduled_data.get("last_run") else None,
        created_by=UUID(scheduled_data["created_by"]),
        created_at=datetime.fromisoformat(scheduled_data["created_at"]),
        updated_at=datetime.fromisoformat(scheduled_data["updated_at"])
    )

@router.get("/scheduled", response_model=List[ScheduledReport])
async def get_scheduled_reports(user=Depends(require_permission("reports.view"))):
    """Get all scheduled reports"""
    supabase = get_db()
    
    query = supabase.table("scheduled_reports").select("*")
    
    # Filter by user if not admin
    if user.get("role") != "admin":
        query = query.eq("created_by", user.get("id"))
    
    result = query.execute()
    
    if not result.data:
        return []
    
    scheduled_reports = []
    for item in result.data:
        scheduled_reports.append(ScheduledReport(
            id=UUID(item["id"]),
            report_id=UUID(item["report_id"]),
            frequency=item["frequency"],
            schedule_time=item.get("schedule_time"),
            schedule_day=item.get("schedule_day"),
            recipients=json.loads(item["recipients"]) if isinstance(item["recipients"], str) else item["recipients"],
            format=item["format"],
            status=item["status"],
            next_run=datetime.fromisoformat(item["next_run"]) if item.get("next_run") else None,
            last_run=datetime.fromisoformat(item["last_run"]) if item.get("last_run") else None,
            created_by=UUID(item["created_by"]),
            created_at=datetime.fromisoformat(item["created_at"]),
            updated_at=datetime.fromisoformat(item["updated_at"])
        ))
    
    return scheduled_reports

@router.patch("/scheduled/{schedule_id}")
async def update_scheduled_report(
    schedule_id: UUID,
    status: str,
    user=Depends(require_permission("reports.view"))
):
    """Update scheduled report status (active/paused)"""
    supabase = get_db()
    
    if status not in ["active", "paused"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = supabase.table("scheduled_reports").update({"status": status}).eq("id", str(schedule_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    
    return {"message": "Status updated successfully"}

@router.delete("/scheduled/{schedule_id}")
async def delete_scheduled_report(
    schedule_id: UUID,
    user=Depends(require_permission("reports.view"))
):
    """Delete a scheduled report"""
    supabase = get_db()
    
    result = supabase.table("scheduled_reports").delete().eq("id", str(schedule_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    
    return {"message": "Scheduled report deleted successfully"}

@router.get("/history", response_model=List[ReportRun])
async def get_report_history(
    report_id: Optional[UUID] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    user=Depends(require_permission("reports.view"))
):
    """Get report run history"""
    supabase = get_db()
    
    query = supabase.table("report_runs").select("*").order("run_at", desc=True).limit(limit).offset(offset)
    
    if report_id:
        query = query.eq("report_id", str(report_id))
    
    # Filter by user if not admin
    if user.get("role") != "admin":
        query = query.eq("run_by", user.get("id"))
    
    result = query.execute()
    
    if not result.data:
        return []
    
    runs = []
    for item in result.data:
        runs.append(ReportRun(
            id=UUID(item["id"]),
            report_id=UUID(item["report_id"]) if item.get("report_id") else None,
            scheduled_report_id=UUID(item["scheduled_report_id"]) if item.get("scheduled_report_id") else None,
            status=item["status"],
            row_count=item.get("row_count"),
            download_url=item.get("download_url"),
            error_message=item.get("error_message"),
            run_by=UUID(item["run_by"]),
            run_at=datetime.fromisoformat(item["run_at"]),
            completed_at=datetime.fromisoformat(item["completed_at"]) if item.get("completed_at") else None,
            expires_at=datetime.fromisoformat(item["expires_at"]) if item.get("expires_at") else None
        ))
    
    return runs

@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    user=Depends(require_permission("reports.delete"))
):
    """Delete a custom report"""
    supabase = get_db()
    
    # Check if system report
    if any(t["id"] == report_id for t in REPORT_TEMPLATES):
        raise HTTPException(status_code=403, detail="Cannot delete system reports")
    
    try:
        supabase.table("reports").delete().eq("id", report_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")
        
    return {"message": "Report deleted successfully"}
