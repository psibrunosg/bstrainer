-- Schema apenas: libera 'hasaneyldrm' como origem valida em public.exercises.
--
-- Os ~1.324 INSERTs de exercicios e os aliases que ficavam aqui foram movidos para
-- supabase/seed/ (dados versionados em JSON + SQL gerado):
--   supabase/seed/data/hasaneyldrm-exercises.json
--   supabase/seed/data/hasaneyldrm-aliases.json
--   supabase/seed/02_hasaneyldrm_exercises.sql  (gerado; regenerar com `pnpm db:seed:build`)
--
-- O nome/timestamp do arquivo e mantido de proposito: a migration ja pode estar
-- aplicada em ambientes remotos e renomea-la causaria drift no historico.
alter table public.exercises drop constraint if exists exercises_source_check;
alter table public.exercises add constraint exercises_source_check check (source in ('wger', 'custom', 'hasaneyldrm'));
