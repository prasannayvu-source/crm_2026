# OnlyAI CRM - Backend

This backend is built with FastAPI and connects to Supabase via the official Python client.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Ensure `.env` contains:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_KEY` for anon access, but backend usually needs admin/service-role for certain tasks)

3.  **Run Development Server**:
    ```bash
    uvicorn main:app --reload
    ```
    API will be available at `http://localhost:8000`.
    Documentation: `http://localhost:8000/docs`.

## Structure
-   `main.py`: Entry point.
-   `database.py`: Supabase client initialization.
-   `dependencies.py`: Authentication and RBAC.

## Phase 0 Completion
-   [x] Initial Setup.
-   [x] Database Schemas (`profiles`).
-   [x] Auth Middleware (`dependencies.py`).
-   [x] Health Check (`/api/v1/health`).
