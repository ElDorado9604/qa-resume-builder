"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextArea, TagInput } from "@/components/FormFields";
import type {
  ResumeData,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
  TargetRole,
} from "@/types/resume";

const TARGET_ROLES: TargetRole[] = [
  "QA Engineer",
  "Automation Engineer",
  "SDET",
  "Test Engineer",
];

const emptyExperience: ExperienceEntry = {
  company: "",
  title: "",
  duration: "",
  tech_stack: [],
  responsibilities: "",
  metrics: "",
};

const emptyProject: ProjectEntry = {
  name: "",
  stack: "",
  description: "",
  impact: "",
};

const emptyEducation: EducationEntry = {
  degree: "",
  institution: "",
  year: "",
};

export default function ResumeEditor({
  resumeId,
  initialData,
  initialVersion,
}: {
  resumeId: string;
  initialData: ResumeData;
  initialVersion: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<ResumeData>(initialData);
  const [version, setVersion] = useState(initialVersion);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    try {
      const nextVersion = version + 1;

      const { error: resumeErr } = await supabase
        .from("resumes")
        .update({ title: data.name || "Untitled Resume", target_role: data.target_role })
        .eq("id", resumeId);
      if (resumeErr) throw resumeErr;

      const { error: versionErr } = await supabase.from("resume_versions").insert({
        resume_id: resumeId,
        version: nextVersion,
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        projects: data.projects,
        education: data.education,
        certifications: data.certifications,
      });
      if (versionErr) throw versionErr;

      setVersion(nextVersion);
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/export-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name.replace(/\s+/g, "_") || "Resume"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export resume");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Resume</h1>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-gray-400">Saved at {savedAt}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Download Word"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Basic info */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Basic Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={data.name} onChange={(v) => update("name", v)} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Target Role
              </span>
              <select
                value={data.target_role}
                onChange={(e) => update("target_role", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Email"
              value={data.contact.email ?? ""}
              onChange={(v) => update("contact", { ...data.contact, email: v })}
            />
            <Field
              label="Phone"
              value={data.contact.phone ?? ""}
              onChange={(v) => update("contact", { ...data.contact, phone: v })}
            />
            <Field
              label="Location"
              value={data.contact.location ?? ""}
              onChange={(v) => update("contact", { ...data.contact, location: v })}
            />
            <Field
              label="LinkedIn"
              value={data.contact.linkedin ?? ""}
              onChange={(v) => update("contact", { ...data.contact, linkedin: v })}
            />
            <Field
              label="GitHub"
              value={data.contact.github ?? ""}
              onChange={(v) => update("contact", { ...data.contact, github: v })}
            />
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Professional Summary</h2>
          <TextArea
            label="Summary"
            value={data.summary ?? ""}
            onChange={(v) => update("summary", v)}
            placeholder="2-3 sentence summary highlighting your QA/automation experience"
          />
        </section>

        {/* Skills */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Skills</h2>
          <div className="space-y-4">
            <TagInput
              label="Automation"
              values={data.skills.automation}
              onChange={(v) => update("skills", { ...data.skills, automation: v })}
              placeholder="e.g. Selenium, Playwright, Cypress"
            />
            <TagInput
              label="API"
              values={data.skills.api}
              onChange={(v) => update("skills", { ...data.skills, api: v })}
              placeholder="e.g. REST Assured, Postman"
            />
            <TagInput
              label="CI/CD"
              values={data.skills.ci_cd}
              onChange={(v) => update("skills", { ...data.skills, ci_cd: v })}
              placeholder="e.g. Jenkins, GitHub Actions"
            />
            <TagInput
              label="Languages"
              values={data.skills.languages}
              onChange={(v) => update("skills", { ...data.skills, languages: v })}
              placeholder="e.g. Java, Python, C#"
            />
            <TagInput
              label="Tools"
              values={data.skills.tools}
              onChange={(v) => update("skills", { ...data.skills, tools: v })}
              placeholder="e.g. JIRA, TestRail, Git"
            />
          </div>
        </section>

        {/* Experience */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Experience</h2>
            <button
              type="button"
              onClick={() => update("experience", [...data.experience, { ...emptyExperience }])}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Add entry
            </button>
          </div>
          <div className="space-y-6">
            {data.experience.map((exp, i) => (
              <div key={i} className="rounded-md border border-gray-100 p-4">
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Company"
                    value={exp.company}
                    onChange={(v) => {
                      const next = [...data.experience];
                      next[i] = { ...exp, company: v };
                      update("experience", next);
                    }}
                  />
                  <Field
                    label="Title"
                    value={exp.title}
                    onChange={(v) => {
                      const next = [...data.experience];
                      next[i] = { ...exp, title: v };
                      update("experience", next);
                    }}
                  />
                  <Field
                    label="Duration"
                    value={exp.duration ?? ""}
                    onChange={(v) => {
                      const next = [...data.experience];
                      next[i] = { ...exp, duration: v };
                      update("experience", next);
                    }}
                    placeholder="e.g. Jan 2021 - Present"
                  />
                  <Field
                    label="Metrics / Impact"
                    value={exp.metrics ?? ""}
                    onChange={(v) => {
                      const next = [...data.experience];
                      next[i] = { ...exp, metrics: v };
                      update("experience", next);
                    }}
                    placeholder="e.g. Cut regression time by 40%"
                  />
                </div>
                <div className="mb-3">
                  <TagInput
                    label="Tech Stack"
                    values={exp.tech_stack}
                    onChange={(v) => {
                      const next = [...data.experience];
                      next[i] = { ...exp, tech_stack: v };
                      update("experience", next);
                    }}
                  />
                </div>
                <TextArea
                  label="Responsibilities (one per line)"
                  value={exp.responsibilities ?? ""}
                  onChange={(v) => {
                    const next = [...data.experience];
                    next[i] = { ...exp, responsibilities: v };
                    update("experience", next);
                  }}
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "experience",
                      data.experience.filter((_, idx) => idx !== i)
                    )
                  }
                  className="mt-3 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove entry
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Projects</h2>
            <button
              type="button"
              onClick={() => update("projects", [...data.projects, { ...emptyProject }])}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Add project
            </button>
          </div>
          <div className="space-y-6">
            {data.projects.map((proj, i) => (
              <div key={i} className="rounded-md border border-gray-100 p-4">
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Name"
                    value={proj.name}
                    onChange={(v) => {
                      const next = [...data.projects];
                      next[i] = { ...proj, name: v };
                      update("projects", next);
                    }}
                  />
                  <Field
                    label="Stack"
                    value={proj.stack ?? ""}
                    onChange={(v) => {
                      const next = [...data.projects];
                      next[i] = { ...proj, stack: v };
                      update("projects", next);
                    }}
                  />
                </div>
                <div className="mb-3">
                  <TextArea
                    label="Description"
                    value={proj.description ?? ""}
                    onChange={(v) => {
                      const next = [...data.projects];
                      next[i] = { ...proj, description: v };
                      update("projects", next);
                    }}
                    rows={2}
                  />
                </div>
                <Field
                  label="Impact"
                  value={proj.impact ?? ""}
                  onChange={(v) => {
                    const next = [...data.projects];
                    next[i] = { ...proj, impact: v };
                    update("projects", next);
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "projects",
                      data.projects.filter((_, idx) => idx !== i)
                    )
                  }
                  className="mt-3 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove project
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Education</h2>
            <button
              type="button"
              onClick={() => update("education", [...data.education, { ...emptyEducation }])}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Add entry
            </button>
          </div>
          <div className="space-y-4">
            {data.education.map((edu, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-3">
                <Field
                  label="Degree"
                  value={edu.degree}
                  onChange={(v) => {
                    const next = [...data.education];
                    next[i] = { ...edu, degree: v };
                    update("education", next);
                  }}
                />
                <Field
                  label="Institution"
                  value={edu.institution}
                  onChange={(v) => {
                    const next = [...data.education];
                    next[i] = { ...edu, institution: v };
                    update("education", next);
                  }}
                />
                <Field
                  label="Year"
                  value={edu.year ?? ""}
                  onChange={(v) => {
                    const next = [...data.education];
                    next[i] = { ...edu, year: v };
                    update("education", next);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Certifications</h2>
          <TagInput
            label="Certifications"
            values={data.certifications}
            onChange={(v) => update("certifications", v)}
            placeholder="e.g. ISTQB Foundation"
          />
        </section>
      </div>
    </div>
  );
}
