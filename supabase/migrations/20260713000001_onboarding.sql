-- Onboarding automático: novo usuário auth ganha profile + org pessoal + membership solo.
-- Personal trainer é upgrade posterior (role trainer via UI de settings).

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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
