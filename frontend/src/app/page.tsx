import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { CheckCircle2, CircleDashed } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const checks = [
    { label: "Contact info", done: true },
    { label: "Professional summary", done: true },
    { label: "Skills coverage", done: false },
    { label: "Experience bullets", done: true },
    { label: "Education", done: true },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 md:grid-cols-2">
        {/* Left: pitch + sign in */}
        <div className="flex flex-col justify-center px-8 py-16 md:px-14">
          <span className="font-mono text-xs tracking-wide text-ink-faint">
            qa-resume-builder / v1.0
          </span>
          <h1 className="mt-3 max-w-md font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Ship a resume that passes every check.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-soft">
            Built for QA Engineers, Automation Engineers, SDETs, and Test
            Engineers. Fill in your experience, and export a clean,
            ATS-ready Word document.
          </p>

          <div className="mt-8 max-w-xs">
            <GoogleSignInButton />
          </div>

          <p className="mt-4 text-sm text-ink-faint">
            No passwords. Sign in with the Google account you already use.
          </p>
        </div>

        {/* Right: hero — the one bold element */}
        <div className="grid-texture hidden items-center justify-center border-l border-line bg-white/40 md:flex">
          <div className="w-full max-w-sm animate-panel-in rounded-lg border border-line bg-panel p-6 shadow-[0_1px_0_0_rgba(18,21,27,0.04)]">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-xs text-ink-faint">
                resume.test
              </span>
              <span className="font-mono text-xs text-pass">
                4/5 checks
              </span>
            </div>
            <ul className="space-y-3">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-center gap-2.5 text-sm"
                >
                  {check.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-pass" />
                  ) : (
                    <CircleDashed className="h-4 w-4 shrink-0 text-signal" />
                  )}
                  <span className={check.done ? "text-ink" : "text-ink-soft"}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-line pt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full w-4/5 rounded-full bg-pass" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
