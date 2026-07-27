# Set Logger Table Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-draft-plus-read-only-list set logger in `ExerciseBlockCard.tsx` with a dense per-set table (SÉRIE/ANTERIOR/KG/REPS/PSE/✓), matching the approved design spec at `docs/superpowers/specs/2026-07-27-set-logger-table-design.md`.

**Architecture:** One row per set, addressed purely by index — no `rowId` map of individual drafts keyed loosely. At any moment an exercise has exactly one **active** row (`index === exercise.sets.length`, i.e. the next unconfirmed set), zero or more **confirmed** rows before it (`index < exercise.sets.length`, backed by real `PerformedSet`s), and zero or more **preview** rows after it (`index > exercise.sets.length`, read-only display of upcoming targets, from pre-created plan rows or manual "+ Adicionar Série" additions). Only the active row is interactively editable and confirmable. Only the most recently confirmed row (the one immediately before the active row) can be reopened for editing — reopening pops it off `exercise.sets`, which makes it the active row again by definition, so no separate "editing" state or index bookkeeping is needed. Only the trailing preview row can be deleted (undoes an unwanted "+ Adicionar Série" or an unwanted extra plan-prescribed set). This keeps `exercise.sets` append/pop-from-the-end only — no mid-array insertion or reordering logic anywhere.

**Known, deliberate constraints (not gaps to "fix" later without discussion):**
- Editing is only possible for the single most-recently-confirmed row. Earlier confirmed rows are permanently locked once a later row is confirmed. Full arbitrary-row editing would require reordering-safe set storage — out of scope.
- Un-confirming a row that had triggered a PR badge does not retract the badge (`prHit` state isn't touched by `editLastConfirmedRow`). Rare, low-stakes edge case; not handled.
- Confirming a row always requires `reps > 0`; load and PSE stay optional (bodyweight exercises, PSE not always tracked).

**Tech Stack:** Next.js 15 / React 19 (existing), no new UI dependency. Vitest (already used in `packages/engine` and `packages/domain`) added to `apps/web` for two new pure-logic unit test files — this is the only new devDependency in the whole plan.

## Global Constraints

- Existing code style: 2-space indent, double quotes, no semicolon changes beyond what's already in each file — match surrounding style exactly.
- `formatKg(kg: number): string` (comma-decimal formatting) already exists in `ExerciseBlockCard.tsx` — reuse it, don't reintroduce it.
- No React component test runner exists or is being added — acceptance for UI changes is `pnpm --filter @bstrainer/web typecheck`, `pnpm --filter @bstrainer/web build`, and manual browser verification only.
- Every task must leave the repo typechecking and building — don't move to the next task on a red typecheck.

---

### Task 1: `lastSessionSetsFor` — per-index history lookup, with vitest set up in `apps/web`

**Files:**
- Modify: `apps/web/package.json` (add `vitest` devDependency + `test` script)
- Modify: `apps/web/lib/workout/history-lookup.ts` (add `lastSessionSetsFor`)
- Create: `apps/web/lib/workout/history-lookup.test.ts`

**Interfaces:**
- Produces: `lastSessionSetsFor(exerciseId: string): Promise<LastPerformance[] | null>` — ordered array of non-warmup work sets from the athlete's most recent completed session containing that exercise, or `null` if no such session exists. `LastPerformance` (existing type: `{ loadKg: number | null; reps: number; date: string }`) is reused unchanged.

- [ ] **Step 1: Add vitest to `apps/web`**

Edit `apps/web/package.json`:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
```

(add `"test": "vitest run"` after `"typecheck"`)

```json
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
```

(add `"vitest": "^3.1.0"` — same version already resolved for `packages/engine`, so this is a cache hit, no new version resolution)

Run: `pnpm install`
Expected: exits 0, no new package versions fetched (vitest@3.1.0 already in the lockfile from `packages/engine`)

- [ ] **Step 2: Write the failing test**

Create `apps/web/lib/workout/history-lookup.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { WorkoutSession } from "@bstrainer/domain";

const EXERCISE_A = "11111111-1111-4111-8111-111111111111";
const EXERCISE_B = "22222222-2222-4222-8222-222222222222";

function session(overrides: Partial<WorkoutSession> & { startedAt: string }): WorkoutSession {
  return {
    id: crypto.randomUUID(),
    clientId: "00000000-0000-4000-8000-000000000001",
    workoutTemplateId: null,
    finishedAt: null,
    status: "completed",
    sessionRpe: null,
    readiness: null,
    notes: null,
    blocks: [],
    ...overrides,
  };
}

vi.mock("./storage", () => ({
  loadSessionHistory: vi.fn(),
}));

describe("lastSessionSetsFor", () => {
  it("returns the ordered work sets (no warmups) from the most recent completed session with that exercise", async () => {
    const { loadSessionHistory } = await import("./storage");
    vi.mocked(loadSessionHistory).mockResolvedValue([
      session({
        startedAt: "2026-07-20T10:00:00.000Z",
        blocks: [
          {
            kind: "exercise",
            id: crypto.randomUUID(),
            exerciseId: EXERCISE_A,
            prescribedExerciseId: null,
            order: 1,
            wasSubstituted: false,
            sets: [
              { id: crypto.randomUUID(), order: 1, reps: 12, loadKg: 20, rpe: null, rir: null, isFailure: false, isWarmup: true, timeSeconds: null, notes: null },
              { id: crypto.randomUUID(), order: 2, reps: 10, loadKg: 30, rpe: 8, rir: null, isFailure: false, isWarmup: false, timeSeconds: null, notes: null },
              { id: crypto.randomUUID(), order: 3, reps: 8, loadKg: 32.5, rpe: 9, rir: null, isFailure: false, isWarmup: false, timeSeconds: null, notes: null },
            ],
          },
        ],
      }),
    ]);

    const { lastSessionSetsFor } = await import("./history-lookup");
    const result = await lastSessionSetsFor(EXERCISE_A);

    expect(result).toEqual([
      { loadKg: 30, reps: 10, date: "2026-07-20T10:00:00.000Z" },
      { loadKg: 32.5, reps: 8, date: "2026-07-20T10:00:00.000Z" },
    ]);
  });

  it("returns null when no completed session contains the exercise", async () => {
    const { loadSessionHistory } = await import("./storage");
    vi.mocked(loadSessionHistory).mockResolvedValue([
      session({ startedAt: "2026-07-20T10:00:00.000Z", blocks: [] }),
    ]);

    const { lastSessionSetsFor } = await import("./history-lookup");
    const result = await lastSessionSetsFor(EXERCISE_B);

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2b: Run test to verify it fails**

Run: `pnpm --filter @bstrainer/web exec vitest run lib/workout/history-lookup.test.ts`
Expected: FAIL — `lastSessionSetsFor is not exported` / `is not a function`

- [ ] **Step 3: Implement `lastSessionSetsFor`**

In `apps/web/lib/workout/history-lookup.ts`, add after `lastPerformanceFor` (after line 33, before `bestHistoricalE1rm`):

```typescript
/**
 * Todas as séries de trabalho (sem warmup) da última sessão completa que
 * registrou este exercício, em ordem — usado como "anterior" por linha no
 * logger em tabela (série N mostra o que foi feito na série N da última vez).
 */
export async function lastSessionSetsFor(
  exerciseId: string,
): Promise<LastPerformance[] | null> {
  const history = (await loadSessionHistory())
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const session of history) {
    for (const ex of session.blocks.filter(isPerformedExercise)) {
      if (ex.exerciseId !== exerciseId) continue;
      const workSets = ex.sets.filter((s) => !s.isWarmup);
      if (workSets.length === 0) continue;
      return workSets.map((s) => ({
        loadKg: s.loadKg,
        reps: s.reps,
        date: session.startedAt,
      }));
    }
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @bstrainer/web exec vitest run lib/workout/history-lookup.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: exits 0, no errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/lib/workout/history-lookup.ts apps/web/lib/workout/history-lookup.test.ts
git commit -m "Add lastSessionSetsFor for per-set-index history lookup"
```

---

### Task 2: `buildSetRows` — pure row-state-machine function

**Files:**
- Create: `apps/web/lib/workout/set-rows.ts`
- Create: `apps/web/lib/workout/set-rows.test.ts`

**Interfaces:**
- Consumes: `PerformedSet`, `PrescribedSet` (from `@bstrainer/domain`), `LastPerformance` (from `./history-lookup`).
- Produces: `type SetRow`, `type SetDraft`, `function buildSetRows(params): SetRow[]` — used by Task 3's `rowsFor`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/workout/set-rows.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildSetRows } from "./set-rows";
import type { PerformedSet } from "@bstrainer/domain";

function set(reps: number, loadKg: number | null): PerformedSet {
  return {
    id: crypto.randomUUID(),
    order: 1,
    reps,
    loadKg,
    rpe: null,
    rir: null,
    isFailure: false,
    isWarmup: false,
    timeSeconds: null,
    notes: null,
  };
}

describe("buildSetRows", () => {
  it("marks rows before the confirmed count as confirmed, the next one as active, the rest as preview", () => {
    const rows = buildSetRows({
      confirmedSets: [set(10, 30), set(8, 32.5)],
      rowCount: 4,
      targetAt: () => undefined,
      anteriorAt: () => undefined,
      draftAt: () => ({ reps: 8, load: "", rpe: "" }),
    });

    expect(rows.map((r) => r.state)).toEqual(["confirmed", "confirmed", "active", "preview"]);
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2, 3]);
    expect(rows[0].confirmedSet?.reps).toBe(10);
    expect(rows[1].confirmedSet?.reps).toBe(8);
    expect(rows[2].draft).toEqual({ reps: 8, load: "", rpe: "" });
  });

  it("always includes an active row even when rowCount is behind the confirmed count", () => {
    const rows = buildSetRows({
      confirmedSets: [set(10, 30), set(8, 32.5), set(6, 35)],
      rowCount: 1,
      targetAt: () => undefined,
      anteriorAt: () => undefined,
      draftAt: () => ({ reps: 8, load: "", rpe: "" }),
    });

    expect(rows.map((r) => r.state)).toEqual(["confirmed", "confirmed", "confirmed", "active"]);
    expect(rows).toHaveLength(4);
  });

  it("with zero confirmed sets and rowCount 1, produces a single active row", () => {
    const rows = buildSetRows({
      confirmedSets: [],
      rowCount: 1,
      targetAt: () => undefined,
      anteriorAt: () => undefined,
      draftAt: () => ({ reps: 8, load: "", rpe: "" }),
    });

    expect(rows.map((r) => r.state)).toEqual(["active"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @bstrainer/web exec vitest run lib/workout/set-rows.test.ts`
Expected: FAIL — cannot find module `./set-rows`

- [ ] **Step 3: Implement `buildSetRows`**

Create `apps/web/lib/workout/set-rows.ts`:

```typescript
import type { PerformedSet, PrescribedSet } from "@bstrainer/domain";
import type { LastPerformance } from "./history-lookup";

export interface SetDraft {
  reps: number;
  load: string;
  rpe: string;
}

export type SetRowState = "confirmed" | "active" | "preview";

export interface SetRow {
  index: number;
  state: SetRowState;
  target?: PrescribedSet;
  anterior?: LastPerformance;
  confirmedSet?: PerformedSet;
  draft?: SetDraft;
}

/**
 * Monta a lista de linhas da tabela de séries a partir do estado bruto:
 * índices < confirmedSets.length são `confirmed` (dado real), o próximo
 * índice é sempre `active` (editável, único ponto de confirmação), e
 * qualquer índice além disso é `preview` (só leitura, meta futura).
 */
export function buildSetRows(params: {
  confirmedSets: PerformedSet[];
  rowCount: number;
  targetAt: (index: number) => PrescribedSet | undefined;
  anteriorAt: (index: number) => LastPerformance | undefined;
  draftAt: (index: number) => SetDraft;
}): SetRow[] {
  const { confirmedSets, rowCount, targetAt, anteriorAt, draftAt } = params;
  const total = Math.max(rowCount, confirmedSets.length + 1);
  const rows: SetRow[] = [];

  for (let index = 0; index < total; index++) {
    if (index < confirmedSets.length) {
      rows.push({
        index,
        state: "confirmed",
        confirmedSet: confirmedSets[index],
        target: targetAt(index),
        anterior: anteriorAt(index),
      });
    } else if (index === confirmedSets.length) {
      rows.push({
        index,
        state: "active",
        draft: draftAt(index),
        target: targetAt(index),
        anterior: anteriorAt(index),
      });
    } else {
      rows.push({
        index,
        state: "preview",
        target: targetAt(index),
        anterior: anteriorAt(index),
      });
    }
  }

  return rows;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @bstrainer/web exec vitest run lib/workout/set-rows.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: exits 0

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/workout/set-rows.ts apps/web/lib/workout/set-rows.test.ts
git commit -m "Add buildSetRows pure row-state-machine for the set logger table"
```

---

### Task 3: Wire row state into `use-workout-session.ts`

**Files:**
- Modify: `apps/web/lib/workout/use-workout-session.ts`

**Interfaces:**
- Consumes: `buildSetRows`, `SetRow`, `SetDraft` from `./set-rows` (Task 2); `lastSessionSetsFor` from `./history-lookup` (Task 1).
- Produces (new/changed exports from `useWorkoutSession()`): `lastSessionSets: Record<string, LastPerformance[] | null>`, `rowsFor(rowId: string, exerciseId: string): SetRow[]`, `setDraftAt(rowId: string, exerciseId: string, index: number, patch: Partial<SetDraft>): void`, `confirmActiveRow(rowId: string, exerciseId: string): void`, `editLastConfirmedRow(rowId: string): void`, `addRow(rowId: string): void`, `removeTrailingRow(rowId: string): void`.
- Removes from the returned object: `draftFor`, `setDraft`, `targetSetFor`, `repeatLastSet`, `removeSet` (no remaining callers after Task 5 — Task 5 rewires `session/page.tsx` off all five).

- [ ] **Step 1: Add `SetDraft`/`SetRow` re-export and new imports**

In `apps/web/lib/workout/use-workout-session.ts`, replace lines 1–34 (the top of the file through `parseLoad`) with:

```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import {
  isPerformedExercise,
  type PerformedActivity,
  type PerformedCircuit,
  type PerformedExercise,
  type PerformedSet,
  type PrescribedSet,
  type WorkoutBlock,
  type WorkoutSession,
} from "@bstrainer/domain";
import { fetchWorkoutTemplate, type NextWorkout } from "@/lib/data/active-plan";
import { e1rmEpley } from "@bstrainer/engine";
import type { ExerciseOption } from "@/lib/data/plans";
import { syncSession } from "@/lib/workout/sync";
import {
  bestHistoricalE1rm,
  lastPerformanceFor,
  lastSessionSetsFor,
  type LastPerformance,
} from "@/lib/workout/history-lookup";
import { buildSetRows, type SetDraft, type SetRow } from "@/lib/workout/set-rows";
import {
  appendToSessionHistory,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";

export type { SetDraft, SetRow } from "@/lib/workout/set-rows";

function parseLoad(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
```

- [ ] **Step 2: Add `lastSessionSets` state and load it alongside `lastPerf`**

In the `useWorkoutSession` function body, after the existing `lastPerf` state declaration (originally line 49), add:

```typescript
  // Todas as séries da última sessão por exercício — "anterior" por linha na tabela
  const [lastSessionSets, setLastSessionSets] = useState<Record<string, LastPerformance[] | null>>({});
```

Then, in the `useEffect` that loads `active` session data (originally lines 69–93), inside the `for (const ex of active.blocks.filter(isPerformedExercise))` loop, add the new lookup alongside the existing two:

```typescript
      if (active) {
        const perf: Record<string, LastPerformance | null> = {};
        const perfSets: Record<string, LastPerformance[] | null> = {};
        for (const ex of active.blocks.filter(isPerformedExercise)) {
          perf[ex.exerciseId] = await lastPerformanceFor(ex.exerciseId);
          perfSets[ex.exerciseId] = await lastSessionSetsFor(ex.exerciseId);
          prBaseline.current[ex.exerciseId] = await bestHistoricalE1rm(ex.exerciseId);
        }
        setLastPerf(perf);
        setLastSessionSets(perfSets);
```

(this replaces the original `setLastPerf(perf);` line — everything else in that effect is unchanged)

Also update `addExercise` (originally lines 135–152) to populate `lastSessionSets` for a freshly added exercise, right after the existing `setLastPerf` call:

```typescript
  async function addExercise(exerciseId: string) {
    const last = await lastPerformanceFor(exerciseId);
    setLastPerf((prev) => ({ ...prev, [exerciseId]: last }));
    const lastSets = await lastSessionSetsFor(exerciseId);
    setLastSessionSets((prev) => ({ ...prev, [exerciseId]: lastSets }));
    prBaseline.current[exerciseId] = await bestHistoricalE1rm(exerciseId);
```

(rest of `addExercise` unchanged)

- [ ] **Step 3: Replace `drafts` shape and the singular draft/target functions**

Replace the existing `drafts` state declaration:

```typescript
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
```

with:

```typescript
  const [drafts, setDrafts] = useState<Record<string, Record<number, SetDraft>>>({});
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
```

Replace the entire `targetSetFor` / `draftFor` / `setDraft` block (originally lines 102–133) with:

```typescript
  function targetSetAt(rowId: string, index: number): PrescribedSet | undefined {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || !block.prescribedExerciseId) return undefined;
    const prescribed = prescribedById[block.prescribedExerciseId];
    if (!prescribed || prescribed.kind !== "exercise") return undefined;
    return prescribed.sets[index] ?? prescribed.sets[prescribed.sets.length - 1];
  }

  function plannedRowCount(rowId: string): number {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || !block.prescribedExerciseId) return 1;
    const prescribed = prescribedById[block.prescribedExerciseId];
    if (!prescribed || prescribed.kind !== "exercise") return 1;
    return Math.max(prescribed.sets.length, 1);
  }

  function rowCountFor(rowId: string): number {
    return rowCounts[rowId] ?? plannedRowCount(rowId);
  }

  function draftForIndex(rowId: string, exerciseId: string, index: number): SetDraft {
    const existing = drafts[rowId]?.[index];
    if (existing) return existing;
    const target = targetSetAt(rowId, index);
    if (target) {
      return {
        reps: target.repsMin,
        load:
          target.loadMethod === "absolute" && target.loadValue != null
            ? String(target.loadValue)
            : "",
        rpe: target.targetRpe != null ? String(target.targetRpe) : "",
      };
    }
    const anterior = lastSessionSets[exerciseId]?.[index];
    if (anterior) {
      return {
        reps: anterior.reps,
        load: anterior.loadKg != null ? String(anterior.loadKg) : "",
        rpe: "",
      };
    }
    const last = lastPerf[exerciseId];
    return { reps: last?.reps ?? 8, load: "", rpe: "" };
  }

  function setDraftAt(rowId: string, exerciseId: string, index: number, patch: Partial<SetDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] ?? {}),
        [index]: { ...draftForIndex(rowId, exerciseId, index), ...patch },
      },
    }));
  }

  function rowsFor(rowId: string, exerciseId: string): SetRow[] {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise") return [];
    return buildSetRows({
      confirmedSets: block.sets,
      rowCount: rowCountFor(rowId),
      targetAt: (index) => targetSetAt(rowId, index),
      anteriorAt: (index) => lastSessionSets[exerciseId]?.[index],
      draftAt: (index) => draftForIndex(rowId, exerciseId, index),
    });
  }

  function addRow(rowId: string) {
    setRowCounts((prev) => ({ ...prev, [rowId]: (prev[rowId] ?? plannedRowCount(rowId)) + 1 }));
  }

  function removeTrailingRow(rowId: string) {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise") return;
    const count = rowCountFor(rowId);
    if (count - 1 <= block.sets.length) return;
    setRowCounts((prev) => ({ ...prev, [rowId]: count - 1 }));
  }
```

- [ ] **Step 4: Replace `confirmSet`/`repeatLastSet` with `confirmActiveRow`/`editLastConfirmedRow`**

Replace the existing `confirmSet` function and the `repeatLastSet` function (originally lines 213–240) with:

```typescript
  function confirmActiveRow(rowId: string, exerciseId: string) {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise") return;
    const index = block.sets.length;
    const d = draftForIndex(rowId, exerciseId, index);
    if (d.reps <= 0) return;
    appendSet(rowId, exerciseId, {
      reps: d.reps,
      loadKg: parseLoad(d.load),
      rpe: d.rpe === "" ? null : Number(d.rpe),
      rir: null,
      isFailure: false,
      isWarmup: false,
      timeSeconds: null,
      notes: null,
    });
    setDrafts((prev) => {
      const rowDrafts = { ...(prev[rowId] ?? {}) };
      delete rowDrafts[index];
      return { ...prev, [rowId]: rowDrafts };
    });
  }

  // ponytail: só a série confirmada mais recente pode reabrir pra edição —
  // reabrir "sobe" um índice arbitrário no meio da lista exigiria reordenar
  // sets com furos, fora de escopo. Editar uma série antiga exige apagar as
  // posteriores primeiro.
  function editLastConfirmedRow(rowId: string) {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || block.sets.length === 0) return;
    const index = block.sets.length - 1;
    const popped = block.sets[index];
    setDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] ?? {}),
        [index]: {
          reps: popped.reps,
          load: popped.loadKg != null ? String(popped.loadKg) : "",
          rpe: popped.rpe != null ? String(popped.rpe) : "",
        },
      },
    }));
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) =>
        e.kind === "exercise" && e.id === rowId ? { ...e, sets: e.sets.slice(0, -1) } : e,
      );
      return { ...prev, blocks };
    });
  }
```

- [ ] **Step 5: Remove `removeSet`, update the returned object**

Delete the `removeSet` function entirely (originally lines 268–280).

Replace the `return { ... }` block at the end of the hook (originally lines 297–318) with:

```typescript
  return {
    session,
    loaded,
    finished,
    lastPerf,
    lastSessionSets,
    prHit,
    substituteOverride,
    prescribedById,
    activityInfo,
    rowsFor,
    setDraftAt,
    addRow,
    removeTrailingRow,
    addExercise,
    removeExercise,
    applySubstitute,
    confirmActiveRow,
    editLastConfirmedRow,
    updateActivity,
    updateCircuit,
    finishSession,
  };
}
```

- [ ] **Step 6: Typecheck (expect errors — `session/page.tsx` and `ExerciseBlockCard.tsx` still reference removed exports; that's Tasks 4–5)**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: FAILS, errors only in `apps/web/app/(app)/train/session/page.tsx` and `apps/web/components/train/ExerciseBlockCard.tsx` (missing `s.draftFor`, `s.targetSetFor`, `s.confirmSet`, `s.repeatLastSet`, `s.removeSet`, and the `ExerciseBlockCard` props mismatch). No errors anywhere else. This confirms the hook change itself is internally consistent — the remaining errors are exactly the two files Tasks 4 and 5 fix next.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/workout/use-workout-session.ts
git commit -m "Rework use-workout-session for index-addressed set rows"
```

---

### Task 4: Rewrite `ExerciseBlockCard.tsx` as a set table

**Files:**
- Modify: `apps/web/components/train/ExerciseBlockCard.tsx` (full rewrite of the component body; header JSX and substitution-picker JSX are carried over unchanged)

**Interfaces:**
- Consumes: `SetRow`, `SetDraft` from `@/lib/workout/use-workout-session` (Task 3's re-export); `PerformedExercise` from `@bstrainer/domain`; `LastPerformance` from `@/lib/workout/history-lookup`.
- Produces: new `ExerciseBlockCard` prop contract — `{ exercise, displayName, mediaSrc, last, prE1rm, rows, onDraftChange(index, patch), onConfirmActive(), onEditLast(), onAddRow(), onRemoveTrailingRow(), onRemove(), onOpenPlateCalc(kg), onSubstitute(option) }`. `draft`, `target`, `onConfirmSet`, `onRepeatLastSet`, `onRemoveSet` are removed from the prop contract.

- [ ] **Step 1: Replace the whole file**

Replace the full contents of `apps/web/components/train/ExerciseBlockCard.tsx` with:

```typescript
"use client";

import { useState } from "react";
import type { PerformedExercise, PrescribedSet } from "@bstrainer/domain";
import { e1rmEpley } from "@bstrainer/engine";
import { getSubstitutes } from "@/lib/data/substitutions";
import type { ExerciseOption } from "@/lib/data/plans";
import type { LastPerformance } from "@/lib/workout/history-lookup";
import type { SetDraft, SetRow } from "@/lib/workout/use-workout-session";
import { publicAssetPath } from "@/lib/public-asset";

const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
const ROW_GRID = "grid-cols-[24px_58px_1fr_1fr_52px_40px]";

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace(".", ",");
}

function anteriorLabel(a?: LastPerformance): string {
  if (!a) return "—";
  return a.loadKg != null ? `${formatKg(a.loadKg)}kg×${a.reps}` : `${a.reps} reps`;
}

function bestE1rm(exercise: PerformedExercise): number {
  let best = 0;
  for (const set of exercise.sets) {
    if (set.isWarmup || set.loadKg == null) continue;
    const e = e1rmEpley(set.loadKg, set.reps);
    if (e > best) best = e;
  }
  return best;
}

export function ExerciseBlockCard({
  exercise,
  displayName,
  mediaSrc,
  last,
  prE1rm,
  rows,
  onDraftChange,
  onConfirmActive,
  onEditLast,
  onAddRow,
  onRemoveTrailingRow,
  onRemove,
  onOpenPlateCalc,
  onSubstitute,
}: {
  exercise: PerformedExercise;
  displayName: string;
  mediaSrc: string | null;
  last: LastPerformance | null;
  prE1rm?: number;
  rows: SetRow[];
  onDraftChange: (index: number, patch: Partial<SetDraft>) => void;
  onConfirmActive: () => void;
  onEditLast: () => void;
  onAddRow: () => void;
  onRemoveTrailingRow: () => void;
  onRemove: () => void;
  onOpenPlateCalc: (kg: number) => void;
  onSubstitute: (option: ExerciseOption) => void;
}) {
  // ponytail: picker state is now per-card (was page-level before this
  // extraction), so opening the picker on a second card no longer closes
  // the first one — a deliberate, harmless behavior change.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pseRowIndex, setPseRowIndex] = useState<number | null>(null);

  function openPicker() {
    setPickerOpen(true);
    setOptions([]);
    setLoading(true);
    getSubstitutes(exercise.exerciseId).then((opts) => {
      setOptions(opts);
      setLoading(false);
    });
  }

  function closePicker() {
    setPickerOpen(false);
    setOptions([]);
  }

  const e1rm = bestE1rm(exercise);
  const activeRow = rows.find((r) => r.state === "active");
  const target: PrescribedSet | undefined = activeRow?.target;
  const lastRowIndex = rows.length > 0 ? rows[rows.length - 1].index : -1;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface lg:grid lg:grid-cols-[minmax(240px,340px)_1fr]">
      {mediaSrc && (
        <div className="border-b border-line bg-ink lg:border-b-0 lg:border-r">
          <img
            src={mediaSrc}
            alt=""
            loading="lazy"
            className="h-52 w-full object-contain lg:h-full lg:min-h-[320px]"
          />
        </div>
      )}

      <div className="space-y-3 p-4 lg:p-5">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">
            {displayName}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {e1rm > 0 && (
              <span className="tnum text-xs text-mute">
                e1RM {formatKg(Math.round(e1rm * 10) / 10)} kg
              </span>
            )}
            {last?.loadKg != null && (
              <span className="tnum text-xs text-mute">
                Última: {formatKg(last.loadKg)} kg × {last.reps}
              </span>
            )}
            {target && (
              <span className="tnum rounded-full border border-signal/30 bg-signal/5 px-2 py-0.5 text-xs text-signal">
                Meta: {target.repsMin}
                {target.repsMax !== target.repsMin && `–${target.repsMax}`}
                {target.loadMethod === "rir" && target.targetRir != null && ` · RIR ${target.targetRir}`}
                {target.loadMethod === "rpe" && target.targetRpe != null && ` · RPE ${target.targetRpe}`}
                {target.loadMethod === "percent_1rm" && target.loadValue != null && ` · ${target.loadValue}% 1RM`}
                {" · "}
                desc {target.restSeconds}s
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={openPicker}
            aria-label={`Trocar ${displayName}`}
            className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
          >
            ⇄
          </button>
          {prE1rm != null ? (
            <span className="animate-pr-pop rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold">
              PR · {formatKg(Math.round(prE1rm * 10) / 10)} kg
            </span>
          ) : (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${displayName}`}
              className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Trocar exercício */}
      {pickerOpen && (
        <div className="space-y-2 rounded-lg border border-line bg-ink p-3">
          <div className="flex items-center justify-between">
            <p className="caps-label text-mute">Trocar por</p>
            <button
              type="button"
              onClick={closePicker}
              aria-label="Fechar troca"
              className="h-8 w-8 rounded text-mute transition active:bg-surface-2"
            >
              ✕
            </button>
          </div>
          {loading && (
            <p className="px-1 py-2 text-sm text-mute">Buscando…</p>
          )}
          {!loading && options.length === 0 && (
            <p className="px-1 py-2 text-sm text-mute">
              Sem substitutos cadastrados pra este exercício.
            </p>
          )}
          {!loading &&
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSubstitute(opt);
                  closePicker();
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition active:bg-surface-2"
              >
                {publicAssetPath(opt.mediaUrl) && (
                  <img
                    src={publicAssetPath(opt.mediaUrl) ?? ""}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded border border-line bg-ink object-contain"
                  />
                )}
                <span>{opt.name}</span>
              </button>
            ))}
        </div>
      )}

      {/* Tabela de séries */}
      <div className="space-y-1">
        <div className={`grid ${ROW_GRID} gap-1.5 px-1 text-[10px] uppercase tracking-wide text-mute`}>
          <span>Série</span>
          <span>Anterior</span>
          <span>Kg</span>
          <span>Reps</span>
          <span>PSE</span>
          <span />
        </div>

        {rows.map((row) => {
          if (row.state === "confirmed") {
            const canEdit = row.index === exercise.sets.length - 1;
            return (
              <div
                key={row.index}
                className={`grid h-11 ${ROW_GRID} items-center gap-1.5 rounded border border-line/60 bg-ink/40 px-1 text-sm`}
              >
                <span className="caps-label text-mute">{row.index + 1}</span>
                <span className="tnum text-xs text-mute">{anteriorLabel(row.anterior)}</span>
                <span className="tnum text-center font-display font-semibold text-mute">
                  {row.confirmedSet?.loadKg != null ? formatKg(row.confirmedSet.loadKg) : "—"}
                </span>
                <span className="tnum text-center font-display font-semibold text-mute">
                  {row.confirmedSet?.reps}
                </span>
                <span className="tnum text-center text-xs text-mute">
                  {row.confirmedSet?.rpe ?? "—"}
                </span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={onEditLast}
                    aria-label={`Editar série ${row.index + 1}`}
                    className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-signal text-sm font-bold text-ink transition active:scale-95"
                  >
                    ✓
                  </button>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-signal/40 text-sm font-bold text-ink">
                    ✓
                  </span>
                )}
              </div>
            );
          }

          if (row.state === "preview") {
            const canRemove = row.index === lastRowIndex;
            return (
              <div
                key={row.index}
                className={`grid h-11 ${ROW_GRID} items-center gap-1.5 px-1 text-sm text-mute/60`}
              >
                <span className="caps-label">{row.index + 1}</span>
                <span className="tnum text-xs">{anteriorLabel(row.anterior)}</span>
                <span className="tnum text-center">
                  {row.target?.loadMethod === "absolute" && row.target.loadValue != null
                    ? formatKg(row.target.loadValue)
                    : "—"}
                </span>
                <span className="tnum text-center">{row.target?.repsMin ?? "—"}</span>
                <span className="tnum text-center">{row.target?.targetRpe ?? "—"}</span>
                {canRemove ? (
                  <button
                    type="button"
                    onClick={onRemoveTrailingRow}
                    aria-label={`Remover linha ${row.index + 1}`}
                    className="flex h-9 w-9 items-center justify-center justify-self-end rounded text-mute transition active:bg-surface-2"
                  >
                    ✕
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          }

          // active
          const draft = row.draft ?? { reps: 0, load: "", rpe: "" };
          const parsedLoad = Number(draft.load.trim().replace(",", "."));
          return (
            <div
              key={row.index}
              className={`grid ${ROW_GRID} items-center gap-1.5 rounded border border-signal/40 bg-ink px-1 py-1`}
            >
              <span className="caps-label text-signal">{row.index + 1}</span>
              <span className="tnum text-xs text-mute">{anteriorLabel(row.anterior)}</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={row.anterior?.loadKg != null ? formatKg(row.anterior.loadKg) : "kg"}
                  value={draft.load}
                  onChange={(e) => onDraftChange(row.index, { load: e.target.value })}
                  className="h-10 w-full rounded border border-line bg-surface px-1 pr-6 text-center font-display text-sm font-semibold outline-none transition-colors placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-mute focus:border-signal"
                />
                {Number.isFinite(parsedLoad) && parsedLoad > 20 && (
                  <button
                    type="button"
                    onClick={() => onOpenPlateCalc(parsedLoad)}
                    aria-label="Calcular anilhas"
                    className="absolute right-0 top-1/2 flex h-8 w-6 -translate-y-1/2 items-center justify-center text-mute"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M3 12h2" strokeLinecap="round" />
                      <path d="M19 12h2" strokeLinecap="round" />
                      <rect x="6" y="8" width="3" height="8" rx="0.5" />
                      <rect x="15" y="8" width="3" height="8" rx="0.5" />
                      <path d="M9 12h6" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="reps"
                value={draft.reps === 0 ? "" : String(draft.reps)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  onDraftChange(row.index, { reps: digits === "" ? 0 : Number(digits) });
                }}
                className="h-10 w-full rounded border border-line bg-surface px-1 text-center font-display text-sm font-semibold outline-none transition-colors placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-mute focus:border-signal"
              />
              <button
                type="button"
                onClick={() => setPseRowIndex(row.index)}
                className="h-10 rounded border border-line bg-surface text-xs font-semibold text-mute transition active:bg-surface-2"
              >
                {draft.rpe || "PSE"}
              </button>
              <button
                type="button"
                onClick={onConfirmActive}
                disabled={draft.reps <= 0}
                aria-label={`Confirmar série ${row.index + 1}`}
                className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-signal text-sm font-bold text-signal transition active:scale-95 active:bg-signal/10 disabled:opacity-30"
              >
                ✓
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddRow}
          className="h-10 w-full rounded-lg border border-dashed border-line text-sm text-mute transition active:bg-surface-2"
        >
          + Adicionar Série
        </button>
      </div>

      {pseRowIndex != null && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-ink/60"
          onClick={() => setPseRowIndex(null)}
        >
          <div
            className="w-full space-y-2 rounded-t-xl border-t border-line bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="caps-label text-mute">PSE (esforço percebido)</p>
            <div className="grid grid-cols-3 gap-2">
              {RPE_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    onDraftChange(pseRowIndex, { rpe: o });
                    setPseRowIndex(null);
                  }}
                  className="h-14 rounded-lg border border-line font-display text-lg font-semibold transition active:bg-surface-2"
                >
                  {o}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                onDraftChange(pseRowIndex, { rpe: "" });
                setPseRowIndex(null);
              }}
              className="h-11 w-full rounded-lg text-sm text-mute transition active:bg-surface-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck (expect errors only in `session/page.tsx` now)**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: FAILS, errors only in `apps/web/app/(app)/train/session/page.tsx` (still passing the old prop names). No errors in `ExerciseBlockCard.tsx` itself.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/train/ExerciseBlockCard.tsx
git commit -m "Rewrite ExerciseBlockCard as a dense per-set table"
```

---

### Task 5: Wire `session/page.tsx` to the new hook/component contract

**Files:**
- Modify: `apps/web/app/(app)/train/session/page.tsx:51-60` (the `confirmSet`/`repeatLastSet` wrapper functions) and `apps/web/app/(app)/train/session/page.tsx:166-184` (the `ExerciseBlockCard` usage)

**Interfaces:**
- Consumes: `s.rowsFor`, `s.setDraftAt`, `s.addRow`, `s.removeTrailingRow`, `s.confirmActiveRow`, `s.editLastConfirmedRow` from Task 3's hook; the new `ExerciseBlockCard` prop contract from Task 4.

- [ ] **Step 1: Replace the rest-timer wrapper functions**

Replace (originally lines 51–60):

```typescript
  // ponytail: the one coupling appendSet used to own (start rest after a set
  // is logged) — hook dropped it, so the page wires it back for both append paths.
  const confirmSet = (rowId: string, exerciseId: string) => {
    s.confirmSet(rowId, exerciseId);
    rest.start();
  };
  const repeatLastSet = (ex: PerformedExercise) => {
    s.repeatLastSet(ex);
    rest.start();
  };
```

with:

```typescript
  // ponytail: the one coupling confirmActiveRow used to own (start rest after
  // a set is logged) — hook doesn't own timers, so the page wires it back.
  const confirmActiveRow = (rowId: string, exerciseId: string) => {
    s.confirmActiveRow(rowId, exerciseId);
    rest.start();
  };
```

- [ ] **Step 2: Remove the now-unused `PerformedExercise` import if nothing else in the file uses it**

Run: `grep -n "PerformedExercise" "apps/web/app/(app)/train/session/page.tsx"`
Expected output: only the `import { ... type PerformedExercise ... }` line itself (line 9) — no other usage remains, since `repeatLastSet(ex: PerformedExercise)` was the only consumer.

If that's the only match, edit the import block (originally lines 5–10):

```typescript
import {
  isPerformedExercise,
  type PerformedActivity,
  type PerformedCircuit,
} from "@bstrainer/domain";
```

(drops `type PerformedExercise` from the destructured type imports)

- [ ] **Step 3: Replace the `ExerciseBlockCard` usage**

Replace (originally lines 166–184):

```tsx
          <ExerciseBlockCard
            key={ex.id}
            exercise={ex}
            displayName={s.substituteOverride[ex.exerciseId]?.name ?? exerciseName(ex.exerciseId)}
            mediaSrc={publicAssetPath(
              s.substituteOverride[ex.exerciseId]?.mediaUrl ?? exercises.find((e) => e.id === ex.exerciseId)?.mediaUrl,
            )}
            target={s.targetSetFor(ex.id)}
            last={s.lastPerf[ex.exerciseId] ?? null}
            prE1rm={s.prHit[ex.exerciseId]}
            draft={s.draftFor(ex.id, ex.exerciseId)}
            onDraftChange={(patch) => s.setDraft(ex.id, ex.exerciseId, patch)}
            onConfirmSet={() => confirmSet(ex.id, ex.exerciseId)}
            onRepeatLastSet={() => repeatLastSet(ex)}
            onRemoveSet={(setId) => s.removeSet(ex.id, setId)}
            onRemove={() => s.removeExercise(ex.id)}
            onOpenPlateCalc={setPlateTarget}
            onSubstitute={(opt) => s.applySubstitute(ex.id, opt)}
          />
```

with:

```tsx
          <ExerciseBlockCard
            key={ex.id}
            exercise={ex}
            displayName={s.substituteOverride[ex.exerciseId]?.name ?? exerciseName(ex.exerciseId)}
            mediaSrc={publicAssetPath(
              s.substituteOverride[ex.exerciseId]?.mediaUrl ?? exercises.find((e) => e.id === ex.exerciseId)?.mediaUrl,
            )}
            last={s.lastPerf[ex.exerciseId] ?? null}
            prE1rm={s.prHit[ex.exerciseId]}
            rows={s.rowsFor(ex.id, ex.exerciseId)}
            onDraftChange={(index, patch) => s.setDraftAt(ex.id, ex.exerciseId, index, patch)}
            onConfirmActive={() => confirmActiveRow(ex.id, ex.exerciseId)}
            onEditLast={() => s.editLastConfirmedRow(ex.id)}
            onAddRow={() => s.addRow(ex.id)}
            onRemoveTrailingRow={() => s.removeTrailingRow(ex.id)}
            onRemove={() => s.removeExercise(ex.id)}
            onOpenPlateCalc={setPlateTarget}
            onSubstitute={(opt) => s.applySubstitute(ex.id, opt)}
          />
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: exits 0, no errors anywhere

- [ ] **Step 5: Build**

Run: `pnpm --filter @bstrainer/web build`
Expected: exits 0, build succeeds (static export)

- [ ] **Step 6: Run the full test suite**

Run: `pnpm --filter @bstrainer/web test`
Expected: PASS (5 tests total — 2 from Task 1, 3 from Task 2)

- [ ] **Step 7: Commit**

```bash
git add "apps/web/app/(app)/train/session/page.tsx"
git commit -m "Wire session page to the row-based set logger"
```

---

### Task 6: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server and open a training session**

Run the app (`pnpm --filter @bstrainer/web dev`), sign in, start a workout (template-based if one is assigned, otherwise "Treino livre" + add an exercise manually).

- [ ] **Step 2: Verify the table renders**

Confirm the exercise card shows the SÉRIE/ANTERIOR/KG/REPS/PSE header row and one active (highlighted) row. If the exercise came from a template with N prescribed sets, confirm N rows render (1 active + N−1 preview, or all preview beyond the active one).

- [ ] **Step 3: Verify confirm flow**

Type a KG value, type a REPS value, tap the PSE button and pick a value from the sheet, tap ✓. Confirm the row turns read-only/dim and a new active row appears below it (or the next preview row becomes active).

- [ ] **Step 4: Verify edit flow**

Tap the ✓ on the just-confirmed row. Confirm its values reappear editable in what is now the active row, and re-confirming it restores the read-only state with the corrected values.

- [ ] **Step 5: Verify add/remove row**

Tap "+ Adicionar Série", confirm a new preview/active row appears at the end. Tap its ✕ (only visible on the trailing row) and confirm it disappears.

- [ ] **Step 6: Verify plate calculator and rest timer are unaffected**

Type a KG value > 20 in the active row, confirm the plate-calculator icon appears and opens the existing modal correctly. Confirm a set and verify the rest timer at the top of the page starts, same as before this change.

- [ ] **Step 7: Verify PR badge and exercise removal/substitution still work**

Confirm a set that would set a new e1RM PR (or trust existing logic, since `checkPr` is untouched) and check the PR badge appears in the header. Verify the swap (⇄) and remove (✕) exercise controls in the header still work.

No commit for this task — it's a verification pass. If any step surfaces a bug, fix it in the relevant task's file, re-run that task's typecheck/build, and re-verify from Step 1.
