#!/usr/bin/env node
// Aplica migrations + seeds num banco Supabase REMOTO.
//
// Existe porque `supabase db push` aplica só as migrations: seeds rodam
// apenas em `supabase db reset` (local). Sem isto, um projeto Supabase novo
// recebe o schema mas fica sem os 1324 exercícios do catálogo.
//
// Uso:
//   SUPABASE_DB_URL='postgresql://postgres:<senha>@<host>:5432/postgres' pnpm db:deploy
//
// Flags:
//   --skip-migrations   só aplica os seeds (pula o `supabase db push`)
//   --dry-run           mostra o que faria, sem escrever nada
//
// Precisa de `psql` no PATH ou, na falta dele, de Docker (usa uma imagem
// postgres descartável só para rodar o psql).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = path.join(ROOT, "supabase", "seed");
const PG_IMAGE = process.env.DB_DEPLOY_PG_IMAGE ?? "postgres:17-alpine";

const args = process.argv.slice(2);
const skipMigrations = args.includes("--skip-migrations");
const dryRun = args.includes("--dry-run");

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(
    "SUPABASE_DB_URL não definida.\n" +
      "Pegue a connection string em: Supabase Dashboard > Project Settings > Database > Connection string (URI).\n" +
      "Exemplo: SUPABASE_DB_URL='postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres' pnpm db:deploy",
  );
  process.exit(1);
}

const run = (cmd, cmdArgs, opts = {}) =>
  execFileSync(cmd, cmdArgs, { stdio: "pipe", encoding: "utf8", ...opts });

const has = (cmd) => {
  try {
    run(cmd, ["--version"]);
    return true;
  } catch {
    return false;
  }
};

// psql nativo quando existe; senão, um container descartável só pro cliente.
const psqlRunner = (() => {
  if (has("psql")) {
    return (psqlArgs, stdin) =>
      run("psql", [url, "-v", "ON_ERROR_STOP=1", ...psqlArgs], { input: stdin });
  }
  if (has("docker")) {
    console.log(`psql não está no PATH — usando container ${PG_IMAGE}.`);
    return (psqlArgs, stdin) =>
      run(
        "docker",
        ["run", "--rm", "-i", PG_IMAGE, "psql", url, "-v", "ON_ERROR_STOP=1", ...psqlArgs],
        { input: stdin },
      );
  }
  console.error("Nem `psql` no PATH nem Docker disponível. Instale um dos dois.");
  process.exit(1);
})();

const query = (sql) => psqlRunner(["-tAc", sql], undefined).trim();
const applyFile = (file) => psqlRunner(["-f", "-"], fs.readFileSync(file, "utf8"));

// --- 1. gera o seed do catálogo (não é versionado) -------------------------
console.log("→ gerando supabase/seed/02_hasaneyldrm_exercises.sql");
if (!dryRun) run("node", [path.join(SEED_DIR, "generate-exercises-seed.mjs")], { stdio: "inherit" });

// --- 2. migrations ---------------------------------------------------------
if (skipMigrations) {
  console.log("→ pulando `supabase db push` (--skip-migrations)");
} else {
  console.log("→ supabase db push");
  if (!dryRun) run("supabase", ["db", "push"], { stdio: "inherit" });
}

// --- 3. seeds --------------------------------------------------------------
// 01 NÃO é idempotente: os exercícios curados têm external_id nulo, então o
// índice exercises_external_unique não os cobre e rodar duas vezes duplicaria
// as 78 linhas. Por isso só aplicamos se o alvo ainda não os tiver.
const curated = Number(
  query("select count(*) from public.exercises where source = 'custom' and org_id is null"),
);
if (curated > 0) {
  console.log(`→ 01_exercises.sql: pulando (alvo já tem ${curated} exercícios curados)`);
} else {
  console.log("→ 01_exercises.sql: aplicando");
  if (!dryRun) applyFile(path.join(SEED_DIR, "01_exercises.sql"));
}

// 02 é idempotente (on conflict do update + where not exists), então sempre roda.
console.log("→ 02_hasaneyldrm_exercises.sql: aplicando");
if (!dryRun) applyFile(path.join(SEED_DIR, "02_hasaneyldrm_exercises.sql"));

// --- 4. conferência --------------------------------------------------------
if (dryRun) {
  console.log("\n--dry-run: nada foi escrito.");
} else {
  const total = query("select count(*) from public.exercises");
  const hasan = query("select count(*) from public.exercises where source = 'hasaneyldrm'");
  const aliases = query("select count(*) from public.exercise_aliases");
  console.log(`\nOK — exercises: ${total} (hasaneyldrm: ${hasan}) | aliases: ${aliases}`);
}
