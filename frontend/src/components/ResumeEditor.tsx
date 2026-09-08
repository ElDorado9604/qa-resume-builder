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
  SkillGroups,
} from "@/types/resume";
import {
  Save,
  Download,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  CircleDashed,
  Check,
} from "lucide-react";

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

// Heuristic keyword -> skill-category mapping, so a missing JD keyword
// lands in the right bucket instead of a single junk-drawer list.
const CATEGORY_HINTS: Record<keyof SkillGroups, string[]> = {
  automation: [
    "selenium", "playwright", "cypress", "testng", "junit", "pytest",
    "cucumber", "pom", "page object", "appium", "webdriver", "robot framework",
  ],
  api: ["rest assured", "postman", "soapui", "contract testing", "graphql", "api"],
  ci_cd: [
    "jenkins", "github actions", "gitlab ci", "azure devops", "docker",
    "kubernetes", "ci/cd", "circleci", "travis",
  ],
  languages: ["java", "python", "typescript", "javascript", "c#", "sql", "go", "ruby"],
  tools: [],
};

function categorizeSkill(keyword: string): keyof SkillGroups {
  const lower = keyword.toLowerCase();
  for (const [category, hints] of Object.entries(CATEGORY_HINTS) as [
    keyof SkillGroups,
    string[],
  ][]) {
    if (hints.some((hint) => lower.includes(hint))) return category;
  }
  return "tools";
}

function skillExists(skills: SkillGroups, keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return Object.values(skills).some((list) =>
    list.some((s: string) => s.toLowerCase() === lower)
  );
}

function SectionStatus({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="flex items-center gap-1 font-mono text-xs text-pass">
      <CheckCircle2 key="done" className="h-3.5 w-3.5 animate-check-in" />
      complete
    </span>
  ) : (
    <span className="flex items-center gap-1 font-mono text-xs text-ink-faint">
      <CircleDashed className="h-3.5 w-3.5" />
      empty
    </span>
  );
}

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
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingBulletsFor, setGeneratingBulletsFor] = useState<number | null>(
    null
  );
  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<{
    match_score: number;
    matched_keywords: string[];
    missing_keywords: string[];
    tailored_summary: string;
    suggestions: string[];
  } | null>(null);
  const [showTailorPanel, setShowTailorPanel] = useState(false);
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/generate-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: data.target_role,
          skills: data.skills,
          experience: data.experience,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "Failed to generate summary");
      }
      const result = await res.json();
      update("summary", result.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateBullets = async (index: number) => {
    const exp = data.experience[index];
    if (!exp.responsibilities?.trim()) {
      setError("Add some rough notes in Responsibilities first.");
      return;
    }
    setGeneratingBulletsFor(index);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/generate-bullets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: exp.company,
          title: exp.title,
          tech_stack: exp.tech_stack,
          raw_notes: exp.responsibilities,
          num_bullets: 4,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "Failed to generate bullets");
      }
      const result = await res.json();
      const next = [...data.experience];
      next[index] = {
        ...exp,
        responsibilities: (result.bullets as string[]).join("\n"),
      };
      update("experience", next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate bullets");
    } finally {
      setGeneratingBulletsFor(null);
    }
  };

  const handleTailorToJD = async () => {
    if (!jobDescription.trim()) {
      setError("Paste a job description first.");
      return;
    }
    setTailoring(true);
    setError(null);
    setTailorResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/tailor-to-jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: data,
          job_description: jobDescription,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "Failed to analyze job description");
      }
      const result = await res.json();
      setTailorResult(result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to analyze job description"
      );
    } finally {
      setTailoring(false);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    if (skillExists(data.skills, keyword)) {
      setAddedKeywords((prev) => new Set(prev).add(keyword));
      return;
    }
    const category = categorizeSkill(keyword);
    update("skills", {
      ...data.skills,
      [category]: [...data.skills[category], keyword],
    });
    setAddedKeywords((prev) => new Set(prev).add(keyword));
  };

  const handleAddAllKeywords = () => {
    if (!tailorResult) return;
    tailorResult.missing_keywords.forEach(handleAddKeyword);
  };

  const scoreColor = (score: number) =>
    score >= 70 ? "bg-pass" : score >= 40 ? "bg-signal" : "bg-fail";

  const skillsFilled = Object.values(data.skills).some((list) => list.length > 0);

  return (
    <div className="pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Edit resume
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {savedAt && (
            <span className="font-mono text-xs text-ink-faint">
              saved {savedAt}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-pass disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-md bg-pass px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-pass-strong disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Word
          </button>
          <button
            onClick={() => setShowTailorPanel((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-signal"
          >
            <Sparkles className="h-4 w-4 text-signal" />
            Tailor to JD
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-fail/30 bg-fail-soft px-4 py-2.5 text-sm text-fail">
          {error}
        </div>
      )}

      {showTailorPanel && (
        <div className="mb-8 rounded-lg border border-signal/30 bg-signal-soft p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-signal" />
            Tailor to a job description
          </h2>
          <TextArea
            label="Paste the job description"
            value={jobDescription}
            onChange={setJobDescription}
            rows={5}
            placeholder="Paste the full job posting here..."
          />
          <button
            type="button"
            onClick={handleTailorToJD}
            disabled={tailoring}
            className="mt-3 flex items-center gap-1.5 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-signal-strong disabled:opacity-60"
          >
            {tailoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Analyze fit
          </button>

          {tailorResult && (
            <div className="mt-5 space-y-5 rounded-md border border-line bg-panel p-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">
                    Match score
                  </span>
                  <span className="font-mono text-sm text-ink-soft">
                    {tailorResult.match_score}/100
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full transition-all ${scoreColor(
                      tailorResult.match_score
                    )}`}
                    style={{ width: `${tailorResult.match_score}%` }}
                  />
                </div>
              </div>

              {tailorResult.matched_keywords.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">
                    Matched keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tailorResult.matched_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded border border-pass/30 bg-pass-soft px-2 py-1 font-mono text-xs text-pass-strong"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tailorResult.missing_keywords.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">
                      Missing keywords
                    </p>
                    <button
                      type="button"
                      onClick={handleAddAllKeywords}
                      className="text-xs font-medium text-signal hover:text-signal-strong"
                    >
                      Add all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tailorResult.missing_keywords.map((kw) => {
                      const added =
                        addedKeywords.has(kw) || skillExists(data.skills, kw);
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => handleAddKeyword(kw)}
                          disabled={added}
                          className={`flex items-center gap-1 rounded border px-2 py-1 font-mono text-xs transition-colors ${
                            added
                              ? "border-pass/30 bg-pass-soft text-pass-strong"
                              : "border-signal/30 bg-signal-soft text-signal-strong hover:bg-signal/20"
                          }`}
                        >
                          {added ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {kw}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    Tailored summary suggestion
                  </p>
                  <button
                    type="button"
                    onClick={() => update("summary", tailorResult.tailored_summary)}
                    className="text-xs font-medium text-signal hover:text-signal-strong"
                  >
                    Use this summary
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {tailorResult.tailored_summary}
                </p>
              </div>

              {tailorResult.suggestions.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-ink">
                    Suggestions
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-ink-soft">
                    {tailorResult.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic info */}
        <section className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Basic info
            </h2>
            <SectionStatus complete={!!data.name && !!data.contact.email} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={data.name} onChange={(v) => update("name", v)} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-soft">
                Target Role
              </span>
              <select
                value={data.target_role}
                onChange={(e) => update("target_role", e.target.value)}
                className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink focus:border-pass focus:outline-none focus:ring-1 focus:ring-pass"
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
        <section className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Professional summary
            </h2>
            <SectionStatus complete={!!data.summary?.trim()} />
          </div>
          <TextArea
            label="Summary"
            value={data.summary ?? ""}
            onChange={(v) => update("summary", v)}
            placeholder="2-3 sentence summary highlighting your QA/automation experience"
          />
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-signal hover:text-signal-strong disabled:opacity-60"
          >
            {generatingSummary ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AI generate
          </button>
        </section>

        {/* Skills */}
        <section className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Skills
            </h2>
            <SectionStatus complete={skillsFilled} />
          </div>
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
        <section className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Experience
              </h2>
              <SectionStatus complete={data.experience.length > 0} />
            </div>
            <button
              type="button"
              onClick={() => update("experience", [...data.experience, { ...emptyExperience }])}
              className="flex items-center gap-1 text-sm font-medium text-pass hover:text-pass-strong"
            >
              <Plus className="h-3.5 w-3.5" />
              Add entry
            </button>
          </div>
          <div className="space-y-6">
            {data.experience.map((exp, i) => (
              <div key={i} className="rounded-md border border-line p-4">
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
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleGenerateBullets(i)}
                    disabled={generatingBulletsFor === i}
                    className="flex items-center gap-1.5 text-xs font-medium text-signal hover:text-signal-strong disabled:opacity-60"
                  >
                    {generatingBulletsFor === i ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI polish into bullets
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "experience",
                        data.experience.filter((_, idx) => idx !== i)
                      )
                    }
                    className="flex items-center gap-1 text-xs font-medium text-fail hover:text-fail/80"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Projects
            </h2>
            <button
              type="button"
              onClick={() => update("projects", [...data.projects, { ...emptyProject }])}
              className="flex items-center gap-1 text-sm font-medium text-pass hover:text-pass-strong"
            >
              <Plus className="h-3.5 w-3.5" />
              Add project
            </button>
          </div>
          <div className="space-y-6">
            {data.projects.map((proj, i) => (
              <div key={i} className="rounded-md border border-line p-4">
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
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-fail hover:text-fail/80"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Education
              </h2>
              <SectionStatus complete={data.education.length > 0} />
            </div>
            <button
              type="button"
              onClick={() => update("education", [...data.education, { ...emptyEducation }])}
              className="flex items-center gap-1 text-sm font-medium text-pass hover:text-pass-strong"
            >
              <Plus className="h-3.5 w-3.5" />
              Add entry
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
        <section className="rounded-lg border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">
            Certifications
          </h2>
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
