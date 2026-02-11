from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from dependencies import require_role
from routers import leads, tasks, pipeline, interactions

app = FastAPI(title="Jeevana Vidya Online School CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(tasks.router)
app.include_router(pipeline.router)
app.include_router(interactions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Jeevana Vidya Online School CRM API", "status": "active"}

@app.get("/api/v1/auth/me")
def get_me(user=Depends(require_role(["admin", "manager", "counselor"]))):
    return {"user": user, "role": user.role}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
