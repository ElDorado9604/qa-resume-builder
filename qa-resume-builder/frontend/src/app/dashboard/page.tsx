import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewResumeButton from "@/components/NewResumeButton";
import type { ResumeSummaryRow } from "@/types/resume";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, target_role, updated_at")
    .order("updated_at", { ascending: false })
    .returns<ResumeSummaryRow[]>();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Resumes</h1>
        <NewResumeButton />
      </div>

      {(!resumes || resumes.length === 0) && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No resumes yet. Create your first one to get started.
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumes?.map((resume) => (
          <li key={resume.id}>
            <Link
              href={`/resume/${resume.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:shadow-md"
            >
              <h2 className="mb-1 font-semibold text-gray-900">
                {resume.title}
              </h2>
              <p className="mb-3 text-sm text-brand-600">
                {resume.target_role ?? "No target role set"}
              </p>
              <p className="text-xs text-gray-400">
                Updated {new Date(resume.updated_at).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
