"""
QA Resume Builder - FastAPI backend

MVP scope:
- POST /api/export-docx -> generates an ATS-friendly .docx resume

Structured so future endpoints (e.g. /api/generate-summary,
/api/generate-bullets, /api/tailor-to-jd) can be added easily,
calling Sarvam AI or other providers.
"""
import os
import io

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models import ResumeExportRequest
from docx_export import build_resume_docx

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")

app = FastAPI(
    title="QA Resume Builder API",
    description="Backend API for generating ATS-friendly QA/SDET resumes as .docx files.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "qa-resume-builder-api"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.post("/api/export-docx")
def export_docx(payload: ResumeExportRequest):
    """
    Accepts full resume JSON and returns a generated .docx file.
    """
    try:
        buffer: io.BytesIO = build_resume_docx(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {exc}") from exc

    filename = f"{payload.name.replace(' ', '_')}_Resume.docx" if payload.name else "Resume.docx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --------------------------------------------------------------------------
# Future AI-powered endpoints (Sarvam AI). Left as stubs / placeholders.
# --------------------------------------------------------------------------
# @app.post("/api/generate-summary")
# def generate_summary(...): ...
#
# @app.post("/api/generate-bullets")
# def generate_bullets(...): ...
#
# @app.post("/api/tailor-to-jd")
# def tailor_to_jd(...): ...
