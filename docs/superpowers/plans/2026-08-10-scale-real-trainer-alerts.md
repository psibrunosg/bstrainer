# Scalable Real Trainer Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unbounded alert-history reads and per-client plan/mesocycle round-trips while preserving the existing real-alert behavior and strict failure semantics.

**Architecture:** The session source returns a lightweight alert-only session shape from an ordered top-two scalar query. The alert aggregator loads active plans and their mesocycles in two batched queries, then loads each client's top-two sessions through a four-worker concurrency pool before applying the unchanged alert rules and severity sort.

**Tech Stack:** TypeScript, Supabase JS query builders, Vitest, pnpm/Turbo.

## Global Constraints

- Session queries select only `started_at`, `readiness_soreness`, and `readiness_energy`, ordered by `started_at` descending and limited to 2 rows.
- Active plans and mesocycles use one `.in(...)` query per table, never one query per client.
- Per-client session reads have an explicit concurrency ceiling of 4 and must overlap when at least two clients are present.
- Preserve trainer-scoped active links, all-or-error results, all current Portuguese messages, alert rules, and severity ordering.
- Use strict RED/GREEN TDD, one final commit, full web/root verification, and a written final review report.

---

### Task 1: Specify scalable query behavior

**Files:**
- Modify: `apps/web/lib/data/trainer-alert-sources.test.ts`
- Modify: `apps/web/lib/data/trainer-alerts.test.ts`

**Interfaces:**
- Consumes: existing exported alert source and aggregation functions.
- Produces: behavioral regression coverage for scalar top-two sessions, two batch queries, deterministic latest-plan selection, and four-way session concurrency.

- [ ] **Step 1: Add a source test that records query-builder calls**

Assert that the executed session query selects exactly `started_at, readiness_soreness, readiness_energy`, applies the existing client/status filters, orders descending, and calls `.limit(2)`.

- [ ] **Step 2: Add aggregator tests for batching and concurrency**

Use complete query-builder fakes to assert one `.in("client_id", clientIds)` call for plans, one `.in("plan_id", planIds)` call for mesocycles, deterministic newest-plan behavior, four session loads started before any release, a fifth load only after a slot is released, and a maximum observed concurrency of four.

- [ ] **Step 3: Run the two focused files and record RED**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/trainer-alert-sources.test.ts lib/data/trainer-alerts.test.ts`

Expected: FAIL because the session query still requests nested history and has no limit, plan/mesocycle builders lack `.in(...)`, and session loading is serial.

### Task 2: Implement bounded alert loading

**Files:**
- Modify: `apps/web/lib/data/trainer-alert-sources.ts`
- Modify: `apps/web/lib/data/trainer-alerts.ts`

**Interfaces:**
- Produces: `AlertSession`, a minimal `{ startedAt, readiness }` session projection, plus unchanged public alert result types.

- [ ] **Step 1: Replace the heavy session projection**

Map only the three selected scalar columns into `AlertSession`, keep strict source errors, order descending, and limit to two.

- [ ] **Step 2: Batch plan and mesocycle reads**

Query active plans for the unique trainer-scoped client IDs, sort rows by descending `start_date` with descending `id` as a tie-break, choose one row per client, then query mesocycles once for the selected plan IDs and aggregate weeks by plan.

- [ ] **Step 3: Bound per-client session concurrency**

Run session loaders through four workers that preserve input/result index order. Inspect all session results for an error before constructing any successful alert result.

- [ ] **Step 4: Run focused tests and record GREEN**

Run: `pnpm.cmd --filter @bstrainer/web test -- lib/data/trainer-alert-sources.test.ts lib/data/trainer-alerts.test.ts`

Expected: PASS with the existing message and severity cases unchanged.

### Task 3: Verify, review, report, and commit

**Files:**
- Create: `.superpowers/sdd/2026-08-10-real-trainer-alerts/final-review-fix-report.md`
- Review: all modified files in this plan.

**Interfaces:**
- Produces: one reviewed commit and auditable verification evidence.

- [ ] **Step 1: Run all required verification commands**

Run focused tests, `pnpm.cmd --filter @bstrainer/web test`, `pnpm.cmd --filter @bstrainer/web typecheck`, `pnpm.cmd --filter @bstrainer/web build`, and `pnpm.cmd test`. Every command must exit 0.

- [ ] **Step 2: Perform self-review**

Inspect `git diff --check`, the complete diff, query counts/scopes, error branches, deterministic selection, concurrency bounds, unchanged strings, and severity sorting. Fix any Critical or Important finding with a new RED/GREEN cycle.

- [ ] **Step 3: Write the final report and make one commit**

Record RED/GREEN commands and outputs, the verification matrix, requirement-by-requirement review, and residual concerns, then stage only the planned files and commit once with `fix: scale trainer alert queries`.
