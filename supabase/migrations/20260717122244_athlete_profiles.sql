-- Perfil de atleta: dados físicos e preferências de treino, 1 por usuário.
-- Ausência de linha = usuário ainda não passou pelo wizard de onboarding.

create table public.athlete_profiles (
  profile_id uuid primary key references auth.users(id) on delete cascade,
  sex text check (sex in ('male', 'female', 'other')),
  birth_date date,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  -- goal deve espelhar exatamente trainingGoalSchema em packages/domain/src/plan.ts
  goal text not null check (goal in ('hypertrophy', 'strength', 'power', 'endurance', 'health', 'fat_loss')),
  training_location text not null default 'gym' check (training_location in ('home', 'outdoor', 'gym')),
  days_per_week smallint not null default 3 check (days_per_week between 1 and 7),
  equipment text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger athlete_profiles_updated_at before update on public.athlete_profiles
  for each row execute function public.set_updated_at();

alter table public.athlete_profiles enable row level security;

create policy "user manages own athlete profile"
  on public.athlete_profiles for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
