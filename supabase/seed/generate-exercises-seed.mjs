#!/usr/bin/env node
// Gera supabase/seed/02_hasaneyldrm_exercises.sql a partir dos JSONs em ./data.
//
// Os dados vieram da migration 20260715170000_import_hasaneyldrm_exercises.sql,
// que hoje contem apenas o ajuste de schema (constraint exercises_source_check).
//
// Uso: node supabase/seed/generate-exercises-seed.mjs  (ou: pnpm db:seed:build)
//
// O ARQUIVO GERADO NAO E VERSIONADO (ver supabase/seed/.gitignore): manter ~1 MB
// de SQL derivado no git dobraria o peso do clone. Num clone limpo ele nao existe,
// e rodar `supabase db reset` direto aplica somente o 01_exercises.sql — ou seja,
// sem os exercicios do catalogo hasaneyldrm. Use `pnpm db:reset`, que encadeia
// `pnpm db:seed:build && supabase db reset`.
//
// Os JSONs em ./data sao gravados com um objeto por linha dentro de um array
// valido (JSON.parse funciona normalmente) — mantenha esse formato ao edita-los:
// deixa o diff em 1 linha por exercicio e evita o inchaco do pretty-print.
//
// Deterministico: a mesma entrada sempre produz o mesmo arquivo, byte a byte.
// Sem dependencias externas: apenas node:fs / node:path / node:url.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(HERE, 'data');
const OUT_FILE = path.join(HERE, '02_hasaneyldrm_exercises.sql');

const SOURCE = 'hasaneyldrm';

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));

/** Literal SQL de texto, com apostrofos escapados. */
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

/** ARRAY['a', 'b']::text[] — mesmo formato do SQL original. */
const textArray = (values) => `ARRAY[${values.map(quote).join(', ')}]::text[]`;

const uuidOrNull = (value) => (value === null ? 'null' : `${quote(value)}::uuid`);

const textOrNull = (value) => (value === null ? 'null' : quote(value));

const boolLiteral = (value) => (value ? 'true' : 'false');

function exerciseRow(ex) {
  return [
    `${quote(ex.id)}::uuid`,
    uuidOrNull(ex.org_id),
    quote(ex.name),
    quote(ex.movement_pattern),
    textArray(ex.primary_muscles),
    textArray(ex.secondary_muscles),
    quote(ex.load_type),
    boolLiteral(ex.unilateral),
    textOrNull(ex.instructions),
    textOrNull(ex.media_url),
    quote(ex.source),
    quote(ex.external_id),
  ].join(', ');
}

function build(exercises, aliases) {
  const lines = [];

  lines.push(`-- GERADO AUTOMATICAMENTE — nao editar a mao.`);
  lines.push(`-- Fonte: supabase/seed/data/hasaneyldrm-exercises.json + hasaneyldrm-aliases.json`);
  lines.push(`-- Regenerar com: pnpm db:seed:build`);
  lines.push(`--`);
  lines.push(`-- Catalogo textual de ${exercises.length} exercicios de hasaneyldrm/exercises-dataset (MIT).`);
  lines.push(`-- A midia da Gym Visual nao e importada: requer licenca propria.`);
  lines.push('');

  lines.push(
    'insert into public.exercises (id, org_id, name, movement_pattern, primary_muscles, secondary_muscles, load_type, unilateral, instructions, media_url, source, external_id) values',
  );
  exercises.forEach((ex, i) => {
    const sep = i === exercises.length - 1 ? '' : ',';
    lines.push(`  (${exerciseRow(ex)})${sep}`);
  });
  lines.push('on conflict (source, external_id) where external_id is not null and org_id is null do update set');
  lines.push('  name = excluded.name,');
  lines.push('  movement_pattern = excluded.movement_pattern,');
  lines.push('  primary_muscles = excluded.primary_muscles,');
  lines.push('  secondary_muscles = excluded.secondary_muscles,');
  lines.push('  load_type = excluded.load_type,');
  lines.push('  unilateral = excluded.unilateral;');
  lines.push('');

  lines.push('insert into public.exercise_aliases (exercise_id, alias)');
  lines.push('select exercise.id, aliases.alias');
  lines.push('from (values');
  aliases.forEach((a, i) => {
    const sep = i === aliases.length - 1 ? '' : ',';
    lines.push(`  (${quote(a.external_id)}, ${quote(a.alias)})${sep}`);
  });
  lines.push(') as aliases(external_id, alias)');
  lines.push('join public.exercises as exercise');
  lines.push(`  on exercise.source = ${quote(SOURCE)} and exercise.external_id = aliases.external_id`);
  lines.push('where not exists (');
  lines.push('  select 1 from public.exercise_aliases existing');
  lines.push('  where existing.exercise_id = exercise.id and existing.alias = aliases.alias');
  lines.push(');');

  return lines.join('\n') + '\n';
}

const exercises = readJson('hasaneyldrm-exercises.json');
const aliases = readJson('hasaneyldrm-aliases.json');

fs.writeFileSync(OUT_FILE, build(exercises, aliases), 'utf8');

console.log(
  `${path.relative(process.cwd(), OUT_FILE)}: ${exercises.length} exercicios, ${aliases.length} aliases`,
);
