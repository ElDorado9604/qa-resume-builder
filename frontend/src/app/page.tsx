import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-3xl font-bold text-brand-700">
          QA Resume Builder
        </h1>
        <p className="mb-8 text-gray-600">
          Build ATS-optimized resumes for QA Engineer, Automation Engineer,
          SDET, and Test Engineer roles — exported straight to Word.
        </p>
        <GoogleSignInButton />
      </div>
    </main>
  );
}
