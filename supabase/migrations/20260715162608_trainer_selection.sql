-- Usuário solo pode escolher um personal sem perder sua organização pessoal.

alter table public.client_links
  drop constraint client_links_status_check;

alter table public.client_links
  add constraint client_links_status_check
  check (status in ('invited', 'requested', 'active', 'archived'));

create unique index client_links_trainer_client_unique
  on public.client_links (trainer_id, client_id)
  where client_id is not null;

create table public.trainer_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  bio text not null default '',
  accepting_clients boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trainer_profiles_org_id_idx on public.trainer_profiles (org_id);

create trigger trainer_profiles_updated_at before update on public.trainer_profiles
  for each row execute function public.set_updated_at();

alter table public.trainer_profiles enable row level security;

create policy "authenticated users read trainer directory"
  on public.trainer_profiles for select to authenticated
  using (accepting_clients or profile_id = (select auth.uid()));

create policy "trainer manages own public profile"
  on public.trainer_profiles for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.org_id = trainer_profiles.org_id
        and m.profile_id = (select auth.uid())
        and m.role in ('owner', 'trainer', 'solo')
    )
  );

create or replace function public.request_trainer(p_trainer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  trainer public.trainer_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada.';
  end if;

  if p_trainer_id = auth.uid() then
    raise exception 'Você não pode solicitar acompanhamento para si mesmo.';
  end if;

  select * into trainer
  from public.trainer_profiles
  where profile_id = p_trainer_id and accepting_clients;

  if not found then
    raise exception 'Este personal não está aceitando novos alunos.';
  end if;

  insert into public.client_links (org_id, trainer_id, client_id, status)
  values (trainer.org_id, trainer.profile_id, auth.uid(), 'requested')
  on conflict (trainer_id, client_id) where client_id is not null
  do update set
    org_id = excluded.org_id,
    invite_email = null,
    status = 'requested';
end;
$$;

create or replace function public.respond_to_trainer_request(
  p_link_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  link public.client_links%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada.';
  end if;

  select * into link
  from public.client_links
  where id = p_link_id and status = 'requested';

  if not found then
    raise exception 'Solicitação não encontrada.';
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.org_id = link.org_id
      and m.profile_id = auth.uid()
      and m.role in ('owner', 'trainer', 'solo')
  ) then
    raise exception 'Sem permissão para responder esta solicitação.';
  end if;

  update public.client_links
  set status = case when p_accept then 'active' else 'archived' end
  where id = link.id;

  if p_accept then
    insert into public.memberships (org_id, profile_id, role)
    values (link.org_id, link.client_id, 'client')
    on conflict (org_id, profile_id) do nothing;
  end if;
end;
$$;

revoke execute on function public.request_trainer(uuid) from public, anon;
revoke execute on function public.respond_to_trainer_request(uuid, boolean) from public, anon;
grant execute on function public.request_trainer(uuid) to authenticated;
grant execute on function public.respond_to_trainer_request(uuid, boolean) to authenticated;
