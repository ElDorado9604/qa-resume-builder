# QA Resume Builder

A minimal, production-ready web app for QA Engineers, Automation Engineers, SDETs, and Test Engineers to build ATS-optimized resumes and export them as Word (.docx) files.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- **Backend**: Python FastAPI + `python-docx`, deployed on Render
- **Database + Auth**: Supabase (Postgres + Auth with Google OAuth only + Row Level Security)

## Project Structure

```
qa-resume-builder/
├── frontend/           # Next.js app
│   ├── src/app/        # App Router pages
│   ├── src/components/ # React components
│   ├── src/lib/        # Supabase client helpers
│   └── src/types/      # Shared TypeScript types
├── backend/            # FastAPI app
│   ├── main.py         # API entrypoint
│   ├── models.py       # Pydantic models
│   └── docx_export.py  # .docx generation logic
├── supabase/
│   └── schema.sql      # Table schema + RLS policies
└── render.yaml         # Render deployment blueprint
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Google** and disable email/password sign-up.
3. In the SQL Editor, run `supabase/schema.sql` to create tables and RLS policies.
4. Copy your **Project URL** and **anon/publishable key** from Project Settings → API.

### 2. Google Cloud Console (OAuth)

1. Create an OAuth 2.0 Client ID (Web application) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized JavaScript origins: your Vercel domain (and `http://localhost:3000` for dev).
3. Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`.
4. Paste the Client ID and Secret into Supabase → Authentication → Providers → Google.

### 3. Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com), pointing at this repo, root directory `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables (see `backend/.env.example`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SARVAM_API_KEY` (optional, for future AI features)
   - `CORS_ORIGIN` (your Vercel frontend URL)

### 4. Frontend (Vercel)

1. Import this repo into [Vercel](https://vercel.com), root directory `frontend`.
2. Set environment variables (see `frontend/.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)
3. Deploy.

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # fill in values
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local  # fill in values
npm run dev
```

## Future Extensibility

- AI-powered features via Sarvam AI (resume parsing, bullet generation, JD tailoring) — stub endpoints noted in `backend/main.py`.
- PDF export.
- Expo (React Native) mobile app reusing the same backend API and shared types.
