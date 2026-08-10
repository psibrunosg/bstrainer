# Linked Client Measurements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que atleta gerencie as próprias medições e que o personal vinculado gerencie as medições do aluno selecionado, com RLS, erros recuperáveis e exclusão consistente.

**Architecture:** A camada de dados recebe `clientId` opcional e retorna unions discriminadas, enquanto RLS continua sendo a autoridade. A página lê o aluno da URL, funciona para as duas personas e preserva dados quando uma mutação falha.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Testing Library, Supabase/Postgres RLS.

## Global Constraints

- Nunca usar `user_metadata` para autorização.
- Personal só acessa atleta com `client_links.status = 'active'`.
- Toda nova dependência deve usar versão exata e permanecer no `pnpm-lock.yaml`.
- Não modificar migrations já aplicadas; criar nova migration com o Supabase CLI.
- A interface não remove uma medição antes de confirmação do banco.

---

### Task 1: Add the DOM test harness

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`

**Interfaces:**
- Produces: Vitest em `jsdom`, matchers de `@testing-library/jest-dom/vitest` e cleanup automático.

- [ ] **Step 1: Install pinned test dependencies**

Run:

```powershell
pnpm.cmd --filter @bstrainer/web add -D @testing-library/react@16.3.2 @testing-library/dom@10.4.1 @testing-library/user-event@14.6.1 @testing-library/jest-dom@7.0.0 jsdom@30.0.1
```

Expected: `apps/web/package.json` and `pnpm-lock.yaml` contain the exact versions.

- [ ] **Step 2: Configure Vitest**

Set `apps/web/vitest.config.ts` to:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: { "@": path.resolve(__dirname, "./") },
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

- [ ] **Step 3: Run the existing web suite**

Run: `pnpm.cmd --filter @bstrainer/web test`

Expected: all existing tests pass under jsdom.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/package.json apps/web/vitest.config.ts apps/web/vitest.setup.ts pnpm-lock.yaml
git commit -m "test: add web component test harness"
```

### Task 2: Make measurement access explicit and typed

**Files:**
- Create: `apps/web/lib/data/measurements.test.ts`
- Modify: `apps/web/lib/data/measurements.ts`

**Interfaces:**
- Consumes: `hasActiveClientLink(clientId: string): Promise<boolean>`.
- Produces:

```ts
export type MeasurementListResult =
  | { ok: true; measurements: BodyMeasurement[] }
  | { ok: false; error: string };

export function listMeasurements(clientId?: string): Promise<MeasurementListResult>;
export function saveMeasurement(input: MeasurementInput, clientId?: string): Promise<MeasurementResult>;
export function deleteMeasurement(id: string, clientId?: string): Promise<MeasurementResult>;
```

- [ ] **Step 1: Write failing authorization and error tests**

Create tests that mock `createClient` and `hasActiveClientLink` and assert this contract:

```ts
it("rejects an unlinked client before querying measurements", async () => {
  hasActiveClientLinkMock.mockResolvedValue(false);
  const result = await listMeasurements("client-b");
  expect(result).toEqual({ ok: false, error: "Aluno sem vínculo ativo com você." });
  expect(fromMock).not.toHaveBeenCalled();
});

it("does not turn a select error into an empty list", async () => {
  selectResult({ data: null, error: { message: "offline" } });
  await expect(listMeasurements()).resolves.toEqual({
    ok: false,
    error: "Falha ao carregar medições.",
  });
});

it("writes a linked client's id instead of the trainer id", async () => {
  hasActiveClientLinkMock.mockResolvedValue(true);
  await saveMeasurement(validInput, "client-a");
  expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: "client-a" }));
});
```

Also cover own-user list/save, linked-client list/delete, expired session, and failed delete.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/measurements.test.ts`

Expected: FAIL because current functions do not accept `clientId` or return `MeasurementListResult`.

- [ ] **Step 3: Implement target resolution once**

Add this private helper and use it in all three operations:

```ts
type TargetResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

async function resolveMeasurementTarget(clientId?: string): Promise<TargetResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  if (!clientId || clientId === user.id) return { ok: true, userId: user.id };
  if (!(await hasActiveClientLink(clientId))) {
    return { ok: false, error: "Aluno sem vínculo ativo com você." };
  }
  return { ok: true, userId: clientId };
}
```

Return explicit errors from every Supabase result and never coerce an error to `[]`.

- [ ] **Step 4: Run data tests**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/measurements.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/data/measurements.ts apps/web/lib/data/measurements.test.ts
git commit -m "fix: scope measurements to linked clients"
```

### Task 3: Extend RLS to linked trainers

**Files:**
- Create via CLI: migration named `linked_client_body_measurements`
- Create: `supabase/tests/body_measurements_rls.sql`

**Interfaces:**
- Consumes: `public.trains_client(check_client uuid)`.
- Produces: athlete-own CRUD and active-trainer CRUD; archived/unlinked trainer gets zero rows.

- [ ] **Step 1: Add the pinned Supabase CLI**

Run: `pnpm.cmd add -Dw supabase@2.110.0`

Expected: root `package.json` and lockfile pin `2.110.0`.

- [ ] **Step 2: Create the migration with the CLI**

Run: `pnpm.cmd exec supabase migration new linked_client_body_measurements`

Expected: one new timestamped SQL file under `supabase/migrations/`. Use that generated path for the remaining steps.

- [ ] **Step 3: Write the policy migration**

Put this SQL in the generated migration:

```sql
drop policy if exists "user manages own body measurements"
  on public.body_measurements;

create policy "athlete manages own body measurements"
  on public.body_measurements for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "trainer manages linked client body measurements"
  on public.body_measurements for all to authenticated
  using ((select public.trains_client(user_id)))
  with check ((select public.trains_client(user_id)));

grant select, insert, update, delete on public.body_measurements to authenticated;
```

- [ ] **Step 4: Write pgTAP coverage**

Create `supabase/tests/body_measurements_rls.sql` with fixtures for athlete A, athlete B, trainer T, an active T→A link and an archived T→B link. Use 12 named assertions covering: athlete A can select/insert/update/delete their own rows; athlete A cannot select or mutate athlete B; trainer T can select/insert/update/delete athlete A; trainer T cannot see or mutate athlete B after the link is archived; and no update can reassign a measurement from athlete A to athlete B.

```sql
select plan(12);
select is((select count(*) from public.body_measurements), 1::bigint, 'athlete sees own row');
select throws_ok(
  $$ insert into public.body_measurements(user_id, weight_kg) values ('00000000-0000-0000-0000-00000000000b', 80) $$,
  '42501', null, 'athlete cannot write another athlete'
);
-- Switch transaction-local JWT claims between the fixed athlete and trainer
-- fixtures for each of the remaining named assertions, then finish with:
select * from finish();
```

Use transaction-local JWT claims in the same pattern for every role so the test leaves no data behind.

- [ ] **Step 5: Run the database tests**

Run:

```powershell
pnpm.cmd exec supabase start
pnpm.cmd exec supabase db reset
pnpm.cmd exec supabase test db
```

Expected: the new RLS test reports 12 passing assertions.

- [ ] **Step 6: Commit**

```powershell
git add package.json pnpm-lock.yaml supabase/migrations supabase/tests/body_measurements_rls.sql
git commit -m "fix: allow linked trainers to manage measurements"
```

### Task 4: Make the measurements page recoverable

**Files:**
- Create: `apps/web/app/(app)/measurements/page.test.tsx`
- Modify: `apps/web/app/(app)/measurements/page.tsx`

**Interfaces:**
- Consumes: typed measurement functions from Task 2.
- Produces: athlete mode when `client` is absent; trainer mode when `client` exists; loading/error/retry; confirmed deletion.

- [ ] **Step 1: Write failing page tests**

Mock `useSearchParams`, the three data functions, and role guards. Cover:

```ts
it("keeps a measurement visible when delete fails", async () => {
  deleteMeasurementMock.mockResolvedValue({ ok: false, error: "Falha ao remover medição." });
  render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
  await user.click(await screen.findByRole("button", { name: /excluir medição/i }));
  expect(screen.getByText("80 kg")).toBeInTheDocument();
  expect(screen.getByText("Falha ao remover medição.")).toBeInTheDocument();
});

it("retries a failed initial load", async () => {
  listMeasurementsMock
    .mockResolvedValueOnce({ ok: false, error: "Falha ao carregar medições." })
    .mockResolvedValueOnce({ ok: true, measurements: [] });
  render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
  await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));
  expect(listMeasurementsMock).toHaveBeenLastCalledWith("client-a");
});
```

Also cover own athlete mode, trainer heading, successful delete after promise resolution, create/edit target propagation, and disabled mutation controls.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- "app/(app)/measurements/page.test.tsx"`

Expected: FAIL because the page is athlete-only and has no retry state.

- [ ] **Step 3: Implement page state**

Use a single loader:

```ts
const load = useCallback(async () => {
  setLoading(true);
  setLoadError(null);
  const result = await listMeasurements(clientId ?? undefined);
  if (result.ok) setEntries(result.measurements);
  else setLoadError(result.error);
  setLoading(false);
}, [clientId]);
```

Export `MeasurementsContent` for component tests. Remove `RequireAthlete`, preserve `Suspense`, show `Medições de {clientName}` for trainer mode, and call every mutation with the same `clientId`. Only filter a deleted entry after `{ ok: true }`.

- [ ] **Step 4: Run page and full web tests**

Run:

```powershell
pnpm.cmd --filter @bstrainer/web test -- "app/(app)/measurements/page.test.tsx"
pnpm.cmd --filter @bstrainer/web test
pnpm.cmd --filter @bstrainer/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add "apps/web/app/(app)/measurements/page.tsx" "apps/web/app/(app)/measurements/page.test.tsx"
git commit -m "fix: make client measurements recoverable"
```

### Task 5: Verify the vertical journey

**Files:**
- Modify only if verification exposes a defect in files already listed above.

- [ ] **Step 1: Run repository verification**

```powershell
pnpm.cmd --filter @bstrainer/web test
pnpm.cmd --filter @bstrainer/web typecheck
pnpm.cmd --filter @bstrainer/web build
pnpm.cmd test
```

Expected: every command exits 0.

- [ ] **Step 2: Exercise both roles locally**

Use seeded athlete A, linked trainer T and unlinked athlete B. Verify athlete-own CRUD, trainer-linked CRUD, unlinked denial, failed-delete preservation, error retry, and 320/390/1024 px layouts.

- [ ] **Step 3: Record the verification result**

Add the commands, viewport evidence and any discovered defect to the delivery notes. If verification exposes a defect in the files from Tasks 1–4, return to the failing test for that task, fix it, rerun this entire section, and include the correction in that task's commit.
