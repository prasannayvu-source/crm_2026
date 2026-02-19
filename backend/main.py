from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from dependencies import require_role, get_current_user
from routers import leads, tasks, pipeline, interactions, analytics, reports, admin, notifications

app = FastAPI(
    title="Jeevana Vidya Online School CRM",
    description="Enterprise-grade CRM for educational institutions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Specific origins for credentials support
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Phase 5: Middleware
from middleware.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware)

# Phase 0-3: Core CRM Routers
app.include_router(leads.router)
app.include_router(tasks.router)
app.include_router(pipeline.router)
app.include_router(interactions.router)
app.include_router(notifications.router)

# Phase 4: Analytics, Reports & Admin Routers
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Jeevana Vidya Online School CRM API",
        "status": "active",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/v1/auth/me")
def get_me(user=Depends(get_current_user)):
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": user.get("role"),
        "permissions": user.get("permissions"),
        "status": user.get("status")
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "timestamp": "2026-02-11T19:07:44+05:30"}
