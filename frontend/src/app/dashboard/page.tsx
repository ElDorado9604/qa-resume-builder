import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewResumeButton from "@/components/NewResumeButton";
import type { ResumeSummaryRow } from "@/types/resume";
import { FileText } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, target_role, updated_at")
    .order("updated_at", { ascending: false })
    .returns<ResumeSummaryRow[]>();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Your resumes
        </h1>
        <NewResumeButton />
      </div>

      {(!resumes || resumes.length === 0) && (
        <div className="rounded-md border border-dashed border-line bg-panel px-6 py-14 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
          <p className="text-sm text-ink-soft">
            No resumes yet. Create one to get started.
          </p>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumes?.map((resume) => (
          <li key={resume.id}>
            <Link
              href={`/resume/${resume.id}`}
              className="block rounded-md border border-line bg-panel p-5 transition-colors hover:border-pass"
            >
              <h2 className="mb-1 font-medium text-ink">{resume.title}</h2>
              <p className="mb-4 font-mono text-xs text-pass">
                {resume.target_role ?? "no target role"}
              </p>
              <p className="font-mono text-xs text-ink-faint">
                updated {new Date(resume.updated_at).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
