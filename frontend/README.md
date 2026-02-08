# OnlyAI CRM - Frontend

This frontend is built using Next.js 14+ (App Router), TypeScript, and custom CSS for strict UI adherence (Glassmorphism).

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Ensure `.env.local` contains:
    -   `NEXT_PUBLIC_SUPABASE_URL`
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Frontend will be available at `http://localhost:3000`.

## Phase 0 Completion
-   [x] Landing Page (`/`).
-   [x] Login (`/login`) with Supabase Auth.
-   [x] Signup (`/signup`) with Supabase Auth.
-   [x] Dashboard (`/dashboard`) with Role Check.
-   [x] Access Denied (`/403`).
-   [x] Maintenance (`/503`).
-   [x] Strict UI Implementation (Glassmorphism, Dark Theme).
