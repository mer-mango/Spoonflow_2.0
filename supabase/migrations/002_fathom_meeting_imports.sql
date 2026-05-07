-- Fathom meeting transcript imports
create table if not exists public.fathom_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recording_id text not null,
  title text,
  meeting_title text,
  url text,
  share_url text,
  fathom_created_at timestamptz,
  scheduled_start_time timestamptz,
  scheduled_end_time timestamptz,
  recording_start_time timestamptz,
  recording_end_time timestamptz,
  transcript_language text,
  transcript jsonb,
  transcript_text text,
  summary_markdown text,
  action_items jsonb default '[]'::jsonb,
  calendar_invitees jsonb default '[]'::jsonb,
  recorded_by jsonb,
  crm_matches jsonb,
  raw_payload jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recording_id)
);

create index if not exists fathom_meetings_user_scheduled_idx
  on public.fathom_meetings (user_id, scheduled_start_time desc);

create index if not exists fathom_meetings_transcript_search_idx
  on public.fathom_meetings using gin (to_tsvector('english', coalesce(transcript_text, '') || ' ' || coalesce(summary_markdown, '')));

alter table public.fathom_meetings enable row level security;

drop policy if exists "Users can read their Fathom meetings" on public.fathom_meetings;
create policy "Users can read their Fathom meetings"
  on public.fathom_meetings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their Fathom meetings" on public.fathom_meetings;
create policy "Users can delete their Fathom meetings"
  on public.fathom_meetings for delete
  using (auth.uid() = user_id);
