export type TargetRole =
  | "QA Engineer"
  | "Automation Engineer"
  | "SDET"
  | "Test Engineer";

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

export interface SkillGroups {
  automation: string[];
  api: string[];
  ci_cd: string[];
  languages: string[];
  tools: string[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  duration?: string;
  tech_stack: string[];
  responsibilities?: string;
  metrics?: string;
}

export interface ProjectEntry {
  name: string;
  stack?: string;
  description?: string;
  impact?: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: string;
}

export interface ResumeData {
  name: string;
  target_role?: TargetRole | string;
  contact: ContactInfo;
  summary?: string;
  skills: SkillGroups;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: string[];
}

export interface ResumeSummaryRow {
  id: string;
  title: string;
  target_role: string | null;
  updated_at: string;
}

export const emptyResumeData: ResumeData = {
  name: "",
  target_role: "QA Engineer",
  contact: {},
  summary: "",
  skills: { automation: [], api: [], ci_cd: [], languages: [], tools: [] },
  experience: [],
  projects: [],
  education: [],
  certifications: [],
};
