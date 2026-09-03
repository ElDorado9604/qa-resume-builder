-- QA Resume Builder - Supabase schema + RLS policies
-- Already applied to the connected Supabase project (gxgnujmlymzrvamxqxxx).
-- Kept here for reference / re-applying to a fresh project if needed.

-- Enable pgcrypto for gen_random_uuid() if not already enabled
create extension if not exists "pgcrypto";

-- ============================================================
-- Table: resumes
-- ============================================================
create table if not exists public.resumes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default 'Untitled Resume',
    target_role text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes(user_id);

alter table public.resumes enable row level security;

create policy "Users can select their own resumes"
    on public.resumes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
    on public.resumes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own resumes"
    on public.resumes for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
    on public.resumes for delete
    using (auth.uid() = user_id);

-- ============================================================
-- Table: resume_versions
-- ============================================================
create table if not exists public.resume_versions (
    id uuid primary key default gen_random_uuid(),
    resume_id uuid not null references public.resumes(id) on delete cascade,
    version int not null default 1,
    summary text,
    skills jsonb not null default '{}'::jsonb,
    experience jsonb not null default '[]'::jsonb,
    projects jsonb not null default '[]'::jsonb,
    education jsonb not null default '[]'::jsonb,
    certifications jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists resume_versions_resume_id_idx on public.resume_versions(resume_id);

alter table public.resume_versions enable row level security;

create policy "Users can select their own resume versions"
    on public.resume_versions for select
    using (
        exists (
            select 1 from public.resumes r
            where r.id = resume_versions.resume_id
              and r.user_id = auth.uid()
        )
    );

create policy "Users can insert their own resume versions"
    on public.resume_versions for insert
    with check (
        exists (
            select 1 from public.resumes r
            where r.id = resume_versions.resume_id
              and r.user_id = auth.uid()
        )
    );

create policy "Users can update their own resume versions"
    on public.resume_versions for update
    using (
        exists (
            select 1 from public.resumes r
            where r.id = resume_versions.resume_id
              and r.user_id = auth.uid()
        )
    );

create policy "Users can delete their own resume versions"
    on public.resume_versions for delete
    using (
        exists (
            select 1 from public.resumes r
            where r.id = resume_versions.resume_id
              and r.user_id = auth.uid()
        )
    );

-- ============================================================
-- Trigger: auto-update updated_at on resumes
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_resumes_updated_at on public.resumes;
create trigger trg_resumes_updated_at
    before update on public.resumes
    for each row
    execute function public.set_updated_at();
