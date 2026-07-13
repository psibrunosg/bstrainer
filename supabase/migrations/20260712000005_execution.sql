-- Execução: workout_sessions -> performed_exercises -> performed_sets
-- Nunca a mesma tabela do planejado. e1RM/tonelagem derivados em views, nunca armazenados.

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  workout_template_id uuid references public.workout_templates(id), -- null = treino livre
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'skipped', 'partial')),
  session_rpe numeric check (session_rpe between 0 and 10),
  readiness_sleep integer check (readiness_sleep between 1 and 5),
  readiness_soreness integer check (readiness_soreness between 1 and 5),
  readiness_energy integer check (readiness_energy between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table public.performed_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  prescribed_exercise_id uuid references public.prescribed_exercises(id),
  position integer not null,
  was_substituted boolean not null default false,
  unique (session_id, position)
);

create table public.performed_sets (
  id uuid primary key default gen_random_uuid(),
  performed_exercise_id uuid not null references public.performed_exercises(id) on delete cascade,
  position integer not null,
  reps integer not null check (reps >= 0),
  load_kg numeric check (load_kg >= 0),
  rpe numeric check (rpe between 1 and 10),
  rir integer check (rir between 0 and 10),
  is_failure boolean not null default false,
  is_warmup boolean not null default false,
  time_seconds integer check (time_seconds >= 0),
  notes text,
  logged_at timestamptz not null default now(),
  unique (performed_exercise_id, position)
);

create index on public.workout_sessions (org_id);
create index on public.workout_sessions (client_id, started_at desc);
create index on public.performed_exercises (session_id);
create index on public.performed_exercises (exercise_id);
create index on public.performed_sets (performed_exercise_id);
