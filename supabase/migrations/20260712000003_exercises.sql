-- Banco de exercícios: globais (org_id null, importados/curados) + custom por org

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade, -- null = global
  name text not null,
  movement_pattern text not null check (movement_pattern in (
    'squat', 'hinge', 'push_h', 'push_v', 'pull_h', 'pull_v',
    'lunge', 'carry', 'core', 'isolation'
  )),
  primary_muscles text[] not null,
  secondary_muscles text[] not null default '{}',
  load_type text not null check (load_type in (
    'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'kettlebell', 'time'
  )),
  unilateral boolean not null default false,
  instructions text,
  media_url text,
  source text not null default 'custom' check (source in ('wger', 'custom')),
  external_id text,
  created_at timestamptz not null default now()
);

create table public.exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  alias text not null
);

create table public.exercise_substitutions (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  substitute_id uuid not null references public.exercises(id) on delete cascade,
  reason text,
  primary key (exercise_id, substitute_id)
);

create index on public.exercises (org_id);
create index on public.exercises (movement_pattern);
create index on public.exercises using gin (to_tsvector('portuguese', name));
create index on public.exercise_aliases (exercise_id);
create unique index exercises_external_unique on public.exercises (source, external_id)
  where external_id is not null and org_id is null;
