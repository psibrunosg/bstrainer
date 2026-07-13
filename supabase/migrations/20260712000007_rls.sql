-- RLS: multi-tenant por org_id.
-- Regras: client só lê os próprios dados; trainer lê dados dos client_links ativos;
-- exercícios globais (org_id null) são somente-leitura para todos.

-- Helpers ------------------------------------------------------------------

create or replace function public.is_org_member(check_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where org_id = check_org and profile_id = auth.uid()
  );
$$;

create or replace function public.is_org_staff(check_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where org_id = check_org and profile_id = auth.uid()
      and role in ('owner', 'trainer', 'solo')
  );
$$;

-- Trainer tem vínculo ativo com este cliente?
create or replace function public.trains_client(check_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from client_links
    where trainer_id = auth.uid() and client_id = check_client and status = 'active'
  );
$$;

-- Profiles -------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "own profile all" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "trainer reads clients" on public.profiles
  for select using (public.trains_client(id));

-- Organizations / memberships / client_links ---------------------------------

alter table public.organizations enable row level security;

create policy "members read org" on public.organizations
  for select using (public.is_org_member(id));

create policy "owner manages org" on public.organizations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table public.memberships enable row level security;

create policy "members read memberships" on public.memberships
  for select using (public.is_org_member(org_id));

create policy "owner manages memberships" on public.memberships
  for all using (
    exists (select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid())
  );

alter table public.client_links enable row level security;

create policy "staff manages links" on public.client_links
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));

create policy "client reads own link" on public.client_links
  for select using (client_id = auth.uid());

-- Billing ---------------------------------------------------------------------

alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;

create policy "members read subscription" on public.subscriptions
  for select using (public.is_org_member(org_id));

create policy "members read entitlements" on public.entitlements
  for select using (public.is_org_member(org_id));

-- Escrita de billing só via service role (webhooks) — nenhuma policy de write.

-- Exercises ---------------------------------------------------------------------

alter table public.exercises enable row level security;
alter table public.exercise_aliases enable row level security;
alter table public.exercise_substitutions enable row level security;

create policy "read global and org exercises" on public.exercises
  for select using (org_id is null or public.is_org_member(org_id));

create policy "staff manages org exercises" on public.exercises
  for all using (org_id is not null and public.is_org_staff(org_id))
  with check (org_id is not null and public.is_org_staff(org_id));

create policy "read aliases" on public.exercise_aliases
  for select using (
    exists (select 1 from public.exercises e where e.id = exercise_id
            and (e.org_id is null or public.is_org_member(e.org_id)))
  );

create policy "staff manages aliases" on public.exercise_aliases
  for all using (
    exists (select 1 from public.exercises e where e.id = exercise_id
            and e.org_id is not null and public.is_org_staff(e.org_id))
  );

create policy "read substitutions" on public.exercise_substitutions
  for select using (
    exists (select 1 from public.exercises e where e.id = exercise_id
            and (e.org_id is null or public.is_org_member(e.org_id)))
  );

-- Planning ------------------------------------------------------------------------

alter table public.training_plans enable row level security;
alter table public.mesocycles enable row level security;
alter table public.workout_templates enable row level security;
alter table public.prescribed_exercises enable row level security;
alter table public.prescribed_sets enable row level security;
alter table public.plan_templates enable row level security;

create policy "staff manages plans" on public.training_plans
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));

create policy "client reads own plans" on public.training_plans
  for select using (client_id = auth.uid());

-- Tabelas filhas herdam via join com o plano
create policy "plan children read" on public.mesocycles
  for select using (
    exists (select 1 from public.training_plans p where p.id = plan_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "plan children write" on public.mesocycles
  for all using (
    exists (select 1 from public.training_plans p where p.id = plan_id and public.is_org_staff(p.org_id))
  );

create policy "workout templates read" on public.workout_templates
  for select using (
    exists (select 1 from public.mesocycles m join public.training_plans p on p.id = m.plan_id
            where m.id = mesocycle_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "workout templates write" on public.workout_templates
  for all using (
    exists (select 1 from public.mesocycles m join public.training_plans p on p.id = m.plan_id
            where m.id = mesocycle_id and public.is_org_staff(p.org_id))
  );

create policy "prescribed exercises read" on public.prescribed_exercises
  for select using (
    exists (select 1 from public.workout_templates w
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where w.id = workout_template_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "prescribed exercises write" on public.prescribed_exercises
  for all using (
    exists (select 1 from public.workout_templates w
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where w.id = workout_template_id and public.is_org_staff(p.org_id))
  );

create policy "prescribed sets read" on public.prescribed_sets
  for select using (
    exists (select 1 from public.prescribed_exercises pe
            join public.workout_templates w on w.id = pe.workout_template_id
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where pe.id = prescribed_exercise_id
            and (public.is_org_staff(p.org_id) or p.client_id = auth.uid()))
  );

create policy "prescribed sets write" on public.prescribed_sets
  for all using (
    exists (select 1 from public.prescribed_exercises pe
            join public.workout_templates w on w.id = pe.workout_template_id
            join public.mesocycles m on m.id = w.mesocycle_id
            join public.training_plans p on p.id = m.plan_id
            where pe.id = prescribed_exercise_id and public.is_org_staff(p.org_id))
  );

create policy "read system and org plan templates" on public.plan_templates
  for select using (org_id is null or public.is_org_member(org_id));

create policy "staff manages org plan templates" on public.plan_templates
  for all using (org_id is not null and public.is_org_staff(org_id))
  with check (org_id is not null and public.is_org_staff(org_id));

-- Execution --------------------------------------------------------------------------

alter table public.workout_sessions enable row level security;
alter table public.performed_exercises enable row level security;
alter table public.performed_sets enable row level security;

-- Cliente registra e lê as próprias sessões; staff da org lê tudo.
create policy "client manages own sessions" on public.workout_sessions
  for all using (client_id = auth.uid()) with check (client_id = auth.uid());

create policy "staff reads org sessions" on public.workout_sessions
  for select using (public.is_org_staff(org_id));

create policy "performed exercises access" on public.performed_exercises
  for all using (
    exists (select 1 from public.workout_sessions s where s.id = session_id
            and (s.client_id = auth.uid() or public.is_org_staff(s.org_id)))
  ) with check (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.client_id = auth.uid())
  );

create policy "performed sets access" on public.performed_sets
  for all using (
    exists (select 1 from public.performed_exercises pe
            join public.workout_sessions s on s.id = pe.session_id
            where pe.id = performed_exercise_id
            and (s.client_id = auth.uid() or public.is_org_staff(s.org_id)))
  ) with check (
    exists (select 1 from public.performed_exercises pe
            join public.workout_sessions s on s.id = pe.session_id
            where pe.id = performed_exercise_id and s.client_id = auth.uid())
  );

-- Assessments / restrictions / audit / ai -----------------------------------------------

alter table public.assessments enable row level security;
alter table public.assessment_measures enable row level security;
alter table public.injury_restrictions enable row level security;
alter table public.restriction_exercises enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_generations enable row level security;

create policy "staff manages assessments" on public.assessments
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));

create policy "client reads own assessments" on public.assessments
  for select using (client_id = auth.uid());

create policy "assessment measures access" on public.assessment_measures
  for all using (
    exists (select 1 from public.assessments a where a.id = assessment_id
            and (public.is_org_staff(a.org_id) or a.client_id = auth.uid()))
  ) with check (
    exists (select 1 from public.assessments a where a.id = assessment_id and public.is_org_staff(a.org_id))
  );

create policy "staff manages restrictions" on public.injury_restrictions
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));

create policy "client reads own restrictions" on public.injury_restrictions
  for select using (client_id = auth.uid());

create policy "restriction exercises access" on public.restriction_exercises
  for all using (
    exists (select 1 from public.injury_restrictions r where r.id = restriction_id
            and (public.is_org_staff(r.org_id) or r.client_id = auth.uid()))
  );

create policy "staff reads audit" on public.audit_logs
  for select using (public.is_org_staff(org_id));

-- audit_logs INSERT via service role ou trigger; sem policy de write no client.

create policy "staff manages ai generations" on public.ai_generations
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));
