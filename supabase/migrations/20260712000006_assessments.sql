-- Avaliação física (MVP reduzido: peso + PAR-Q+; V2 amplia) + restrições de lesão + auditoria

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  assessor_id uuid references public.profiles(id), -- null = autoavaliação
  assessed_at date not null default current_date,
  kind text not null check (kind in ('anthropometry', 'strength_test', 'readiness', 'parq')),
  protocol text, -- ex.: 'pollock_3', 'epley', 'parq_plus'
  notes text,
  created_at timestamptz not null default now()
);

-- EAV controlado por catálogo (chaves validadas na aplicação via domain schemas)
create table public.assessment_measures (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  measure_key text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  check (value_numeric is not null or value_text is not null)
);

create table public.injury_restrictions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  affected_pattern text check (affected_pattern in (
    'squat', 'hinge', 'push_h', 'push_v', 'pull_h', 'pull_v',
    'lunge', 'carry', 'core', 'isolation'
  )),
  region text,
  description text not null,
  origin text not null default 'self_report' check (origin in ('self_report', 'professional')),
  active_from date not null default current_date,
  active_until date,
  created_at timestamptz not null default now()
);

-- Contraindicações específicas por exercício
create table public.restriction_exercises (
  restriction_id uuid not null references public.injury_restrictions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  primary key (restriction_id, exercise_id)
);

-- Trilha de auditoria genérica
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Registro de gerações IA (V2, mas schema pronto — trilha obrigatória)
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  input jsonb not null, -- anamnese pseudonimizada (nunca dados identificados)
  output jsonb,
  model text,
  cost_usd numeric,
  plan_id uuid references public.training_plans(id),
  reviewed_by uuid references public.profiles(id),
  approved_at timestamptz,
  review_diff jsonb,
  created_at timestamptz not null default now()
);

create index on public.assessments (org_id, client_id);
create index on public.assessment_measures (assessment_id);
create index on public.injury_restrictions (client_id);
create index on public.audit_logs (org_id, created_at desc);
create index on public.ai_generations (org_id);
