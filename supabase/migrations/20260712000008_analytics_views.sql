-- Views de analytics — métricas sempre derivadas dos dados brutos.
-- security_invoker: views respeitam RLS do usuário consultante.

-- e1RM por série válida (Epley, ajustado por RIR quando informado)
create or replace view public.v_set_e1rm
with (security_invoker = true) as
select
  ps.id as performed_set_id,
  pe.exercise_id,
  s.client_id,
  s.org_id,
  s.started_at::date as session_date,
  ps.reps,
  ps.load_kg,
  ps.rpe,
  ps.rir,
  case
    when ps.load_kg is null or ps.load_kg <= 0 or ps.reps <= 0 then null
    when (ps.reps + coalesce(ps.rir, 0)) = 1 then ps.load_kg
    else ps.load_kg * (1 + (ps.reps + coalesce(ps.rir, 0))::numeric / 30)
  end as e1rm_kg
from public.performed_sets ps
join public.performed_exercises pe on pe.id = ps.performed_exercise_id
join public.workout_sessions s on s.id = pe.session_id
where not ps.is_warmup;

-- Melhor e1RM por exercício por dia (linha de progresso do dashboard)
create or replace view public.v_daily_best_e1rm
with (security_invoker = true) as
select
  client_id,
  org_id,
  exercise_id,
  session_date,
  max(e1rm_kg) as best_e1rm_kg
from public.v_set_e1rm
where e1rm_kg is not null
group by client_id, org_id, exercise_id, session_date;

-- Tonelagem e carga de sessão (Foster: sRPE x minutos)
create or replace view public.v_session_summary
with (security_invoker = true) as
select
  s.id as session_id,
  s.client_id,
  s.org_id,
  s.started_at::date as session_date,
  s.status,
  s.session_rpe,
  extract(epoch from (s.finished_at - s.started_at)) / 60 as duration_min,
  case
    when s.session_rpe is not null and s.finished_at is not null
    then round(s.session_rpe * extract(epoch from (s.finished_at - s.started_at)) / 60)
  end as session_load,
  coalesce(sum(ps.reps * ps.load_kg) filter (where not ps.is_warmup), 0) as tonnage_kg,
  count(ps.id) filter (where not ps.is_warmup) as work_sets
from public.workout_sessions s
left join public.performed_exercises pe on pe.session_id = s.id
left join public.performed_sets ps on ps.performed_exercise_id = pe.id
group by s.id;

-- Séries semanais por grupo muscular (primário 1.0, secundário 0.5)
create or replace view public.v_weekly_muscle_volume
with (security_invoker = true) as
with set_muscles as (
  select
    s.client_id,
    s.org_id,
    date_trunc('week', s.started_at)::date as week_start,
    unnest(e.primary_muscles) as muscle,
    1.0 as weight
  from public.performed_sets ps
  join public.performed_exercises pe on pe.id = ps.performed_exercise_id
  join public.workout_sessions s on s.id = pe.session_id
  join public.exercises e on e.id = pe.exercise_id
  where not ps.is_warmup
  union all
  select
    s.client_id,
    s.org_id,
    date_trunc('week', s.started_at)::date,
    unnest(e.secondary_muscles),
    0.5
  from public.performed_sets ps
  join public.performed_exercises pe on pe.id = ps.performed_exercise_id
  join public.workout_sessions s on s.id = pe.session_id
  join public.exercises e on e.id = pe.exercise_id
  where not ps.is_warmup
)
select client_id, org_id, week_start, muscle, sum(weight) as weekly_sets
from set_muscles
group by client_id, org_id, week_start, muscle;
