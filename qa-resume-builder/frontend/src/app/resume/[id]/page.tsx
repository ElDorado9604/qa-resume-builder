import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeEditor from "@/components/ResumeEditor";
import { emptyResumeData, type ResumeData } from "@/types/resume";

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, title, target_role")
    .eq("id", id)
    .single();

  if (!resume) {
    notFound();
  }

  const { data: version } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("resume_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialData: ResumeData = version
    ? {
        name: resume.title,
        target_role: resume.target_role ?? undefined,
        contact: {},
        summary: version.summary ?? "",
        skills: version.skills ?? emptyResumeData.skills,
        experience: version.experience ?? [],
        projects: version.projects ?? [],
        education: version.education ?? [],
        certifications: version.certifications ?? [],
      }
    : {
        ...emptyResumeData,
        name: resume.title,
        target_role: resume.target_role ?? "QA Engineer",
      };

  return (
    <ResumeEditor
      resumeId={resume.id}
      initialData={initialData}
      initialVersion={version?.version ?? 0}
    />
  );
}
