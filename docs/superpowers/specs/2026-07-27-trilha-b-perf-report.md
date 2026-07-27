# Trilha B — Performance Run Report

Date: 2026-07-27 · Branch: `main` · Working tree: uncommitted (nothing committed by this run)

## Gate results

| Gate | Result |
|---|---|
| `pnpm --filter @bstrainer/web typecheck` | PASS — `tsc --noEmit`, zero errors |
| `pnpm --filter @bstrainer/web build` | PASS — compiled in 11.7s, 38/38 static pages, export 2/2 |
| `node apps/web/scripts/check-bundle-budget.mjs` | PASS — both routes under budget |

## Per-task status

| Task | Status | Reason |
|---|---|---|
| B0 — remove `await searchParams` from template detail page | **PASS** (verifier reported FAIL; false negative) | The failing check grepped build output for `plans/templates` and treated any match as an error, but the match came from the successful route listing. Build now generates all 22 `/plans/templates/[id]` routes statically. |
| B1 — move exercise catalog to `public/exercises.json` | **PASS** | `exercises.catalog.ts` deleted, 117.8 KB `public/exercises.json` (1324 entries) loaded at runtime via `loadCatalogExercises()`. |
| B2 — code-split recharts off the dashboard | **PASS** | recharts moved to `components/dashboard/ProgressCharts.tsx`, loaded via `next/dynamic` with `ssr:false` and a skeleton fallback. |
| B3 — network-first service worker for navigations | **PASS** | `public/sw.js` uses `request.mode === "navigate"` network-first with cache fallback; cache-first scoped to `/_next/static/` and `exercises.json`; registration stays a singleton in the root layout. |
| B5 — First Load JS budget gate in CI | **PASS** | `apps/web/scripts/check-bundle-budget.mjs` runs right after `pnpm build` in `.github/workflows/ci.yml`; exits non-zero when a route exceeds budget. |

No broken or partial code found. Typecheck is clean and every modified file participates in a successful production build.

## First Load JS

"Before" is not measurable: prior to B0 the production build failed (static export aborted on `await searchParams`), so Next never printed a route table.

| Route | Before | After |
|---|---|---|
| `/dashboard` | not measurable (build broken) | **212 kB** (page 8.95 kB) |
| `/train/session` | not measurable (build broken) | **212 kB** (page 8.91 kB) |

Shared by all: 102 kB.

Budget-gate view (raw chunk bytes, the metric the CI script enforces — not the same number as Next's gzipped First Load JS):

```
/(app)/dashboard/page       792.8 KB / 875 KB
/(app)/train/session/page   798.5 KB / 900 KB
```

Full route table from the passing build:

```
Route (app)                                            Size  First Load JS
┌ ○ /                                                 161 B         106 kB
├ ○ /_not-found                                       989 B         103 kB
├ ○ /clients                                         2.9 kB         174 kB
├ ○ /dashboard                                      8.95 kB         212 kB
├ ○ /login                                          2.02 kB         169 kB
├ ○ /messages                                       1.98 kB         169 kB
├ ○ /onboarding                                      2.5 kB         170 kB
├ ○ /personal                                       2.68 kB         173 kB
├ ○ /plans                                          2.87 kB         209 kB
├ ○ /plans/new                                       2.7 kB         209 kB
├ ○ /plans/templates                                1.15 kB         139 kB
├ ● /plans/templates/[id]                           1.26 kB         207 kB
├ ○ /settings                                       1.76 kB         169 kB
├ ○ /train                                          1.86 kB         205 kB
└ ○ /train/session                                  8.91 kB         212 kB
+ First Load JS shared by all                        102 kB
```

## Landing image optimization (advisory — not applied)

Verbatim from the audit:

## Report

**Current File Size**
- `apps/web/public/lobo-movimento.png`: **1.2 MB** (644 bytes on disk due to display rounding, but file metadata confirms 1.2 MiB)

**Image Properties**
- Format: PNG, 8-bit RGB, non-interlaced
- Original dimensions: **1149 × 1369 px**

**Actual Rendered Display Size**
From `page.tsx` lines 42–48, the image uses:
```jsx
width={1365}
height={1365}
className="relative mx-auto w-full max-w-md"
```
The CSS `max-w-md` (Tailwind: 28rem = 448px) is the true constraint. Scaled proportionally:
- **Displayed size: ~448 × 533 px** (maintains 1149:1369 aspect ratio)

The intrinsic `width={1365}` and `height={1365}` are irrelevant since the browser respects `max-w-md`.

**Tool Availability on PATH**
- `cwebp`: ✗ Not found
- `convert` (ImageMagick): ✗ Not found (`/c/Windows/system32/convert` is Windows built-in, not ImageMagick)
- `squoosh-cli`: ✗ Not found
- **`ffmpeg`**: ✓ Available at `...ffmpeg-8.1.1-full_build/bin`

**Recommendation**

| Property | Value |
|----------|-------|
| **Target size** | 448 × 533 px (display-optimized) |
| **Target format** | WebP |
| **Estimated size** | ~80–120 KB (vs. current 1.2 MB = 90% reduction) |

**Command to generate optimized WebP** (using ffmpeg):
```bash
ffmpeg -i apps/web/public/lobo-movimento.png -vf scale=448:533 -c:v libwebp -quality 80 apps/web/public/lobo-movimento.webp
```

For even more aggressive compression (60–90 KB), lower quality to 70–75. Since the image is a design asset (wolf illustration), WebP quality 75–80 remains perceptually lossless at this display size.

**Alternative (if you add cwebp):**
```bash
cwebp -resize 448 533 -quality 80 apps/web/public/lobo-movimento.png -o apps/web/public/lobo-movimento.webp
```
