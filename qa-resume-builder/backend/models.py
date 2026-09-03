"""
Pydantic request/response models for the QA Resume Builder API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None


class SkillGroups(BaseModel):
    automation: List[str] = Field(default_factory=list)
    api: List[str] = Field(default_factory=list)
    ci_cd: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)


class ExperienceEntry(BaseModel):
    company: str
    title: str
    duration: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    responsibilities: Optional[str] = None
    metrics: Optional[str] = None


class ProjectEntry(BaseModel):
    name: str
    stack: Optional[str] = None
    description: Optional[str] = None
    impact: Optional[str] = None


class EducationEntry(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None


class ResumeExportRequest(BaseModel):
    name: str
    target_role: Optional[str] = None
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: Optional[str] = None
    skills: SkillGroups = Field(default_factory=SkillGroups)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
