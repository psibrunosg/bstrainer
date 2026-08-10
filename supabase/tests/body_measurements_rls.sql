begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  (
    '00000000-0000-0000-0000-00000000000a',
    'athlete-a@example.test',
    now(),
    '{"name":"Athlete A"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000000b',
    'athlete-b@example.test',
    now(),
    '{"name":"Athlete B"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000000f',
    'trainer-t@example.test',
    now(),
    '{"name":"Trainer T"}'::jsonb
  );

insert into public.client_links (org_id, trainer_id, client_id, status)
select
  organizations.id,
  '00000000-0000-0000-0000-00000000000f',
  links.client_id,
  links.status
from public.organizations
cross join (
  values
    ('00000000-0000-0000-0000-00000000000a'::uuid, 'active'),
    ('00000000-0000-0000-0000-00000000000b'::uuid, 'archived')
) as links(client_id, status)
where organizations.owner_id = '00000000-0000-0000-0000-00000000000f';

insert into public.body_measurements (id, user_id, weight_kg)
values
  (
    '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    71
  ),
  (
    '10000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000b',
    81
  );

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-00000000000a',
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select is(
  (select count(*) from public.body_measurements),
  1::bigint,
  'athlete sees own row'
);

select lives_ok(
  $$
    insert into public.body_measurements (id, user_id, weight_kg)
    values (
      '20000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-00000000000a',
      72
    )
  $$,
  'athlete inserts own row'
);

select results_eq(
  $$
    update public.body_measurements
       set weight_kg = 72.5
     where id = '20000000-0000-0000-0000-00000000000a'
    returning weight_kg
  $$,
  $$ values (72.5::numeric) $$,
  'athlete updates own row'
);

select results_eq(
  $$
    delete from public.body_measurements
     where id = '20000000-0000-0000-0000-00000000000a'
    returning id
  $$,
  $$ values ('20000000-0000-0000-0000-00000000000a'::uuid) $$,
  'athlete deletes own row'
);

select is(
  (
    select count(*)
    from public.body_measurements
    where user_id = '00000000-0000-0000-0000-00000000000b'
  ),
  0::bigint,
  'athlete cannot see another athlete'
);

select throws_ok(
  $$
    insert into public.body_measurements (user_id, weight_kg)
    values ('00000000-0000-0000-0000-00000000000b', 80)
  $$,
  '42501',
  null,
  'athlete cannot write another athlete'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-00000000000f',
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.body_measurements
    where id = '10000000-0000-0000-0000-00000000000a'
  ),
  1::bigint,
  'trainer sees active linked athlete row'
);

select lives_ok(
  $$
    insert into public.body_measurements (id, user_id, weight_kg)
    values (
      '30000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-00000000000a',
      73
    )
  $$,
  'trainer inserts active linked athlete row'
);

select results_eq(
  $$
    update public.body_measurements
       set weight_kg = 73.5
     where id = '30000000-0000-0000-0000-00000000000a'
    returning weight_kg
  $$,
  $$ values (73.5::numeric) $$,
  'trainer updates active linked athlete row'
);

select results_eq(
  $$
    delete from public.body_measurements
     where id = '30000000-0000-0000-0000-00000000000a'
    returning id
  $$,
  $$ values ('30000000-0000-0000-0000-00000000000a'::uuid) $$,
  'trainer deletes active linked athlete row'
);

select results_eq(
  $$
    with mutated as (
      update public.body_measurements
         set weight_kg = 99
       where user_id = '00000000-0000-0000-0000-00000000000b'
      returning 1
    )
    select
      (
        select count(*)
        from public.body_measurements
        where user_id = '00000000-0000-0000-0000-00000000000b'
      ),
      (select count(*) from mutated)
  $$,
  $$ values (0::bigint, 0::bigint) $$,
  'trainer cannot see or mutate archived athlete row'
);

select throws_ok(
  $$
    update public.body_measurements
       set user_id = '00000000-0000-0000-0000-00000000000b'
     where id = '10000000-0000-0000-0000-00000000000a'
  $$,
  '42501',
  null,
  'trainer cannot reassign a measurement to an archived athlete'
);

select * from finish();
rollback;
