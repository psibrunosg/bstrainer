drop policy if exists "staff manages links"
  on public.client_links;

create policy "staff reads links"
  on public.client_links for select to authenticated
  using ((select public.is_org_staff(org_id)));

create policy "trainers create pending invitations"
  on public.client_links for insert to authenticated
  with check (
    trainer_id = (select auth.uid())
    and client_id is null
    and invite_email is not null
    and btrim(invite_email) <> ''
    and status = 'invited'
    and exists (
      select 1
      from public.memberships m
      where m.org_id = client_links.org_id
        and m.profile_id = (select auth.uid())
        and m.role in ('owner', 'trainer')
    )
  );

revoke insert, update, delete
  on public.client_links
  from public, anon, authenticated;

grant select
  on public.client_links
  to authenticated;

grant insert (org_id, trainer_id, invite_email, status)
  on public.client_links
  to authenticated;

create function public.prevent_body_measurement_user_id_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'body_measurements.user_id is immutable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger body_measurements_user_id_immutable
  before update of user_id on public.body_measurements
  for each row
  execute function public.prevent_body_measurement_user_id_change();

revoke execute on function public.prevent_body_measurement_user_id_change()
  from public, anon, authenticated;
