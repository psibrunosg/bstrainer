-- Identidade e papéis: profiles, organizations, memberships, client_links

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  locale text not null default 'pt-BR',
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'trainer', 'client', 'solo')),
  created_at timestamptz not null default now(),
  primary key (org_id, profile_id)
);

-- Vínculo prescritor <-> aluno. Aluno pode existir sem conta (invited).
create table public.client_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id),
  client_id uuid references public.profiles(id),
  invite_email text,
  status text not null default 'invited' check (status in ('invited', 'active', 'archived')),
  created_at timestamptz not null default now(),
  check (client_id is not null or invite_email is not null)
);

create index on public.memberships (profile_id);
create index on public.client_links (org_id);
create index on public.client_links (trainer_id);
create index on public.client_links (client_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
