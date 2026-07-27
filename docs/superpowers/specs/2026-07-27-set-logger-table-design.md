# Set Logger Table Redesign — Design Spec

**Date:** 2026-07-27
**Scope:** `apps/web/components/train/ExerciseBlockCard.tsx` and its data dependencies. Does **not** touch `ActivityBlockCard`/`CircuitBlockCard` (`BlockCards.tsx`) — those are a separate follow-up project (timer/round-counter, tracked as project 2 of this session, brainstormed after this spec ships).

## Problem

Logging a set today requires four stacked, separately-tapped elements per set: a reps +/- stepper, a load text input, an RPE `<select>`, and a full-width "Confirmar série" button. Confirmed sets render below as a read-only list. This is slow at the gym — too many taps and too much vertical scanning per set.

Reference: 29 screenshots of the Hevy app (`G:\Meu Drive\Apptreino\`) show a dense single-row-per-set table — columns `SÉRIE / ANTERIOR / KG / REPS / PSE / ✓` — where the whole set is visible and editable in one horizontal band, confirmed with a tap on the checkmark.

## Goal

Replace the stepper+draft+read-only-list pattern in `ExerciseBlockCard` with a unified table: one row per set, each row independently in an `editing` or `confirmed` state, matching the Hevy density/interaction model.

## Row state machine

Each row (one prescribed or ad-hoc set) has two states:

- **`editing`** (default for a newly created row): KG, REPS, PSE fields are editable. Pre-filled with:
  - The plan's per-set target (`prescribed.sets[index]`) if the exercise came from a template — reuses the existing `targetSetFor(rowId)` lookup in `use-workout-session.ts`, which already indexes by `block.sets.length`.
  - Otherwise, a placeholder from the athlete's last session at that same set index (new lookup, see Data section).
  - The trailing control shows ✓ (empty/outlined). An empty, untouched `editing` row also shows a ✕ to delete itself (covers rows added via "+ Adicionar Série" by mistake, and any extra prescribed rows the athlete doesn't want to do).
- **`confirmed`**: fields render read-only (grey/dim text, same as today's confirmed-set styling). The ✓ fills solid (signal color). Tapping the filled ✓ returns the row to `editing` so the athlete can correct a value without deleting and re-entering the whole row.

**Initial rows on card mount:**
- If the exercise has a prescribed template (`prescribed.sets.length > 0`): pre-create that many rows, each in `editing`, each pre-filled with its own set's target.
- Otherwise (free training, no plan): pre-create 1 row in `editing`, pre-filled from the athlete's last session at index 0 if available.

**Adding rows:** a persistent "+ Adicionar Série" row/button at the bottom of the table always appends one more `editing` row. If the plan still has an un-rendered set at the next index, prefill from that target; otherwise prefill from the previous row's confirmed values (falls back to the old "repeat last set" placeholder role — the explicit "Repetir" button is removed since this placeholder now does that job automatically).

**Confirm requirement:** REPS must be > 0 to confirm a row. KG and PSE are optional (bodyweight exercises have no load; PSE is always optional today).

## Table layout

Columns, left to right: `SÉRIE` (set number, ~28px) · `ANTERIOR` (ghost text, e.g. "30kg × 12", or "—", ~70px) · `KG` (numeric input; when parsed value > 20, shows the existing plate-calculator icon inline, same trigger as today) · `REPS` (numeric input, direct-entry — the +/- stepper is removed in favor of tap-to-type, matching the KG field's existing interaction) · `PSE` (compact button showing the current value or "PSE"; tapping opens a sheet with large tap targets for the existing RPE_OPTIONS range, replacing the inline `<select>`) · `✓` (confirm/edit toggle).

Column headers render once per exercise card, above the row list — not repeated per row.

The card header above the table (exercise name, e1RM badge, "Última: X kg × Y" ghost text, target chip, swap/remove exercise controls, substitution picker) is unchanged from the current implementation.

Layout stays mobile-first at the current `max-w-lg` card width; six compact columns fit comfortably in the ~360px available content width.

## Data changes

- **`apps/web/lib/workout/history-lookup.ts`**: add `lastSessionSetsFor(exerciseId: string): Promise<LastPerformance[] | null>`, returning the full ordered array of non-warmup work sets from the athlete's most recent completed session containing that exercise (same session-selection logic as `lastPerformanceFor`, but returns all sets instead of just the last one). Existing `lastPerformanceFor` (singular) is kept as-is for the card header's "Última" ghost text — no behavior change there.
- **`apps/web/lib/workout/use-workout-session.ts`**: `drafts` state changes from one draft per exercise row (`Record<rowId, SetDraft>`) to one draft per row *per set index* (`Record<rowId, Record<number, SetDraft>>` or equivalent array-indexed shape). `targetSetFor` is reused unchanged — it already resolves the target for a given already-confirmed-count, which maps directly to "the target for row index N once rows N-1 and earlier are confirmed." New: a row-index-aware equivalent of `draftFor`/`setDraft` for the per-row editing state, and confirm/edit/remove operations addressed by row index instead of a single implicit "current draft."
- **`ExerciseBlockCard.tsx`** props change from `{ draft, onDraftChange, onConfirmSet, onRepeatLastSet, onRemoveSet }` (singular draft + separate confirmed-sets list) to `{ rows, onConfirmRow(index), onEditRow(index), onRemoveRow(index), onAddRow(), onDraftChange(index, patch) }`, where `rows: SetRow[]` unifies confirmed and editing sets into one ordered list (`{ state: "editing" | "confirmed"; index: number; target?: PrescribedSet; anterior?: LastPerformance; draft?: SetDraft; confirmed?: PerformedSet }`). `onRepeatLastSet` is removed (superseded by automatic placeholder pre-fill on new rows).

## Edge cases

- Row with no input at all and still `editing` can be deleted directly via ✕, no confirmation needed.
- Unconfirmed drafts remain in-memory only (component/hook state) — not persisted to IndexedDB. This matches current behavior: only confirmed sets are written into `session.blocks[].sets` and saved via `saveActiveSession`.
- Plate-calculator modal and the exercise-substitution picker keep their current trigger conditions and behavior; only their position within the new layout changes.

## Testing

- New unit test for `lastSessionSetsFor` in `history-lookup.ts`: returns the right per-index array for a session with multiple sets, returns `null`/empty when no history exists, excludes warmup sets.
- No React component test runner exists in this project today (confirmed with the user) — acceptance is typecheck (`tsc --noEmit` or the project's existing typecheck script) + production build passing, plus manual verification in the browser preview.

## Out of scope

- `ActivityBlockCard` / `CircuitBlockCard` redesign (timer, round counter) — separate spec, brainstormed next.
- Warmup-set marking in the UI (not currently exposed; `isWarmup` exists in the domain model but no current UI sets it).
