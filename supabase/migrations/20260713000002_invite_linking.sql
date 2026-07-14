-- Ao criar novo usuário, vincular convites pendentes (client_links) endereçados
-- ao e-mail dele: seta client_id e ativa o vínculo. Extende handle_new_user.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  new_org_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, name)
  values (new.id, display_name);

  insert into public.organizations (name, owner_id)
  values (display_name, new.id)
  returning id into new_org_id;

  insert into public.memberships (org_id, profile_id, role)
  values (new_org_id, new.id, 'solo');

  insert into public.subscriptions (org_id, tier, status)
  values (new_org_id, 'starter', 'trialing');

  -- Vincula convites pendentes endereçados a este e-mail
  update public.client_links
     set client_id = new.id, status = 'active'
   where invite_email = new.email
     and client_id is null
     and status = 'invited';

  -- Cria membership de cliente nas orgs que o convidaram
  insert into public.memberships (org_id, profile_id, role)
  select cl.org_id, new.id, 'client'
    from public.client_links cl
   where cl.client_id = new.id
     and cl.status = 'active'
  on conflict (org_id, profile_id) do nothing;

  return new;
end;
$$;
