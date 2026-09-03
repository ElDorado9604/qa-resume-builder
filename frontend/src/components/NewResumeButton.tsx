"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewResumeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title: "Untitled Resume",
        target_role: "QA Engineer",
      })
      .select("id")
      .single();

    setLoading(false);

    if (!error && data) {
      router.push(`/resume/${data.id}`);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="rounded-lg bg-brand-500 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
    >
      {loading ? "Creating…" : "+ Create new resume"}
    </button>
  );
}
