# Guia de Manutenção — bstrainer

> **Versão:** 2026-08-12  
> **Regras:** Este doc deve ser atualizado sempre que uma convenção mudar, um gate quebrar, ou uma dívida técnica for paga. Se você leu algo aqui que não bate com a realidade, corrija antes de commitar.

---

## 1. Visão rápida

| | |
|---|---|
| **Produto** | SaaS de prescrição, execução e análise de treinamento de força |
| **Público** | Personal trainers + usuários solo |
| **Stack** | Next.js 15 (App Router) + Supabase + TypeScript + Tailwind CSS 4 |
| **Monorepo** | pnpm 11.12.0 + Turborepo 2.5.0 |
| **Deploy** | GitHub Pages (`output: "export"`, static) |
| **Testes** | Vitest (engine + web), jsdom, Testing Library |

### Mapa de docs

| Doc | O quê | Estado |
|---|---|---|
| `README.md` | Visão geral do produto | ✅ Corrigido em 2026-08-11 |
| `docs/ARQUITETURA.md` | Plano de arquitetura e features | ✅ Corrigido em 2026-08-11 |
| `docs/auditoria-projeto.md` | Auditoria deste repositório | ✅ Atualizado em 2026-08-12 |
| `DESAFIOS.md` | Atritos operacionais recorrentes (ambiente, não código) | ✅ Criado em 2026-08-12 |
| `CONTEXT-MAP.md` | Mapa de contextos dos packages | ✅ Ok |
| `packages/domain/CONTEXT.md` | Vocabulário de domínio | ✅ Ok |
| `docs/adr/` | ADRs (0001, 0002) | ✅ Ok |
| `docs/agents/` | Regras para agentes (issues, triage, domain) | ✅ Ok |

---

## 2. Comandos do dia a dia

> **Pré-requisito:** `pnpm install` (ou `pnpm install --frozen-lockfile` na CI)

```bash
# Dev (sobe o Next.js na porta padrão)
pnpm dev              # turbo run dev

# Build
pnpm build            # turbo run build
# Nota: o web usa output: "export", gera static em apps/web/out/

# Typecheck
pnpm typecheck        # turbo run typecheck

# Testes
pnpm test             # turbo run test
# Ou diretamente nos packages:
cd packages/engine && pnpm vitest run
cd apps/web && pnpm vitest run           # 8 arquivos, 44 tests

# Lint
pnpm lint             # turbo run lint → eslint . no apps/web
# Config flat em apps/web/eslint.config.mjs (estende next/core-web-vitals).
# NÃO use `next lint`: deprecado no Next 15.5, removido no Next 16.

# Banco local (ver subseção abaixo)
pnpm db:seed:build    # gera supabase/seed/02_hasaneyldrm_exercises.sql a partir dos JSONs
pnpm db:reset         # db:seed:build && supabase db reset

# Banco remoto (ver subseção abaixo)
pnpm db:deploy        # supabase db push + aplica os seeds no banco apontado por SUPABASE_DB_URL
```

### Banco de dados local (migrations + seeds)

O catálogo de exercícios do dataset `hasaneyldrm` **não vive mais numa migration**. Ele é dado
versionado em JSON, e o SQL é gerado sob demanda:

| Caminho | O que é | Versionado? |
|---|---|---|
| `supabase/migrations/20260715170000_import_hasaneyldrm_exercises.sql` | Só o ajuste de schema (constraint `exercises_source_check` aceitando `hasaneyldrm`) | ✅ Sim |
| `supabase/seed/data/hasaneyldrm-exercises.json` | 1324 exercícios | ✅ Sim |
| `supabase/seed/data/hasaneyldrm-aliases.json` | 1324 aliases | ✅ Sim |
| `supabase/seed/generate-exercises-seed.mjs` | Gerador ESM determinístico, zero dependências | ✅ Sim |
| `supabase/seed/01_exercises.sql` | 78 exercícios curados (escrito à mão) | ✅ Sim |
| `supabase/seed/02_hasaneyldrm_exercises.sql` | Saída do gerador | ❌ Não (`supabase/seed/.gitignore`) |

O **nome e o timestamp da migration foram mantidos de propósito**: ela já pode estar aplicada em
ambientes remotos, e renomear causaria drift no histórico. Não renomeie.

**Fluxo correto para subir/resetar o banco local:**

```bash
pnpm db:reset          # gera o 02_*.sql e só então roda `supabase db reset`
```

`supabase/config.toml` agora tem `[db.seed] enabled = true` com `sql_paths = ["./seed/*.sql"]`.
Antes disso os arquivos de `supabase/seed/` **nunca eram aplicados**; agora o `01_exercises.sql`
(78 curados) roda de fato, e um reset completo passa de 1324 para **1402 exercícios**.

**Editando os dados:** mexa nos JSONs de `supabase/seed/data/`. Eles são gravados com **um objeto
JSON por linha dentro de um array válido** — mantenha esse formato ao editar, é ele que deixa o diff
legível registro a registro. Depois rode `pnpm db:seed:build`.

> ⚠️ **Ressalva — não rode `supabase db reset` direto num clone limpo.**
> O `02_hasaneyldrm_exercises.sql` não existe até ser gerado, então um reset cru aplica **apenas** o
> `01_exercises.sql` e você fica sem o catálogo. Use sempre `pnpm db:reset`.

> **Sobre o peso:** o repo versionado foi de 1042 KB para 1205 KB. O refactor **não** economizou
> bytes — o ganho é migration limpa e dados revisáveis por registro no diff.

### Banco de dados remoto (staging / produção)

`supabase db push` aplica **só as migrations**. Seeds rodam apenas em `supabase db reset`, que é
local. Sem um passo extra, um projeto Supabase **novo** receberia o schema e ficaria sem os 1324
exercícios. `pnpm db:deploy` (`scripts/db-deploy.mjs`) fecha esse buraco:

```bash
SUPABASE_DB_URL='postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres' pnpm db:deploy
```

A connection string sai de **Supabase Dashboard > Project Settings > Database > Connection string
(URI)**. O script gera o `02_*.sql`, roda `supabase db push` e aplica os seeds. Flags: `--dry-run`
(não escreve nada) e `--skip-migrations` (só os seeds).

Usa `psql` do PATH; se não houver, cai para um container Docker descartável só com o cliente
(`DB_DEPLOY_PG_IMAGE` troca a imagem).

> ⚠️ **`01_exercises.sql` não é idempotente.** Os 78 exercícios curados têm `external_id` nulo, e o
> índice `exercises_external_unique` só cobre linhas com `external_id` não nulo — rodar o arquivo
> duas vezes duplicaria as 78 linhas. Por isso o `db:deploy` só aplica o `01` quando o alvo ainda
> não tem exercícios curados. **Não aplique esse arquivo à mão** num banco já populado.
> O `02_*.sql` é idempotente (`on conflict do update` + `where not exists`) e roda sempre.

> ⚠️ **Nunca use `supabase db reset --db-url <remoto>`** para isso: `reset` **apaga** o banco.

### Armadilhas conhecidas

| Armadilha | Por quê | Como evitar |
|---|---|---|
| **Build falha por causa de `vitest.setup.ts`** | O `tsconfig.json` do web inclui `**/*.ts`, que pega `vitest.setup.ts`. Ele importa `@testing-library/react` (devDependency) e quebra o build de produção. | Não commite sem verificar build local. Correção: excluir `**/*.test.ts`, `**/*.test.tsx` e `vitest.setup.ts` do `tsconfig.json` include. |
| **Vitest escaneia `.worktrees/`** | Se houver uma worktree git local, o vitest encontrava arquivos `.test.tsx` duplicados lá e falhava. | ✅ Resolvido: `apps/web/vitest.config.ts` tem `exclude: [...configDefaults.exclude, "**/.worktrees/**"]`. Ao mexer no `exclude`, **sempre** espalhe `configDefaults.exclude` junto — sobrescrever o array perde os defaults do vitest (`node_modules`, `dist`, …). |
| **`pnpm build` falha com `ENOENT` em `.next/`** | Dois processos buildando o mesmo `apps/web` em paralelo (comum com agentes concorrentes no Windows) corrompem o diretório de build. Não é erro de código. | `rm -rf apps/web/.next apps/web/out apps/web/.turbo` e rebuildar sozinho. Detalhes em `DESAFIOS.md`. |
| **`supabase db reset` num clone limpo não traz o catálogo** | O `supabase/seed/02_hasaneyldrm_exercises.sql` é gerado, não versionado. | Use `pnpm db:reset` (ver seção 2). |
| **Next.js static export + images** | `images: { unoptimized: true }` é obrigatório para `output: "export"`. Se alguém remover isso, o build quebra. | Não alterar `next.config.ts` sem testar build. |
| **Bundle budget gate quebra se manifest muda** | `scripts/check-bundle-budget.mjs` lê `.next/app-build-manifest.json`. Com `output: "export"`, o manifest ainda é gerado, mas o path é implícito. | Se o script falhar, verifique se `.next/` existe após build. |
| **pnpm não está no PATH em alguns ambientes** | Em shells Git Bash no Windows, `pnpm` pode não ser encontrado se instalado via corepack. | Usar `corepack pnpm <cmd>` ou path absoluto. |

---

## 3. Estado atual dos gates (validado em 2026-08-12)

> ⚠️ Não copie da auditoria — sempre revalide rodando localmente.

| Gate | Estado | Evidência |
|---|---|---|
| **Lint** | ✅ Passando | `pnpm lint` → 0 erros, 0 warnings. Config flat em `apps/web/eslint.config.mjs` |
| **Typecheck** | ✅ Passando | `pnpm typecheck` limpo nos 3 pacotes do workspace |
| **Testes** | ✅ Passando | `pnpm test` verde; `apps/web`: 8 arquivos, 44 tests, nenhum caminho de `.worktrees/` |
| **Build web** | ✅ Passando | `pnpm build` gera o static export (`output: "export"`) |
| **Bundle budget** | ✅ Passando | `node apps/web/scripts/check-bundle-budget.mjs` verde após o build |

A CI (`.github/workflows/ci.yml`) roda, nesta ordem: `pnpm install --frozen-lockfile` → `pnpm lint`
→ `pnpm typecheck` → `pnpm test` → `pnpm build`.

### Resumo dos gates
```
Lint:    ████████████████████  OK  (eslint flat config, 0 erros / 0 warnings)
Engine:  ████████████████████  OK  (tests + typecheck)
Web:     ████████████████████  OK  (lint + tests + typecheck + build)
CI:      ████████████████████  OK  (lint + typecheck + test + build)
```

---

## 4. Dívidas técnicas vivas

> Cada dívida: o que é → onde → o que fazer ao tocar na área.

D1, D2, D3, D4 e D5 foram pagas — ver **Apêndice A**. Ao abrir uma nova dívida, use o próximo
número sequencial (D7).

### D6 — camada de dados do web sem tipagem do Supabase

- **O que é:** `apps/web/lib/supabase/client.ts` chama `createBrowserClient(...)` **sem** o genérico
  `<Database>`. Como consequência, as **64 chamadas `.from()`** espalhadas por **21 arquivos** do web
  retornam `any`: erro de nome de coluna ou de tabela só aparece em runtime. Os **42 tipos escritos à
  mão** em `apps/web/lib/data/` são reconstrução manual do que os tipos gerados dariam de graça.
- **Onde:** `apps/web/lib/supabase/client.ts` e `apps/web/lib/data/*`
- **Contexto:** existia um `packages/db` com `database.types.ts` gerado, mas ele estava
  desatualizado em 8 tabelas e não tinha nenhum consumidor. Foi removido em 2026-08-12 — manter
  artefato gerado e desatualizado é pior que não ter. Recriar é um comando, não um resgate.
- **O que fazer ao tocar:**
  1. `supabase gen types typescript --linked > <destino>/database.types.ts`
  2. Tipar o client: `createBrowserClient<Database>(...)`
  3. Migrar `lib/data/*` incrementalmente, arquivo a arquivo — tirar o `any` deve expor erros hoje
     mascarados; é justamente esse o valor
  4. Decidir onde o arquivo gerado mora (novo `packages/db` ou dentro do próprio `apps/web`) e
     registrar que **toda migration exige regenerar os tipos**

Ponto de atenção que sobrou do refactor de seeds (não é dívida, é operação — detalhado na seção 2):
`supabase db reset` precisa ser precedido de `pnpm db:seed:build` (use `pnpm db:reset`).

---

## 5. Convenções do repositório

### Commits
Usamos **Conventional Commits**:
```
feat: add offline sync queue
fix: correct RPE calculation for drop sets
refactor: extract plate calculator hook
docs: update ARQUITETURA.md with real structure
test: add e1rm edge cases
chore: update pnpm-lock.yaml
```

### Workflow de branches
- `main` é a única branch de integração.
- Features: branch `feat/<nome>` → PR → merge.
- Fixes: branch `fix/<nome>` → PR → merge.
- A CI roda em todo push para `main` e em todo PR.

### Issues
- Repo: `psibrunosg/bstrainer` (GitHub Issues via `gh` CLI)
- Labels padrão: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
- Ver `docs/agents/issue-tracker.md` e `docs/agents/triage-labels.md`

### Code review — checklist mínimo
- [ ] Lint passa: `pnpm lint` (0 erros, 0 warnings)
- [ ] Build passa: `pnpm build`
- [ ] Typecheck passa: `pnpm typecheck`
- [ ] Testes passam: `pnpm test`
- [ ] Não introduz novas dependências sem justificativa
- [ ] Migrations são versionadas e nomeadas com timestamp `YYYYMMDDhhmmss_`
- [ ] Migrations existentes **não** foram renomeadas (causa drift em ambientes já aplicados)
- [ ] Alterou catálogo de exercícios? Mexeu nos JSONs de `supabase/seed/data/`, não no SQL gerado
- [ ] RLS cobre novas tabelas (se aplicável)

---

## 6. Checklist pré-commit (para o dev)

Antes de `git commit`, verifique:

```bash
# 1. Lint (rápido)
pnpm lint

# 2. Typecheck (3 pacotes)
pnpm typecheck

# 3. Testes
pnpm test

# 4. Build do web (mais lento, ~20-30s)
pnpm build
# Build validado — deve passar antes de abrir PR.
# Se der ENOENT em .next/, provavelmente há outro build rodando em paralelo: ver DESAFIOS.md.

# 5. Verifique se não commitou arquivos de runtime
# Nunca commite: .claude/, .claude-flow/, .next/, out/, node_modules/
#                supabase/seed/02_hasaneyldrm_exercises.sql (gerado)
```

---

## 7. Regras para manter este doc atualizado

1. **Gate quebrou?** Atualize a seção 3 com o novo estado e a data.
2. **Nova dívida técnica?** Adicione à seção 4 com número sequencial.
3. **Dívida foi paga?** Mova-a para um apêndice de "Dívidas resolvidas" com data e PR/commit.
4. **Novo comando ou script?** Adicione à seção 2 e documente armadilhas.
5. **Mudou convenção de commits ou branches?** Atualize a seção 5.
6. **Sempre que editar este arquivo**, commit com prefixo `docs:`.

---

## Apêndice A — Dívidas resolvidas

### D1 — ESLint não configurado
- **Resolvido em:** 2026-08-12
- **O que foi feito:**
  - `apps/web` ganhou as devDeps `eslint@^9.39.5`, `eslint-config-next@15.5.20` e `@eslint/eslintrc@^3.3.6`
  - Config flat em `apps/web/eslint.config.mjs`, estendendo `next/core-web-vitals` via `FlatCompat`; ignora `.next/`, `out/`, `node_modules/`, `.worktrees/` e `next-env.d.ts`
  - Script trocado de `"lint": "next lint"` para `"lint": "eslint ."` — `next lint` está deprecado no Next 15.5 e foi removido no Next 16
  - Correções no código para zerar o lint: aspas escapadas em `app/(app)/plans/page.tsx`; `postcss.config.mjs` deixou de exportar objeto anônimo; `usePlanFromTemplate` renomeada para `createPlanFromTemplate` em `lib/data/plans.ts` e `components/UseTemplateButton.tsx` — o prefixo `use` fazia o ESLint tratá-la como React hook e disparar `rules-of-hooks`
  - `.github/workflows/ci.yml` passou a rodar `pnpm lint` logo após o install
- **Gate:** `pnpm lint` → 0 erros, 0 warnings

### D2 — `vitest.config.ts` não exclui `.worktrees/`
- **Resolvido em:** 2026-08-12
- **O que foi feito:** `apps/web/vitest.config.ts` ganhou `exclude: [...configDefaults.exclude, "**/.worktrees/**"]` — os defaults do vitest são preservados via `configDefaults`, em vez de sobrescritos.
- **Gate:** `pnpm vitest run` no `apps/web` → 8 arquivos, 44 tests, nenhum caminho de `.worktrees/`

### D3 — README e ARQUITETURA.md desatualizados
- **Resolvido em:** 2026-08-11
- **Commit:** `3b60dd1` — `docs: corrige README e ARQUITETURA.md para refletir estado real do código`
- **O que foi feito:** README atualizado com status real do MVP; ARQUITETURA.md seção F corrigida para refletir estrutura real do repo; menções a libs não usadas removidas.

### D4 — `@bstrainer/db` é dependência fantasma no web
- **Resolvido em:** já estava resolvida (a doc é que estava desatualizada)
- **O que foi feito:** a dependência **não existe** em `apps/web/package.json` — nem no HEAD. Nada a remover no web. O pacote `packages/db` em si foi **removido** em 2026-08-12: 1495 linhas geradas, desatualizadas em 8 tabelas (`activities`, `body_measurements`, `messages`, `performed_activities`, `performed_circuits`, `prescribed_activities`, `prescribed_circuits`, `prescribed_circuit_exercises`) e zero consumidores. A lacuna de tipagem que ele deveria cobrir virou a dívida **D6**.

### D5 — Migration gigante no repo
- **Resolvido em:** 2026-08-12
- **O que foi feito:**
  - `supabase/migrations/20260715170000_import_hasaneyldrm_exercises.sql` foi reduzida a ~12 linhas contendo **apenas** o ajuste de schema (`drop constraint if exists exercises_source_check` + `add constraint … check (source in ('wger','custom','hasaneyldrm'))`). Nome e timestamp mantidos de propósito, para não causar drift onde a migration já foi aplicada.
  - Dados viraram JSON versionado: `supabase/seed/data/hasaneyldrm-exercises.json` (1324 registros) e `hasaneyldrm-aliases.json` (1324), no formato "um objeto JSON por linha dentro de um array válido" — diff legível registro a registro.
  - `supabase/seed/generate-exercises-seed.mjs` (ESM, zero dependências) gera `supabase/seed/02_hasaneyldrm_exercises.sql` de forma determinística. O SQL gerado **não** é versionado (`supabase/seed/.gitignore`).
  - `supabase/config.toml` ganhou `[db.seed] enabled = true` / `sql_paths = ["./seed/*.sql"]`. Antes disso os seeds de `supabase/seed/` **nunca** eram aplicados; como efeito colateral pretendido, o `01_exercises.sql` (78 curados) passou a rodar e um reset vai de 1324 para 1402 exercícios.
  - Scripts na raiz: `db:seed:build` e `db:reset` (= `pnpm db:seed:build && supabase db reset`).
- **Sobre o peso:** 1042 KB → 1205 KB de conteúdo versionado. O refactor **não** economizou espaço; o ganho é migration limpa e dados revisáveis por registro.
- **Ressalvas operacionais:** seeds não rodam em `supabase db push`, e `supabase db reset` cru num clone limpo não traz o catálogo. Ambas detalhadas na **seção 2**.
