from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from dependencies import require_role

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to OnlyAI CRM API", "status": "active"}

@app.get("/api/v1/auth/me")
def get_me(user=Depends(require_role(["admin", "manager", "counselor"]))):
    return {"user": user, "role": user.role}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
