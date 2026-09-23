create table if not exists public.ai_predictions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete cascade,
  conversation_id text,
  openai_response_id text,

  prediction_type text not null default 'start_sit',

  season integer not null,
  week integer not null,
  scoring_format text,

  candidates jsonb not null default '[]'::jsonb,

  recommended_player_id text,
  recommended_player_name text not null,

  obvious_choice_player_id text,
  obvious_choice_player_name text,

  is_contrarian boolean not null default false,

  confidence numeric(4, 2)
    check (confidence is null or confidence between 0 and 10),

  reasoning_summary text,
  sources jsonb not null default '[]'::jsonb,

  kickoff_at timestamptz,
  predicted_at timestamptz not null default now(),

  status text not null default 'pending'
    check (status in ('pending', 'graded', 'void')),

  actual_results jsonb,
  correct boolean,
  graded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_predictions enable row level security;

create policy "Users can view their own AI predictions"
on public.ai_predictions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own AI predictions"
on public.ai_predictions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own AI predictions"
on public.ai_predictions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);