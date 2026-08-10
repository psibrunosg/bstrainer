# Real Trainer Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover alertas simulados do produto e apresentar somente exceções reais, com falhas distinguíveis de um resultado vazio e retry seguro.

**Architecture:** Carregadores estritos retornam unions discriminadas sem fallback local. O cálculo de alertas consome somente resultados reais. Um componente isolado representa loading, ready e error, preservando alertas reais anteriores durante falha de atualização.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Supabase JS.

## Global Constraints

- Nunca mostrar pessoa, sessão ou alerta simulado na interface de produção.
- Falha de consulta não pode ser interpretada como “zero exceções”.
- Retry preserva alertas reais previamente carregados.
- Não ampliar RLS: as políticas existentes já autorizam as leituras do personal.
- Reutilizar o test harness criado em `2026-08-10-linked-client-measurements.md`.

---

### Task 1: Add strict data loaders for the trainer panel

**Files:**
- Create: `apps/web/lib/data/trainer-alert-sources.test.ts`
- Create: `apps/web/lib/data/trainer-alert-sources.ts`

**Interfaces:**
- Produces:

```ts
export type ClientLinkLoadResult =
  | { ok: true; clients: ClientLink[] }
  | { ok: false; error: string };

export type ClientSessionLoadResult =
  | { ok: true; sessions: WorkoutSession[] }
  | { ok: false; error: string };

export function listActiveClientLinksForAlerts(): Promise<ClientLinkLoadResult>;
export function loadCompletedClientSessionsForAlerts(clientId: string): Promise<ClientSessionLoadResult>;
```

- [ ] **Step 1: Write failing strict-loader tests**

```ts
it("distinguishes an empty link list from a query failure", async () => {
  queryResult({ data: null, error: { message: "offline" } });
  await expect(listActiveClientLinksForAlerts()).resolves.toEqual({
    ok: false,
    error: "Falha ao carregar alunos.",
  });
});

it("never falls back to IndexedDB for another athlete", async () => {
  queryResult({ data: [], error: null });
  await expect(loadCompletedClientSessionsForAlerts("client-a")).resolves.toEqual({
    ok: true,
    sessions: [],
  });
  expect(loadSessionHistoryMock).not.toHaveBeenCalled();
});
```

Also assert `.eq("status", "active")` for links and `.eq("status", "completed")` plus `.eq("client_id", clientId)` for sessions.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/trainer-alert-sources.test.ts`

Expected: FAIL because the source module does not exist.

- [ ] **Step 3: Implement the two loaders**

Use direct Supabase queries and the same DB→domain mapper as `sessions.ts`. Export that mapper from `sessions.ts` as `mapSessionRow` rather than duplicating it. Return Portuguese user-facing errors and never call `loadSessionHistory`.

```ts
export async function loadCompletedClientSessionsForAlerts(
  clientId: string,
): Promise<ClientSessionLoadResult> {
  const { data, error } = await createClient()
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("started_at", { ascending: false });
  if (error) return { ok: false, error: "Falha ao carregar sessões do aluno." };
  return { ok: true, sessions: (data ?? []).map(mapSessionRow) };
}
```

- [ ] **Step 4: Run strict-loader tests**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/trainer-alert-sources.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/data/trainer-alert-sources.ts apps/web/lib/data/trainer-alert-sources.test.ts apps/web/lib/data/sessions.ts
git commit -m "fix: add strict trainer alert sources"
```

### Task 2: Remove demo data and propagate source failures

**Files:**
- Modify: `apps/web/lib/data/trainer-alerts.ts`
- Modify: `apps/web/lib/data/trainer-alerts.test.ts`

**Interfaces:**
- Consumes: strict source functions from Task 1.
- Produces:

```ts
export type AlertLoadResult =
  | { ok: true; alerts: ClientExceptionAlert[] }
  | { ok: false; error: string };

export function getClientExceptionAlerts(): Promise<AlertLoadResult>;
```

- [ ] **Step 1: Replace the demo test with real-result tests**

```ts
it("returns an empty successful result with no active clients", async () => {
  listActiveClientsMock.mockResolvedValue({ ok: true, clients: [] });
  await expect(getClientExceptionAlerts()).resolves.toEqual({ ok: true, alerts: [] });
});

it("never returns simulated identifiers", async () => {
  sourceFixtureWithNoExceptions();
  const result = await getClientExceptionAlerts();
  expect(result).toEqual({ ok: true, alerts: [] });
  expect(JSON.stringify(result)).not.toContain("sim-");
});

it("propagates a session-source failure", async () => {
  listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
  loadSessionsMock.mockResolvedValue({ ok: false, error: "Falha ao carregar sessões do aluno." });
  await expect(getClientExceptionAlerts()).resolves.toEqual({
    ok: false,
    error: "Falha ao carregar sessões do aluno.",
  });
});
```

Add explicit query-error tests for active plan and mesocycles, plus existing inactivity, fatigue, ending-plan and severity-order cases.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/trainer-alerts.test.ts`

Expected: FAIL because current result uses `isDemo` and hides query errors.

- [ ] **Step 3: Implement the discriminated result**

Delete the complete `sim-*` block and `isDemo`. Inspect `error` from both plan and mesocycle queries:

```ts
if (planError) return { ok: false, error: "Falha ao carregar a ficha ativa do aluno." };
if (mesocycleError) return { ok: false, error: "Falha ao carregar o ciclo do aluno." };
```

Return `{ ok: true, alerts }` after severity sorting.

- [ ] **Step 4: Run alert tests**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/trainer-alerts.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/data/trainer-alerts.ts apps/web/lib/data/trainer-alerts.test.ts
git commit -m "fix: remove simulated trainer alerts"
```

### Task 3: Extract and test the alert panel states

**Files:**
- Create: `apps/web/components/ClientAlertsPanel.tsx`
- Create: `apps/web/components/ClientAlertsPanel.test.tsx`

**Interfaces:**
- Consumes:

```ts
export type AlertPanelState =
  | { status: "loading"; alerts: ClientExceptionAlert[] }
  | { status: "ready"; alerts: ClientExceptionAlert[] }
  | { status: "error"; alerts: ClientExceptionAlert[]; error: string };
```

- Produces:

```ts
export function ClientAlertsPanel(props: {
  state: AlertPanelState;
  onRetry: () => void;
}): React.ReactElement;
```

- [ ] **Step 1: Write failing component tests**

```tsx
it("shows an actionable retry on error", async () => {
  const retry = vi.fn();
  render(<ClientAlertsPanel state={{ status: "error", alerts: [], error: "Falha ao atualizar alertas." }} onRetry={retry} />);
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(retry).toHaveBeenCalledTimes(1);
});

it("preserves real alerts while reporting a refresh error", () => {
  render(<ClientAlertsPanel state={{ status: "error", alerts: [realAlert], error: "Falha ao atualizar alertas." }} onRetry={vi.fn()} />);
  expect(screen.getByText(realAlert.clientName)).toBeInTheDocument();
  expect(screen.getByText("Falha ao atualizar alertas.")).toBeInTheDocument();
});
```

Also cover loading skeletons, successful empty state, successful list, and absence of “simulado”/“demo”.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- components/ClientAlertsPanel.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the presentation component**

Move the sidebar markup, severity styles and icons out of `clients/page.tsx`. Render:

- skeletons when loading with no preserved alerts;
- `EmptyState` when ready and empty;
- error banner and Retry button when error;
- preserved or fresh real alert cards whenever `alerts.length > 0`.

- [ ] **Step 4: Run component tests**

Run: `pnpm.cmd --filter @bstrainer/web test -- components/ClientAlertsPanel.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/components/ClientAlertsPanel.tsx apps/web/components/ClientAlertsPanel.test.tsx
git commit -m "refactor: isolate trainer alert states"
```

### Task 4: Wire reliable retry into the trainer workspace

**Files:**
- Modify: `apps/web/app/(app)/clients/page.tsx`
- Create: `apps/web/app/(app)/clients/page.test.tsx`

**Interfaces:**
- Consumes: `AlertLoadResult`, `AlertPanelState`, `ClientAlertsPanel`.
- Produces: real alert count and state-preserving retry.

- [ ] **Step 1: Write failing workspace tests**

Mock `getClientExceptionAlerts` and assert:

```ts
it("keeps previous alerts when refresh fails", async () => {
  getAlertsMock
    .mockResolvedValueOnce({ ok: true, alerts: [realAlert] })
    .mockResolvedValueOnce({ ok: false, error: "Falha ao atualizar alertas." });
  render(<ClientsPage />);
  expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Atualizar alertas" }));
  expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
  expect(screen.getByText("Falha ao atualizar alertas.")).toBeInTheDocument();
});
```

Also assert no hanging skeleton after rejection and that the header count reflects preserved real alerts.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @bstrainer/web test -- "app/(app)/clients/page.test.tsx"`

Expected: FAIL because current `reload` has no error state.

- [ ] **Step 3: Implement `reloadAlerts`**

```ts
const reloadAlerts = useCallback(async () => {
  setAlertState((prev) => ({ status: "loading", alerts: prev.alerts }));
  const result = await getClientExceptionAlerts();
  setAlertState((prev) => result.ok
    ? { status: "ready", alerts: result.alerts }
    : { status: "error", alerts: prev.alerts, error: result.error });
}, []);
```

Keep client-link loading separate, pass `reloadAlerts` to the panel, remove all demo markup, and compute the top count from `alertState.alerts.length`.

- [ ] **Step 4: Run workspace and web tests**

```powershell
pnpm.cmd --filter @bstrainer/web test -- "app/(app)/clients/page.test.tsx"
pnpm.cmd --filter @bstrainer/web test
pnpm.cmd --filter @bstrainer/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add "apps/web/app/(app)/clients/page.tsx" "apps/web/app/(app)/clients/page.test.tsx"
git commit -m "fix: make trainer alert refresh recoverable"
```

### Task 5: Verify real-only behavior

**Files:**
- Modify only files from Tasks 1–4 if verification exposes a defect.

- [ ] **Step 1: Run verification**

```powershell
pnpm.cmd --filter @bstrainer/web test
pnpm.cmd --filter @bstrainer/web typecheck
pnpm.cmd --filter @bstrainer/web build
```

Expected: every command exits 0.

- [ ] **Step 2: Test three live states**

With seeded data, verify: no real exceptions; at least one real inactivity alert; forced network failure followed by successful Retry. Search the rendered DOM for `Simulado`, `Simular`, `Demo` and `sim-`; expected count is zero.

- [ ] **Step 3: Record the verification result**

Add the three live-state outcomes and rendered-DOM search result to the delivery notes. If verification exposes a defect in Tasks 1–4, restore a failing test in the owning task, fix it there, rerun this entire section, and amend that task before review.
