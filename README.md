# QA Resume Builder

A minimal, stateless web app for QA Engineers, Automation Engineers, SDETs, and Test Engineers to build ATS-optimized resumes and export them as Word (.docx) files.

No login, no database — fill in the form and download your resume.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- **Backend**: Python FastAPI + `python-docx`, deployed on Render

## Project Structure

```
qa-resume-builder/
├── frontend/           # Next.js app
│   ├── src/app/         # App Router pages (single-page resume form)
│   ├── src/components/  # React components (form fields, ResumeForm)
│   └── src/types/       # Shared TypeScript types
├── backend/             # FastAPI app
│   ├── main.py           # API entrypoint
│   ├── models.py         # Pydantic models
│   └── docx_export.py    # .docx generation logic
└── render.yaml          # Render deployment blueprint
```

## How it works

1. User fills out the resume form in the browser (name, contact, summary, skills, experience, projects, education, certifications). Data lives only in the browser session — nothing is saved server-side.
2. Clicking **Download Word** sends the form data as JSON to the backend's `POST /api/export-docx` endpoint.
3. The backend generates a clean, ATS-friendly `.docx` using `python-docx` and streams it back as a download.

## Setup

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com), pointing at this repo, root directory `backend`. Or use the included `render.yaml` blueprint.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables (see `backend/.env.example`):
   - `CORS_ORIGIN` — your Vercel frontend URL
   - `SARVAM_API_KEY` (optional, for future AI features)

### Frontend (Vercel)

1. Import this repo into [Vercel](https://vercel.com), root directory `frontend`.
2. Set environment variable (see `frontend/.env.example`):
   - `NEXT_PUBLIC_API_URL` — your Render backend URL
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

- Add back auth + database (e.g. Supabase, or another Postgres provider) to support saving/editing resumes across sessions.
- AI-powered features via Sarvam AI (resume parsing, bullet generation, JD tailoring) — stub endpoints noted in `backend/main.py`.
- PDF export.
- Expo (React Native) mobile app reusing the same backend API and shared types.
