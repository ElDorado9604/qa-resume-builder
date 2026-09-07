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

from models import (
    ResumeExportRequest,
    GenerateSummaryRequest,
    GenerateSummaryResponse,
    GenerateBulletsRequest,
    GenerateBulletsResponse,
    TailorToJDRequest,
    TailorToJDResponse,
)
from docx_export import build_resume_docx
from sarvam_client import chat_completion, chat_completion_json, SarvamError

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
# AI-powered endpoints (Sarvam AI)
# --------------------------------------------------------------------------


@app.post("/api/generate-summary", response_model=GenerateSummaryResponse)
def generate_summary(payload: GenerateSummaryRequest):
    """
    Generates a 2-3 sentence professional summary tailored to a QA/SDET
    target role, based on the person's skills and experience.
    """
    skills_flat = [
        *payload.skills.automation,
        *payload.skills.api,
        *payload.skills.ci_cd,
        *payload.skills.languages,
        *payload.skills.tools,
    ]
    experience_lines = [
        f"- {e.title} at {e.company} ({e.duration or 'duration unspecified'}): "
        f"{e.responsibilities or 'no details provided'}"
        for e in payload.experience
    ]

    system_prompt = (
        "You are an expert resume writer specializing in QA, test automation, "
        "and SDET careers. You write concise, ATS-friendly professional summaries "
        "with no fluff, no first-person pronouns, and no markdown formatting. "
        "Output plain text only: 2-3 sentences, nothing else."
    )
    user_prompt = (
        f"Target role: {payload.target_role or 'QA Engineer'}\n"
        f"Years of experience: {payload.years_of_experience or 'not specified'}\n"
        f"Key skills: {', '.join(skills_flat) or 'not specified'}\n"
        f"Experience history:\n" + ("\n".join(experience_lines) or "none provided") + "\n\n"
        f"Write a professional summary in a {payload.tone} tone."
    )

    try:
        summary = chat_completion(system_prompt, user_prompt, max_tokens=200)
    except SarvamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return GenerateSummaryResponse(summary=summary.strip())


@app.post("/api/generate-bullets", response_model=GenerateBulletsResponse)
def generate_bullets(payload: GenerateBulletsRequest):
    """
    Turns rough, unpolished notes about a role into polished, ATS-friendly
    resume bullet points with action verbs and (where plausible) metrics.
    """
    system_prompt = (
        "You are an expert resume writer specializing in QA, test automation, "
        "and SDET careers. Convert rough notes into polished resume bullet points. "
        "Rules: start each bullet with a strong action verb, keep each bullet under "
        "25 words, avoid first-person pronouns, avoid markdown, do not invent metrics "
        "that weren't implied by the notes. "
        'Respond ONLY with JSON in this exact shape: {"bullets": ["...", "..."]}'
    )
    user_prompt = (
        f"Role: {payload.title or 'not specified'} at {payload.company or 'not specified'}\n"
        f"Tech stack: {', '.join(payload.tech_stack) or 'not specified'}\n"
        f"Raw notes:\n{payload.raw_notes}\n\n"
        f"Generate exactly {payload.num_bullets} bullet points."
    )

    try:
        result = chat_completion_json(system_prompt, user_prompt, max_tokens=500)
    except SarvamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    bullets = result.get("bullets", [])
    if not isinstance(bullets, list) or not bullets:
        raise HTTPException(
            status_code=502, detail="Sarvam response did not include usable bullet points."
        )

    return GenerateBulletsResponse(bullets=[str(b).strip() for b in bullets])


@app.post("/api/tailor-to-jd", response_model=TailorToJDResponse)
def tailor_to_jd(payload: TailorToJDRequest):
    """
    Compares the resume against a job description and returns a rough
    keyword match score, matched/missing keywords, a tailored summary,
    and actionable suggestions.
    """
    resume = payload.resume
    skills_flat = [
        *resume.skills.automation,
        *resume.skills.api,
        *resume.skills.ci_cd,
        *resume.skills.languages,
        *resume.skills.tools,
    ]

    system_prompt = (
        "You are an expert resume writer and ATS optimization specialist for "
        "QA, test automation, and SDET roles. Compare the candidate's resume "
        "against the job description. Be honest about gaps rather than "
        "inflating the match score. "
        "Respond ONLY with JSON in this exact shape: "
        '{"match_score": <int 0-100>, "matched_keywords": ["..."], '
        '"missing_keywords": ["..."], "tailored_summary": "...", '
        '"suggestions": ["...", "..."]}'
    )
    user_prompt = (
        f"Candidate target role: {resume.target_role or 'not specified'}\n"
        f"Candidate skills: {', '.join(skills_flat) or 'not specified'}\n"
        f"Candidate current summary: {resume.summary or 'none'}\n"
        f"Candidate experience: "
        + "; ".join(f"{e.title} at {e.company}" for e in resume.experience or [])
        + "\n\n"
        f"Job description:\n{payload.job_description}\n\n"
        "Analyze fit and produce a tailored 2-3 sentence summary optimized "
        "for this specific job description."
    )

    try:
        result = chat_completion_json(system_prompt, user_prompt, max_tokens=700)
    except SarvamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        return TailorToJDResponse(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Sarvam response didn't match expected shape: {result}"
        ) from exc
