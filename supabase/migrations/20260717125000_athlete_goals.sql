-- Metas do atleta: intenção do usuário (peso-alvo por exercício ou frequência semanal).
-- Ao contrário de score/XP/badges (Fase 2), uma meta não é derivável do histórico — precisa persistir.

create table public.athlete_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('exercise_1rm', 'weekly_frequency')),
  exercise_id uuid references public.exercises(id) on delete cascade,
  target_value numeric not null check (target_value > 0),
  created_at timestamptz not null default now(),
  constraint athlete_goals_exercise_required check (
    (kind = 'exercise_1rm' and exercise_id is not null)
    or (kind = 'weekly_frequency' and exercise_id is null)
  )
);

alter table public.athlete_goals enable row level security;

create policy "user manages own goals"
  on public.athlete_goals for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
