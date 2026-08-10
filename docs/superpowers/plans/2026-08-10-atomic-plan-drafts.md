# Atomic Plan Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar fichas completas em uma única transação como rascunho e publicá-las somente após validação explícita.

**Architecture:** O engine continua instanciando o modelo no cliente, mas um único RPC `security invoker` valida autorização e persiste a árvore inteira na mesma transação Postgres. Um segundo RPC valida a estrutura e publica o rascunho; se já houver ficha ativa, a publicação falha sem alterar dados até o plano de ciclo de vida implementar inativação explícita.

**Tech Stack:** TypeScript, Supabase JS, PostgreSQL/PLpgSQL, pgTAP, Vitest, Next.js 15.

## Global Constraints

- Preservar ADR-0001 e ADR-0002: blocos mistos e tabelas irmãs permanecem.
- Usar `security invoker`; RLS permanece ativa e a função faz validação adicional de vínculo.
- Revogar execução de `public` e `anon`; conceder somente a `authenticated`.
- O browser não controla `status`, `created_by` ou o ID do plano.
- Slots não resolvidos impedem a chamada do RPC.
- Uma falha em qualquer filho deve deixar zero linhas da nova ficha.
- Não publicar se já existir outra ficha ativa para o atleta nesta entrega.

---

### Task 1: Define and test the atomic payload

**Files:**
- Create: `apps/web/lib/data/plan-draft-payload.ts`
- Create: `apps/web/lib/data/plan-draft-payload.test.ts`

**Interfaces:**
- Consumes: `TrainingPlan` from `@bstrainer/domain`.
- Produces:

```ts
export interface CreatePlanDraftPayload {
  orgId: string;
  clientId: string;
  goal: string;
  engine: "template" | "assisted";
  startDate: string;
  endDate: string | null;
  sourceTemplateId: string | null;
  mesocycles: Array<{
    id: string;
    position: number;
    weeks: number;
    emphasis: string;
    progressionModel: string;
    includesDeload: boolean;
    notes: string | null;
    workouts: Array<{
      id: string;
      name: string;
      suggestedWeekday: number | null;
      position: number;
      blocks: Array<Record<string, unknown>>;
    }>;
  }>;
}

export function toCreatePlanDraftPayload(input: {
  orgId: string;
  clientId: string;
  engine: "template" | "assisted";
  startDate: string;
  sourceTemplateId: string | null;
  plan: TrainingPlan;
}): CreatePlanDraftPayload;
```

- [ ] **Step 1: Write failing payload tests**

```ts
it("preserves globally ordered mixed blocks", () => {
  const payload = toCreatePlanDraftPayload(fixtureWithExerciseActivityCircuit());
  expect(payload.mesocycles[0]!.workouts[0]!.blocks.map((block) => block.kind))
    .toEqual(["exercise", "activity", "circuit"]);
  expect(payload.mesocycles[0]!.workouts[0]!.blocks.map((block) => block.position))
    .toEqual([1, 2, 3]);
});

it("does not expose creator or status fields", () => {
  const payload = toCreatePlanDraftPayload(validFixture());
  expect(payload).not.toHaveProperty("createdBy");
  expect(payload).not.toHaveProperty("status");
});
```

Also assert exact prescribed-set values and ordered circuit member IDs.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/plan-draft-payload.test.ts`

Expected: FAIL because the serializer does not exist.

- [ ] **Step 3: Implement the pure serializer**

Map camelCase domain fields to the JSON contract without database calls. Preserve every child ID except the plan ID, and sort `mesocycles`, `workouts`, `blocks` and `sets` by `order` before emitting `position`.

- [ ] **Step 4: Run payload tests**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/plan-draft-payload.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/data/plan-draft-payload.ts apps/web/lib/data/plan-draft-payload.test.ts
git commit -m "feat: define atomic plan draft payload"
```

### Task 2: Create failing database transaction tests

**Files:**
- Create: `supabase/tests/atomic_plan_drafts.sql`

**Interfaces:**
- Consumes: `public.create_plan_draft(jsonb)` and `public.publish_plan(uuid)` to be created in Task 3.
- Produces: 12 pgTAP assertions covering atomicity, authorization, mixed blocks and publication.

- [ ] **Step 1: Create deterministic fixtures**

Inside a transaction, insert organization, trainer membership, linked athlete, exercises and activity using fixed UUIDs. Set request claims for each actor with:

```sql
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000010', 'role', 'authenticated')::text,
  true
);
set local role authenticated;
```

- [ ] **Step 2: Write the 12 assertions**

The SQL test must assert:

```sql
select plan(12);
select has_function('public', 'create_plan_draft', array['jsonb']);
select has_function('public', 'publish_plan', array['uuid']);
select lives_ok($$ select public.create_plan_draft(:'valid_payload'::jsonb) $$, 'linked trainer creates a draft');
select is((select status from public.training_plans order by created_at desc limit 1), 'draft', 'new plan is draft');
select is((select count(*) from public.prescribed_exercises), 1::bigint, 'exercise persisted');
select is((select count(*) from public.prescribed_activities), 1::bigint, 'activity persisted');
select is((select count(*) from public.prescribed_circuits), 1::bigint, 'circuit persisted');
select throws_ok($$ select public.create_plan_draft(:'invalid_fk_payload'::jsonb) $$, null, null, 'invalid child aborts transaction');
select is((select count(*) from public.training_plans where goal = 'power'), 0::bigint, 'failed payload leaves no header');
select throws_ok($$ select public.create_plan_draft(:'unlinked_payload'::jsonb) $$, '42501', null, 'unlinked trainer denied');
select lives_ok($$ select public.publish_plan((select id from public.training_plans where status = 'draft' limit 1)) $$, 'complete draft publishes');
select throws_ok($$ select public.publish_plan(:'empty_draft_id'::uuid) $$, '23514', null, 'empty draft cannot publish');
select * from finish();
```

Use `\gset` or `set_config` variables defined in the same file; do not depend on production data. Roll back after `finish()`.

- [ ] **Step 3: Run tests to verify they fail**

```powershell
pnpm.cmd exec supabase start
pnpm.cmd exec supabase db reset
pnpm.cmd exec supabase test db
```

Expected: FAIL because both functions are absent.

- [ ] **Step 4: Commit the red test**

```powershell
git add supabase/tests/atomic_plan_drafts.sql
git commit -m "test: specify atomic plan draft persistence"
```

### Task 3: Implement transactional draft creation and publication

**Files:**
- Create via CLI: migration named `atomic_plan_drafts`
- Modify: `packages/db/src/database.types.ts`

**Interfaces:**
- Produces: `create_plan_draft(p_input jsonb) returns uuid`; `publish_plan(p_plan_id uuid) returns void`.

- [ ] **Step 1: Create the migration with the CLI**

Run: `pnpm.cmd exec supabase migration new atomic_plan_drafts`

Expected: one generated timestamped migration under `supabase/migrations/`.

- [ ] **Step 2: Implement `create_plan_draft`**

The generated migration must create a `language plpgsql security invoker set search_path = ''` function that:

1. reads `auth.uid()`, `orgId` and `clientId`;
2. requires `public.is_org_staff(orgId)`;
3. requires either `clientId = actor` or an active `public.client_links` row for actor/client/org;
4. validates non-empty mesocycles, workouts and blocks with `jsonb_array_length`;
5. inserts a server-generated plan ID with `status = 'draft'` and `created_by = actor`;
6. loops through every array with `jsonb_array_elements`;
7. dispatches `exercise`, `activity` and `circuit` blocks into their existing sibling tables;
8. raises SQLSTATE `22023` for unknown kinds or malformed arrays;
9. returns the generated plan ID.

Use schema-qualified relations throughout. The core control flow is:

```sql
for v_meso in select value from jsonb_array_elements(p_input->'mesocycles') loop
  insert into public.mesocycles (...)
  values (...);
  for v_workout in select value from jsonb_array_elements(v_meso->'workouts') loop
    insert into public.workout_templates (...)
    values (...);
    for v_block in select value from jsonb_array_elements(v_workout->'blocks') loop
      case v_block->>'kind'
        when 'exercise' then
          insert into public.prescribed_exercises (...) values (...);
          insert into public.prescribed_sets (...)
          select ... from jsonb_array_elements(v_block->'sets') as item;
        when 'activity' then
          insert into public.prescribed_activities (...) values (...);
        when 'circuit' then
          insert into public.prescribed_circuits (...) values (...);
          insert into public.prescribed_circuit_exercises (...)
          select ... from jsonb_array_elements_text(v_block->'exerciseIds') with ordinality;
        else
          raise exception 'unsupported block kind' using errcode = '22023';
      end case;
    end loop;
  end loop;
end loop;
```

Map the canonical domain contract exactly as it exists in `packages/domain/src/plan.ts` and the planning migrations:

- plan: `orgId`, `clientId`, `goal`, `engine`, `startDate`, `endDate`, `sourceTemplateId`;
- mesocycle: `id`, `position`, `weeks`, `emphasis`, `progressionModel`, `includesDeload`, `notes`;
- workout: `id`, `name`, `suggestedWeekday`, `position`;
- exercise block: `kind`, `id`, `exerciseId`, `position`, `technique`, `supersetGroup`, `notes`;
- prescribed set: `id`, `position`, `repsMin`, `repsMax`, `loadMethod`, `loadValue`, `targetRpe`, `targetRir`, `restSeconds`, `isWarmup`, `isAmrap`;
- activity block: `kind`, `id`, `activityId`, `position`, `durationSeconds`, `distanceKm`, `targetPaceMinPerKm`, `targetRpe`, `notes`;
- circuit block: `kind`, `id`, `position`, `exerciseIds` in their declared order, `rounds`, `workSeconds`, `restSeconds`, `targetRpe`, `notes`.

Insert each circuit member with its array ordinal as `position`. `sourceTemplateId` must be `null` unless it refers to an actual UUID row in `public.plan_templates`; IDs from the engine JSON library are not written into that FK. Reject missing required keys before the first insert and use no dynamic SQL.

- [ ] **Step 3: Implement `publish_plan`**

The function must lock the plan row `for update`, require staff authorization plus active trainer link when actor differs from client, require `status = 'draft'`, reject another active plan, and validate at least one mesocycle, one workout per mesocycle, one block per workout, and one set per prescribed exercise. Use SQLSTATE `23514` for incomplete structure. Only then update status to `active` and `updated_at = now()`.

- [ ] **Step 4: Restrict privileges explicitly**

```sql
revoke all on function public.create_plan_draft(jsonb) from public, anon;
revoke all on function public.publish_plan(uuid) from public, anon;
grant execute on function public.create_plan_draft(jsonb) to authenticated;
grant execute on function public.publish_plan(uuid) to authenticated;
```

Ensure `authenticated` has explicit Data API grants for all existing planning tables used by the invoker function.

- [ ] **Step 5: Reset and run database tests**

```powershell
pnpm.cmd exec supabase db reset
pnpm.cmd exec supabase test db
```

Expected: all 12 assertions pass.

- [ ] **Step 6: Generate database types**

Run: `pnpm.cmd exec supabase gen types typescript --local | Set-Content -Encoding utf8 packages/db/src/database.types.ts`

Expected: `Functions` includes `create_plan_draft` and `publish_plan`.

- [ ] **Step 7: Commit**

```powershell
git add supabase/migrations packages/db/src/database.types.ts
git commit -m "feat: persist plan drafts atomically"
```

### Task 4: Route template and manual creation through one RPC

**Files:**
- Create: `apps/web/lib/data/plans.test.ts`
- Modify: `apps/web/lib/data/plans.ts`

**Interfaces:**
- Consumes: serializer from Task 1 and RPCs from Task 3.
- Produces:

```ts
export type CreatePlanDraftResult =
  | { ok: true; planId: string; unresolved: number }
  | { ok: false; error: string };

export function createPlanDraft(payload: CreatePlanDraftPayload): Promise<CreatePlanDraftResult>;
export function publishPlan(planId: string): Promise<{ ok: true } | { ok: false; error: string }>;
```

- [ ] **Step 1: Write failing data tests**

```ts
it("calls one RPC for a complete mixed template", async () => {
  rpcMock.mockResolvedValue({ data: "plan-id", error: null });
  const result = await usePlanFromTemplate("mixed-template", equipment, "client-a");
  expect(rpcMock).toHaveBeenCalledTimes(1);
  expect(rpcMock).toHaveBeenCalledWith("create_plan_draft", {
    p_input: expect.objectContaining({ clientId: "client-a", mesocycles: expect.any(Array) }),
  });
  expect(fromMock).not.toHaveBeenCalledWith("training_plans");
  expect(result).toEqual({ ok: true, planId: "plan-id", unresolved: 0 });
});

it("does not call RPC when a slot is unresolved", async () => {
  instantiateTemplateMock.mockReturnValue(planWithUnresolvedSlot());
  const result = await usePlanFromTemplate("template", [], "client-a");
  expect(rpcMock).not.toHaveBeenCalled();
  expect(result).toEqual({ ok: false, error: "Resolva todos os exercícios antes de salvar a ficha." });
});
```

Also cover manual-tree expansion, empty manual input, RPC failure and `publish_plan` mapping.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/plans.test.ts`

Expected: FAIL because current implementation performs sequential inserts and creates active plans.

- [ ] **Step 3: Replace sequential writes**

Keep catalog resolution and engine instantiation, remove every direct child insert, serialize the complete tree, and call:

```ts
const { data, error } = await supabase.rpc("create_plan_draft", { p_input: payload });
if (error || !data) return { ok: false, error: "Falha ao salvar o rascunho da ficha." };
return { ok: true, planId: data, unresolved: 0 };
```

Make `createManualPlan` construct the same domain tree and use the same `createPlanDraft` function.

- [ ] **Step 4: Run data and engine tests**

```powershell
pnpm.cmd --filter @bstrainer/web test -- lib/data/plans.test.ts
pnpm.cmd --filter @bstrainer/engine test -- src/templates/instantiate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/data/plans.ts apps/web/lib/data/plans.test.ts
git commit -m "fix: create every plan as one draft transaction"
```

### Task 5: Add explicit draft review and publication

**Files:**
- Create: `apps/web/app/(app)/plans/[id]/page.tsx`
- Create: `apps/web/app/(app)/plans/[id]/page.test.tsx`
- Create: `apps/web/components/plans/PlanReviewContent.tsx`
- Modify: `apps/web/components/UseTemplateButton.tsx`
- Modify: `apps/web/app/(app)/plans/new/page.tsx`
- Modify: `apps/web/app/(app)/plans/page.tsx`

**Interfaces:**
- Consumes: `publishPlan(planId)` and existing plan read model.
- Produces: creation redirects to `/plans/{id}`; review shows draft structure and explicit Publish action.

- [ ] **Step 1: Write failing review-page tests**

```tsx
it("publishes only after explicit confirmation", async () => {
  publishPlanMock.mockResolvedValue({ ok: true });
  render(<PlanReviewContent plan={draftFixture} />);
  expect(publishPlanMock).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Publicar ficha" }));
  expect(publishPlanMock).toHaveBeenCalledWith(draftFixture.id);
});

it("keeps the draft visible when publication fails", async () => {
  publishPlanMock.mockResolvedValue({ ok: false, error: "Já existe uma ficha ativa para este aluno." });
  render(<PlanReviewContent plan={draftFixture} />);
  await user.click(screen.getByRole("button", { name: "Publicar ficha" }));
  expect(screen.getByText("Já existe uma ficha ativa para este aluno.")).toBeInTheDocument();
  expect(screen.getByText("Rascunho")).toBeInTheDocument();
});
```

Also assert unresolved templates never navigate, successful template/manual creation navigate to the returned review URL, and plan cards link to review.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- "app/(app)/plans/[id]/page.test.tsx"`

Expected: FAIL because the review route does not exist.

- [ ] **Step 3: Implement the review route and redirects**

Implement `PlanReviewContent` as the client boundary used by both the route and tests. Reuse the existing active-plan query shape to load the complete draft by ID. Display goal, mesocycles, workouts and ordered mixed blocks. Change button copy to “Salvar rascunho”; redirect both creation paths to `/plans/${result.planId}`. Publish only from the explicit button and show RPC errors inline.

- [ ] **Step 4: Run route, web and type tests**

```powershell
pnpm.cmd --filter @bstrainer/web test -- "app/(app)/plans/[id]/page.test.tsx"
pnpm.cmd --filter @bstrainer/web test
pnpm.cmd --filter @bstrainer/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add "apps/web/app/(app)/plans/[id]" apps/web/components/plans/PlanReviewContent.tsx apps/web/components/UseTemplateButton.tsx "apps/web/app/(app)/plans/new/page.tsx" "apps/web/app/(app)/plans/page.tsx"
git commit -m "feat: review and publish plan drafts"
```

### Task 6: Verify atomicity and deploy readiness

**Files:**
- Modify only files from Tasks 1–5 if verification exposes a defect.

- [ ] **Step 1: Run database and repository verification**

```powershell
pnpm.cmd exec supabase db reset
pnpm.cmd exec supabase test db
pnpm.cmd --filter @bstrainer/web test
pnpm.cmd --filter @bstrainer/web typecheck
pnpm.cmd --filter @bstrainer/web build
pnpm.cmd test
```

Expected: every command exits 0.

- [ ] **Step 2: Run destructive-failure smoke cases locally**

Create one valid mixed draft, one payload with an invalid exercise FK and one unlinked-client payload. Verify the valid tree has exact child counts; both failures create zero new plan headers; publishing an incomplete draft leaves it draft.

- [ ] **Step 3: Run Supabase advisors**

Run: `pnpm.cmd exec supabase db advisors`

Expected: no new security or performance finding caused by these functions/policies.

- [ ] **Step 4: Record the verification result**

Add exact row counts for all four valid child tables, the two zero-header failure checks, incomplete-publication status, and advisor output to the delivery notes. If verification exposes a defect in Tasks 1–5, restore a failing test in the owning task, correct it there, and rerun this entire section before review.
