-- Medições corporais do atleta (peso, gordura, circunferências).
-- Uma linha por data de medição. Medidas em cm exceto peso (kg) e % gordura.

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at date not null default current_date,

  weight_kg        numeric(5,2),
  body_fat_pct     numeric(4,1),
  chest_cm         numeric(5,1),
  waist_cm         numeric(5,1),
  hip_cm           numeric(5,1),
  bicep_right_cm   numeric(5,1),
  thigh_right_cm   numeric(5,1),

  notes text,
  created_at timestamptz not null default now()
);

-- Pelo menos um valor numérico por registro.
alter table public.body_measurements
  add constraint body_measurements_has_value
  check (
    weight_kg is not null or body_fat_pct is not null or
    chest_cm is not null or waist_cm is not null or hip_cm is not null or
    bicep_right_cm is not null or thigh_right_cm is not null
  );

create index body_measurements_user_date_idx
  on public.body_measurements (user_id, measured_at desc);

alter table public.body_measurements enable row level security;

create policy "user manages own body measurements"
  on public.body_measurements for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
