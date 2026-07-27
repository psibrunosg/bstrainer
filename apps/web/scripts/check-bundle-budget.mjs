#!/usr/bin/env node
// Gate First Load JS for key routes using Next's own build manifest (no new deps).
import { statSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", ".next", "app-build-manifest.json");

if (!existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath} — run next build first.`);
  process.exit(1);
}

// Budgets in KB (uncompressed sum of chunk file sizes for that route).
const BUDGETS_KB = {
  "/(app)/dashboard/page": 875,
  "/(app)/train/session/page": 900,
};

// --budget-kb <n> overrides every budget with n; exists purely to make this gate testable.
const overrideIdx = process.argv.indexOf("--budget-kb");
const override = overrideIdx !== -1 ? Number(process.argv[overrideIdx + 1]) : null;

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const nextDir = path.dirname(manifestPath);

let failed = false;
for (const [route, budgetKb] of Object.entries(BUDGETS_KB)) {
  const chunks = manifest.pages[route];
  if (!chunks) {
    console.error(`Route ${route} not found in app-build-manifest.json`);
    failed = true;
    continue;
  }
  const totalBytes = chunks.reduce((sum, chunk) => sum + statSync(path.join(nextDir, chunk)).size, 0);
  const actualKb = totalBytes / 1024;
  const budget = override ?? budgetKb;
  const over = actualKb > budget;
  console.log(`${route}  ${actualKb.toFixed(1)} KB / ${budget} KB${over ? "  OVER BUDGET" : ""}`);
  if (over) failed = true;
}

if (failed) {
  console.error("Bundle budget exceeded.");
  process.exit(1);
}
