-- Planejamento: training_plans -> mesocycles -> workout_templates -> prescribed_exercises -> prescribed_sets
-- Regra: prescribed_* é imutável após ativação do plano (versionar, não editar in-place).

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  goal text not null check (goal in ('hypertrophy', 'strength', 'power', 'endurance', 'health', 'fat_loss')),
  engine text not null default 'assisted' check (engine in ('template', 'assisted', 'ai')),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  start_date date not null,
  end_date date,
  source_template_id uuid, -- plan_templates, quando instanciado da biblioteca
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mesocycles (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  position integer not null,
  weeks integer not null check (weeks between 1 and 12),
  emphasis text not null check (emphasis in ('hypertrophy', 'strength', 'power', 'deload', 'intro')),
  progression_model text not null check (progression_model in ('linear', 'double_progression', 'undulating', 'step_loading')),
  includes_deload boolean not null default false,
  notes text,
  unique (plan_id, position)
);

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  mesocycle_id uuid not null references public.mesocycles(id) on delete cascade,
  name text not null,
  suggested_weekday integer check (suggested_weekday between 0 and 6),
  position integer not null,
  unique (mesocycle_id, position)
);

create table public.prescribed_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null,
  technique text not null default 'straight' check (technique in ('straight', 'superset', 'dropset', 'rest_pause', 'cluster')),
  superset_group integer,
  notes text,
  unique (workout_template_id, position)
);

create table public.prescribed_sets (
  id uuid primary key default gen_random_uuid(),
  prescribed_exercise_id uuid not null references public.prescribed_exercises(id) on delete cascade,
  position integer not null,
  reps_min integer not null check (reps_min >= 1),
  reps_max integer not null check (reps_max >= 1),
  load_method text not null check (load_method in ('percent_1rm', 'rpe', 'rir', 'absolute', 'bodyweight')),
  load_value numeric,
  target_rpe numeric check (target_rpe between 1 and 10),
  target_rir integer check (target_rir between 0 and 10),
  rest_seconds integer not null default 90 check (rest_seconds >= 0),
  is_warmup boolean not null default false,
  is_amrap boolean not null default false,
  unique (prescribed_exercise_id, position),
  check (reps_max >= reps_min)
);

-- Biblioteca de templates reutilizáveis (Tier 1 + "salvar como modelo" do personal)
create table public.plan_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade, -- null = sistema
  name text not null,
  description text,
  goal text not null check (goal in ('hypertrophy', 'strength', 'power', 'endurance', 'health', 'fat_loss')),
  min_tier text not null default 'starter' check (min_tier in ('starter', 'pro', 'ai')),
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  days_per_week integer check (days_per_week between 1 and 7),
  tags text[] not null default '{}',
  structure jsonb not null, -- esqueleto: mesociclos com slots de padrão de movimento
  created_at timestamptz not null default now()
);

create index on public.training_plans (org_id);
create index on public.training_plans (client_id);
create index on public.mesocycles (plan_id);
create index on public.workout_templates (mesocycle_id);
create index on public.prescribed_exercises (workout_template_id);
create index on public.prescribed_sets (prescribed_exercise_id);
create index on public.plan_templates (org_id);

create trigger training_plans_updated_at before update on public.training_plans
  for each row execute function public.set_updated_at();
