begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  (
    '00000000-0000-0000-0000-000000000010',
    'atomic-trainer@example.test',
    now(),
    '{"name":"Atomic Trainer"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000020',
    'linked-athlete@example.test',
    now(),
    '{"name":"Linked Athlete"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000030',
    'archived-athlete@example.test',
    now(),
    '{"name":"Archived Athlete"}'::jsonb
  );

insert into public.organizations (id, name, owner_id)
values (
  '10000000-0000-0000-0000-000000000001',
  'Atomic Plans Test Organization',
  '00000000-0000-0000-0000-000000000010'
);

insert into public.memberships (org_id, profile_id, role)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'trainer'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000020',
    'client'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000030',
    'client'
  );

-- Active links cannot be forged by authenticated users after the client_links
-- hardening migration, so this trusted test-fixture setup happens before SET ROLE.
-- The negative client is still a member of this organization, but its only
-- trainer link is archived so link status is the isolated authorization failure.
insert into public.client_links (id, org_id, trainer_id, client_id, status)
values
  (
    '11000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'active'
  ),
  (
    '11000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000030',
    'archived'
  );

insert into public.exercises (
  id,
  org_id,
  name,
  movement_pattern,
  primary_muscles,
  load_type,
  source
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    null,
    'Atomic Squat',
    'squat',
    array['quads'],
    'barbell',
    'custom'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    null,
    'Atomic Row',
    'pull_h',
    array['back'],
    'cable',
    'custom'
  );

insert into public.activities (id, org_id, name, type)
values (
  '30000000-0000-0000-0000-000000000001',
  null,
  'Atomic Run',
  'running'
);

insert into public.training_plans (
  id,
  org_id,
  client_id,
  created_by,
  goal,
  engine,
  status,
  start_date
)
values (
  '70000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000010',
  'health',
  'assisted',
  'draft',
  '2026-08-10'
);

select set_config(
  'test.valid_payload',
  $payload$
  {
    "orgId": "10000000-0000-0000-0000-000000000001",
    "clientId": "00000000-0000-0000-0000-000000000020",
    "goal": "hypertrophy",
    "engine": "assisted",
    "startDate": "2026-08-10",
    "endDate": "2026-09-06",
    "sourceTemplateId": null,
    "mesocycles": [
      {
        "id": "40000000-0000-0000-0000-000000000101",
        "position": 1,
        "weeks": 4,
        "emphasis": "hypertrophy",
        "progressionModel": "double_progression",
        "includesDeload": false,
        "notes": "Atomic mixed mesocycle",
        "workouts": [
          {
            "id": "40000000-0000-0000-0000-000000000201",
            "name": "Atomic Mixed Workout",
            "suggestedWeekday": 1,
            "position": 1,
            "blocks": [
              {
                "kind": "exercise",
                "id": "40000000-0000-0000-0000-000000000301",
                "exerciseId": "20000000-0000-0000-0000-000000000001",
                "position": 1,
                "technique": "straight",
                "supersetGroup": null,
                "notes": "Controlled reps",
                "sets": [
                  {
                    "id": "40000000-0000-0000-0000-000000000401",
                    "position": 1,
                    "repsMin": 8,
                    "repsMax": 10,
                    "loadMethod": "percent_1rm",
                    "loadValue": 75,
                    "targetRpe": null,
                    "targetRir": 2,
                    "restSeconds": 90,
                    "isWarmup": false,
                    "isAmrap": false
                  }
                ]
              },
              {
                "kind": "activity",
                "id": "40000000-0000-0000-0000-000000000302",
                "activityId": "30000000-0000-0000-0000-000000000001",
                "position": 2,
                "durationSeconds": 1800,
                "distanceKm": 5,
                "targetPaceMinPerKm": 6,
                "targetRpe": 6,
                "notes": "Z2"
              },
              {
                "kind": "circuit",
                "id": "40000000-0000-0000-0000-000000000303",
                "position": 3,
                "exerciseIds": [
                  "20000000-0000-0000-0000-000000000002",
                  "20000000-0000-0000-0000-000000000001"
                ],
                "rounds": 4,
                "workSeconds": 45,
                "restSeconds": 15,
                "targetRpe": 8,
                "notes": "Finisher"
              }
            ]
          }
        ]
      }
    ]
  }
  $payload$,
  true
);

select set_config(
  'test.invalid_fk_payload',
  $payload$
  {
    "orgId": "10000000-0000-0000-0000-000000000001",
    "clientId": "00000000-0000-0000-0000-000000000020",
    "goal": "power",
    "engine": "assisted",
    "startDate": "2026-08-10",
    "endDate": null,
    "sourceTemplateId": null,
    "mesocycles": [
      {
        "id": "50000000-0000-0000-0000-000000000101",
        "position": 1,
        "weeks": 2,
        "emphasis": "power",
        "progressionModel": "linear",
        "includesDeload": false,
        "notes": null,
        "workouts": [
          {
            "id": "50000000-0000-0000-0000-000000000201",
            "name": "Invalid FK Workout",
            "suggestedWeekday": 2,
            "position": 1,
            "blocks": [
              {
                "kind": "exercise",
                "id": "50000000-0000-0000-0000-000000000301",
                "exerciseId": "ffffffff-ffff-ffff-ffff-ffffffffffff",
                "position": 1,
                "technique": "straight",
                "supersetGroup": null,
                "notes": null,
                "sets": [
                  {
                    "id": "50000000-0000-0000-0000-000000000401",
                    "position": 1,
                    "repsMin": 3,
                    "repsMax": 5,
                    "loadMethod": "rpe",
                    "loadValue": null,
                    "targetRpe": 9,
                    "targetRir": null,
                    "restSeconds": 180,
                    "isWarmup": false,
                    "isAmrap": false
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  $payload$,
  true
);

select set_config(
  'test.archived_link_payload',
  $payload$
  {
    "orgId": "10000000-0000-0000-0000-000000000001",
    "clientId": "00000000-0000-0000-0000-000000000030",
    "goal": "strength",
    "engine": "assisted",
    "startDate": "2026-08-10",
    "endDate": null,
    "sourceTemplateId": null,
    "mesocycles": [
      {
        "id": "60000000-0000-0000-0000-000000000101",
        "position": 1,
        "weeks": 4,
        "emphasis": "strength",
        "progressionModel": "linear",
        "includesDeload": false,
        "notes": null,
        "workouts": [
          {
            "id": "60000000-0000-0000-0000-000000000201",
            "name": "Archived Link Workout",
            "suggestedWeekday": 3,
            "position": 1,
            "blocks": [
              {
                "kind": "exercise",
                "id": "60000000-0000-0000-0000-000000000301",
                "exerciseId": "20000000-0000-0000-0000-000000000001",
                "position": 1,
                "technique": "straight",
                "supersetGroup": null,
                "notes": null,
                "sets": [
                  {
                    "id": "60000000-0000-0000-0000-000000000401",
                    "position": 1,
                    "repsMin": 5,
                    "repsMax": 5,
                    "loadMethod": "rpe",
                    "loadValue": null,
                    "targetRpe": 8,
                    "targetRir": null,
                    "restSeconds": 120,
                    "isWarmup": false,
                    "isAmrap": false
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  $payload$,
  true
);

select set_config(
  'test.second_valid_payload',
  $payload$
  {
    "orgId": "10000000-0000-0000-0000-000000000001",
    "clientId": "00000000-0000-0000-0000-000000000020",
    "goal": "endurance",
    "engine": "assisted",
    "startDate": "2026-09-07",
    "endDate": null,
    "sourceTemplateId": null,
    "mesocycles": [
      {
        "id": "80000000-0000-0000-0000-000000000101",
        "position": 1,
        "weeks": 4,
        "emphasis": "intro",
        "progressionModel": "linear",
        "includesDeload": false,
        "notes": "Second complete draft",
        "workouts": [
          {
            "id": "80000000-0000-0000-0000-000000000201",
            "name": "Second Complete Workout",
            "suggestedWeekday": 4,
            "position": 1,
            "blocks": [
              {
                "kind": "exercise",
                "id": "80000000-0000-0000-0000-000000000301",
                "exerciseId": "20000000-0000-0000-0000-000000000002",
                "position": 1,
                "technique": "straight",
                "supersetGroup": null,
                "notes": null,
                "sets": [
                  {
                    "id": "80000000-0000-0000-0000-000000000401",
                    "position": 1,
                    "repsMin": 10,
                    "repsMax": 12,
                    "loadMethod": "rpe",
                    "loadValue": null,
                    "targetRpe": 7,
                    "targetRir": null,
                    "restSeconds": 60,
                    "isWarmup": false,
                    "isAmrap": false
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  $payload$,
  true
);

select set_config(
  'test.empty_draft_id',
  '70000000-0000-0000-0000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000010',
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select has_function('public', 'create_plan_draft', array['jsonb']);
select has_function('public', 'publish_plan', array['uuid']);

select results_eq(
  $$
    select p.proname, p.prosecdef
    from pg_catalog.pg_proc as p
    where p.oid in (
      to_regprocedure('public.create_plan_draft(jsonb)'),
      to_regprocedure('public.publish_plan(uuid)')
    )
    order by p.proname
  $$,
  $$
    values
      ('create_plan_draft'::name, false),
      ('publish_plan'::name, false)
  $$,
  'plan RPCs are security invoker'
);

select lives_ok(
  $$
    select public.create_plan_draft(
      current_setting('test.valid_payload')::jsonb
    )
  $$,
  'linked trainer creates a draft'
);

select results_eq(
  $$
    select
      (
        select status
        from public.training_plans
        where client_id = '00000000-0000-0000-0000-000000000020'
          and goal = 'hypertrophy'
      ),
      (
        select count(*)
        from public.mesocycles
        where id = '40000000-0000-0000-0000-000000000101'
      ),
      (
        select count(*)
        from public.workout_templates
        where id = '40000000-0000-0000-0000-000000000201'
      ),
      (
        select count(*)
        from public.prescribed_exercises
        where id = '40000000-0000-0000-0000-000000000301'
      ),
      (
        select count(*)
        from public.prescribed_sets
        where id = '40000000-0000-0000-0000-000000000401'
      ),
      (
        select count(*)
        from public.prescribed_activities
        where id = '40000000-0000-0000-0000-000000000302'
      ),
      (
        select count(*)
        from public.prescribed_circuits
        where id = '40000000-0000-0000-0000-000000000303'
      ),
      (
        select count(*)
        from public.prescribed_circuit_exercises
        where circuit_id = '40000000-0000-0000-0000-000000000303'
      ),
      (
        select array_agg(exercise_id order by position)
        from public.prescribed_circuit_exercises
        where circuit_id = '40000000-0000-0000-0000-000000000303'
      )
  $$,
  $$
    values (
      'draft'::text,
      1::bigint,
      1::bigint,
      1::bigint,
      1::bigint,
      1::bigint,
      1::bigint,
      2::bigint,
      array[
        '20000000-0000-0000-0000-000000000002'::uuid,
        '20000000-0000-0000-0000-000000000001'::uuid
      ]
    )
  $$,
  'draft persists the complete ordered mixed-block tree'
);

select throws_ok(
  $$
    select public.create_plan_draft(
      current_setting('test.invalid_fk_payload')::jsonb
    )
  $$,
  '23503',
  null,
  'invalid exercise foreign key aborts transaction'
);

select results_eq(
  $$
    select
      (
        select count(*)
        from public.training_plans
        where org_id = '10000000-0000-0000-0000-000000000001'
          and client_id = '00000000-0000-0000-0000-000000000020'
          and created_by = '00000000-0000-0000-0000-000000000010'
          and goal = 'power'
      ),
      (
        select count(*)
        from public.mesocycles
        where id = '50000000-0000-0000-0000-000000000101'
      ),
      (
        select count(*)
        from public.workout_templates
        where id = '50000000-0000-0000-0000-000000000201'
      ),
      (
        select count(*)
        from public.prescribed_exercises
        where id = '50000000-0000-0000-0000-000000000301'
      ),
      (
        select count(*)
        from public.prescribed_sets
        where id = '50000000-0000-0000-0000-000000000401'
      )
  $$,
  $$ values (0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'failed payload leaves no plan tree rows'
);

select throws_ok(
  $$
    select public.create_plan_draft(
      current_setting('test.archived_link_payload')::jsonb
    )
  $$,
  '42501',
  null,
  'trainer with archived client link is denied'
);

select lives_ok(
  $$
    select public.publish_plan(
      (
        select id
        from public.training_plans
        where client_id = '00000000-0000-0000-0000-000000000020'
          and goal = 'hypertrophy'
          and status = 'draft'
      )
    )
  $$,
  'complete draft publishes'
);

select lives_ok(
  $assertion$
    do $body$
    declare
      v_status text;
    begin
      select status
        into strict v_status
      from public.training_plans
      where client_id = '00000000-0000-0000-0000-000000000020'
        and goal = 'hypertrophy';

      if v_status is distinct from 'active' then
        raise exception 'expected published plan to be active, got %', v_status;
      end if;

      perform public.create_plan_draft(
        current_setting('test.second_valid_payload')::jsonb
      );
    end
    $body$
  $assertion$,
  'published plan is active and second complete draft is created'
);

select throws_ok(
  $assertion$
    do $body$
    declare
      v_second_plan_id uuid;
    begin
      select id
        into v_second_plan_id
      from public.training_plans
      where client_id = '00000000-0000-0000-0000-000000000020'
        and goal = 'endurance'
        and status = 'draft';

      if v_second_plan_id is null then
        raise exception 'second complete draft is missing';
      end if;

      perform public.publish_plan(v_second_plan_id);
    end
    $body$
  $assertion$,
  '23514',
  null,
  'another active plan prevents second complete draft publication'
);

select throws_ok(
  $$
    select public.publish_plan(
      current_setting('test.empty_draft_id')::uuid
    )
  $$,
  '23514',
  null,
  'empty draft cannot publish'
);

select * from finish();
rollback;
