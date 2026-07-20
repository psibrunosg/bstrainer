-- Activity/circuit blocks (ADR-0001, ADR-0002): sibling tables per block kind,
-- posição não é única entre kinds no mesmo workout — app monta a ordem combinada.

-- Mobilidade fica dentro de Exercise (glossário domain/CONTEXT.md), não vira Activity.
alter table public.exercises drop constraint exercises_movement_pattern_check;
alter table public.exercises add constraint exercises_movement_pattern_check check (movement_pattern in (
  'squat', 'hinge', 'push_h', 'push_v', 'pull_h', 'pull_v',
  'lunge', 'carry', 'core', 'isolation', 'mobility'
));

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade, -- null = global
  name text not null,
  type text not null check (type in ('running', 'cycling', 'swimming', 'rowing', 'walking', 'elliptical')),
  instructions text,
  media_url text,
  created_at timestamptz not null default now()
);

create index on public.activities (org_id);
create index on public.activities (type);

-- Prescrito: esforço contínuo (corrida, bike Z2) --------------------------------

create table public.prescribed_activities (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  position integer not null,
  duration_seconds integer check (duration_seconds >= 1),
  distance_km numeric check (distance_km >= 0),
  target_pace_min_per_km numeric check (target_pace_min_per_km >= 0),
  target_rpe numeric check (target_rpe between 1 and 10),
  notes text,
  unique (workout_template_id, position)
);

-- Prescrito: circuito por rounds (HIIT) -----------------------------------------

create table public.prescribed_circuits (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  position integer not null,
  rounds integer not null check (rounds >= 1),
  work_seconds integer not null check (work_seconds >= 1),
  rest_seconds integer not null check (rest_seconds >= 0),
  target_rpe numeric check (target_rpe between 1 and 10),
  notes text,
  unique (workout_template_id, position)
);

create table public.prescribed_circuit_exercises (
  circuit_id uuid not null references public.prescribed_circuits(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null,
  primary key (circuit_id, exercise_id)
);

-- Executado: espelha o prescrito, sem HR/frequência cardíaca na v1 -------------

create table public.performed_activities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  prescribed_activity_id uuid references public.prescribed_activities(id),
  position integer not null,
  duration_seconds integer check (duration_seconds >= 0),
  distance_km numeric check (distance_km >= 0),
  avg_pace_min_per_km numeric check (avg_pace_min_per_km >= 0),
  rpe numeric check (rpe between 1 and 10),
  logged_at timestamptz not null default now(),
  unique (session_id, position)
);

create table public.performed_circuits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  prescribed_circuit_id uuid references public.prescribed_circuits(id),
  position integer not null,
  rounds_completed integer not null check (rounds_completed >= 0),
  rpe numeric check (rpe between 1 and 10),
  logged_at timestamptz not null default now(),
  unique (session_id, position)
);

create index on public.prescribed_activities (workout_template_id);
create index on public.prescribed_circuits (workout_template_id);
create index on public.prescribed_circuit_exercises (circuit_id);
create index on public.performed_activities (session_id);
create index on public.performed_activities (activity_id);
create index on public.performed_circuits (session_id);

-- Seed do catálogo global de activities (org_id null), um por tipo -------------

insert into public.activities (org_id, name, type) values
  (null, 'Corrida', 'running'),
  (null, 'Ciclismo', 'cycling'),
  (null, 'Natação', 'swimming'),
  (null, 'Remo', 'rowing'),
  (null, 'Caminhada', 'walking'),
  (null, 'Elíptico', 'elliptical');

-- RLS -----------------------------------------------------------------------------
-- Mesmo padrão de prescribed_exercises/performed_exercises em 20260712000007_rls.sql

alter table public.activities enable row level security;
alter table public.prescribed_activities enable row level security;
alter table public.prescribed_circuits enable row level security;
alter table public.prescribed_circuit_exercises enable row level security;
alter table public.performed_activities enable row level security;
alter table public.performed_circuits enable row level security;

create policy "read global and org activities" on public.activities
  for select using (org_id is null or public.is_org_member(org_id));

create policy "staff manages org activities" on public.activities
  for all using (org_id is not null and public.is_org_staff(org_id))
  with check (org_id is not null and public.is_org_staff(org_id));

create policy "prescribed activities read" on public.prescribed_activities
  for select using (
    exists (select 1 from public.workout_templates w
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where w.id = workout_template_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "prescribed activities write" on public.prescribed_activities
  for all using (
    exists (select 1 from public.workout_templates w
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where w.id = workout_template_id and public.is_org_staff(p.org_id))
  );

create policy "prescribed circuits read" on public.prescribed_circuits
  for select using (
    exists (select 1 from public.workout_templates w
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where w.id = workout_template_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "prescribed circuits write" on public.prescribed_circuits
  for all using (
    exists (select 1 from public.workout_templates w
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where w.id = workout_template_id and public.is_org_staff(p.org_id))
  );

create policy "prescribed circuit exercises access" on public.prescribed_circuit_exercises
  for all using (
    exists (select 1 from public.prescribed_circuits c
            join public.workout_templates w on w.id = c.workout_template_id
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where c.id = circuit_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "performed activities access" on public.performed_activities
  for all using (
    exists (select 1 from public.workout_sessions s where s.id = session_id
            and (s.client_id = auth.uid() or public.is_org_staff(s.org_id)))
  ) with check (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.client_id = auth.uid())
  );

create policy "performed circuits access" on public.performed_circuits
  for all using (
    exists (select 1 from public.workout_sessions s where s.id = session_id
            and (s.client_id = auth.uid() or public.is_org_staff(s.org_id)))
  ) with check (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.client_id = auth.uid())
  );
