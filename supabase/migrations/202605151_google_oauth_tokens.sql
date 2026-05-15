create table if not exists public.google_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'google',
  refresh_token text not null,
  scope text null,
  token_type text null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_oauth_tokens enable row level security;

-- No public RLS policies are added.
-- This table is intentionally accessed only through Supabase Edge Functions
-- using the service role key.

create or replace function public.set_google_oauth_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_google_oauth_tokens_updated_at
  on public.google_oauth_tokens;

create trigger set_google_oauth_tokens_updated_at
before update on public.google_oauth_tokens
for each row
execute function public.set_google_oauth_tokens_updated_at();
