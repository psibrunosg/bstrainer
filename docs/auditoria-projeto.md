# Auditoria do Projeto bstrainer

> **Data da auditoria:** 2026-08-11  
> **Auditor:** agente sênior (análise baseada em código real, não em documentação)  
> **Branch:** `main`  
> **Commits desde o início:** ~100+ (histórico ativo desde 2026-07)

---

## 1. O que é o projeto

### Propósito
SaaS web (PWA-ready) para prescrição, execução e análise de treinamento de força. Atende dois públicos: **personal trainers** (prescrevem para alunos) e **usuários solo** (montam próprio treino). Três motores de prescrição escalonados por plano: templates de periodização → manual assistido → geração por IA revisada.

### Stack
| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15+ (App Router), React 19, TypeScript strict |
| Monorepo | pnpm 11.12.0 + Turborepo 2.5.0 |
| Estilo | Tailwind CSS 4.1 + CSS custom tokens (`globals.css`) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Gráficos | Recharts |
| Offline | IndexedDB (`idb` package) + fila de sync própria |
| Testes | Vitest (engine + web), jsdom, Testing Library |
| Deploy | GitHub Pages (static export via `output: "export"`) |

### Arquitetura
Monorepo com 1 app + 3 packages:

```
bstrainer/
├── apps/
│   └── web/              # Next.js App Router, ~20 páginas, PWA
├── packages/
│   ├── domain/           # Tipos Zod de domínio (exercise, plan, session, athlete...)
│   ├── engine/           # Lógica pura TS: progression, audit, templates, gamification, recommend
│   └── db/               # Tipos gerados do Supabase (database.types.ts)
├── supabase/
│   ├── migrations/       # 18 migrations SQL versionadas (schema completo)
│   ├── functions/        # Edge functions (vazio atualmente)
│   └── seed/             # Seed scripts
├── docs/                 # Documentação do produto e ADRs
└── scripts/              # download-exercises-media.mjs
```

### Estado real da implementação
Contrário ao que o README afirma ("implementação não iniciada"), o projeto está **significativamente implementado**:

- **18 migrations** com schema completo (identidade, billing, exercícios, planejamento, execução, avaliações, RLS, analytics views, onboarding, invites, trainer selection, athlete profiles/goals, messages, activities/blocks, body measurements)
- **20+ páginas Next.js** funcionais: dashboard, train/session, plans, plans/new, plans/templates, clients, messages, measurements, onboarding, personal, settings, today, login
- **Engine com testes**: 13 módulos (e1rm, autoregulation, deterministic-engine, session-load, weekly-volume, frequency, templates/types+library+instantiate, plan-recommender, strength-score, xp, badges) — **todos com testes .test.ts**
- **Offline sync** implementado com IndexedDB
- **PWA** com manifest e service worker
- **CI/CD** com GitHub Actions (CI + deploy para Pages)

---

## 2. Arquivos descartáveis / fora do gitignore

> Verificação via `git ls-files` + `git status`. Working tree limpo (`nothing to commit`).

| Caminho | Motivo | Ação sugerida |
|---|---|---|
| `.claude/` (3 arquivos) | Config local do Claude IDE — runtime local | `git rm --cached -r .claude/`, adicionar ao `.gitignore` |
| `.claude-flow/` (547 arquivos, ~24K linhas) | Daemon logs, métricas, estado de sessões do Claude — **runtime puro** | `git rm --cached -r .claude-flow/`, adicionar ao `.gitignore` |
| `apps/web/.next/` (presente no disco, não no git) | Build output do Next.js — já no `.gitignore` ✅ | Nenhuma ação (já ignorado) |
| `apps/web/out/` (presente no disco, não no git) | Static export output — já no `.gitignore` ✅ | Nenhuma ação (já ignorado) |
| `apps/web/.turbo/` (presente no disco, não no git) | Cache do Turborepo — já no `.gitignore` ✅ | Nenhuma ação (já ignorado) |
| `node_modules/` (raiz + packages) | Não rastreados no git ✅ | Nenhuma ação |
| `apps/web/public/exercise-media/bstrainer/` (1324 GIFs, ~126MB) | Assets de exercícios importados do dataset hasaneyldrm — **intencionalmente rastreados** | Manter (são dependências de runtime do app) |
| `apps/web/tsconfig.tsbuildinfo` | Cache do TypeScript — **NÃO está no git** ✅ | Nenhuma ação |

**Nota:** Os arquivos `.claude/` e `.claude-flow/` são o único conjunto de arquivos voláteis realmente rastreados pelo git. O `.gitignore` atual não os cobre.

---

## 3. Incongruências (docs vs. código)

> Todas as evidências abaixo foram verificadas contra o código real.

| # | Item | Evidência | Impacto | Recomendação |
|---|---|---|---|---|
| 1 | **README mente sobre o estado** | `README.md` linha 9: `"Status: planejamento concluído, implementação não iniciada"`. Existe código em `apps/web/`, `packages/engine/`, 18 migrations, testes, CI, deploy. | Desorienta novos devs e stakeholders; documentação perde credibilidade | Atualizar README com estado real: MVP em progresso, features implementadas |
| 2 | **`packages/ui/` não existe** | `docs/ARQUITETURA.md` seção F lista `packages/ui/` ("adiar até precisar"). Não existe no repo. | Documentação desatualizada | Remover referência ou criar package se necessário |
| 3 | **`(marketing)/` e `api/` não existem** | `docs/ARQUITETURA.md` lista `app/(marketing)/` (landing, pricing) e `app/api/` (webhooks, AI). Não existem no disco. | Documentação divergente da estrutura real | Atualizar seção F da ARQUITETURA.md |
| 4 | **TanStack Query e Zod "nas bordas" não usados no web** | ARQUITETURA.md seção E lista TanStack Query + Zod. No `apps/web/package.json` não há `@tanstack/react-query`, e `zod` não é importado em nenhum arquivo `.ts/.tsx` do web. | Stack documentada ≠ stack real | Atualizar docs ou adicionar as libs se fizerem parte do roadmap |
| 5 | **Dexie mencionado, `idb` usado** | ARQUITETURA.md cita "Dexie" para offline. O web usa `idb` (pacote mais baixo-nível) diretamente em `lib/workout/storage.ts` e `lib/workout/sync.ts`. | Pequena inconsistência de docs | Atualizar docs ou migrar para Dexie se for intenção |
| 6 | **ESLint não configurado** | `apps/web/package.json` tem script `"lint": "next lint"`, mas **não existe** `.eslintrc*`, `eslint.config.*`, nem `eslint` em `devDependencies`. | Gate de qualidade ausente; CI não roda lint de fato | Adicionar config ESLint + devDependency, ou remover script |
| 7 | **`@bstrainer/db` não é usado no web** | `apps/web/package.json` depende de `@bstrainer/db` (workspace), mas grep por `@bstrainer/db` em `apps/web/` retorna 0 imports. O web usa `supabase-js` direto via `@/lib/supabase/client.ts`. | Dependência fantasma no web | Remover `@bstrainer/db` do `apps/web/package.json` se não for usado |
| 8 | **`@bstrainer/domain` pouco usado no web** | Domain é dependência do web e do engine. No web, tipos vêm principalmente de `@/lib/data/*` (wrappers do Supabase), não de `@bstrainer/domain`. | Package domain pode estar subutilizado no front | Avaliar se vale a pena manter a duplicação de tipos |
| 9 | **CI roda `check-bundle-budget.mjs` que depende de `.next/`** | `.github/workflows/ci.yml` roda `node apps/web/scripts/check-bundle-budget.mjs`. O script lê `.next/app-build-manifest.json`, mas o build usa `output: "export"` que gera `out/`. O manifest ainda é gerado durante build, mas o script depende de path relativo ao `.next/`. | Gate de bundle pode quebrar silenciosamente se o manifest não for gerado | Validar que o manifest existe após build static, ou ajustar script |
| 10 | **`skills-lock.json` não documentado** | Arquivo `skills-lock.json` na raiz (10KB) — não há menção nos docs sobre o que é. | Arquivo misterioso para novos devs | Documentar propósito ou mover para `.gitignore` se for lock de ferramenta local |
| 11 | **`.worktrees/` no `.gitignore` mas presente no disco** | `.worktrees/reliability-foundation/` existe no working tree com cópia parcial do repo. | Artefato de desenvolvimento local | Nenhuma ação se não estiver rastreado (não está) |
| 12 | **Migrations em ordem cronológica mas com gaps de data** | Migrations vão de `20260712*` até `20260804*`, mas há saltos (ex.: `20260715*` → `20260717*` → `20260720*` → `20260804*`). Não há conflito de timestamp. | Nenhum impacto funcional, mas pode confundir | Manter como está; documentar que gaps são normais |
| 13 | **Migration de exercícios gigante (~1MB)** | `20260715170000_import_hasaneyldrm_exercises.sql` contém ~3000+ INSERTs de exercícios e ocupa ~1MB. | Deixa o repo pesado para clone; não é versionável de forma útil | Considerar migrar para seed script (SQL gerado dinamicamente) ou arquivo JSON separado |

---

## 4. Recomendações prioritárias (Top 3)

### 🥇 #1 — Remover arquivos de runtime do git + atualizar `.gitignore`
**O quê:** `.claude/` (3 arquivos) e `.claude-flow/` (547 arquivos, ~24K linhas) estão rastreados no git. São logs e estado de daemon local do Claude.
**Porquê:** Poluem o histórico, aumentam clone time, contêm dados de sessão local.
**Como:** `git rm --cached -r .claude/ .claude-flow/` e adicionar ambos ao `.gitignore` raiz.

### 🥈 #2 — Corrigir README e documentação de arquitetura
**O quê:** O README afirma "implementação não iniciada", mas há 20+ páginas, engine completa com testes, 18 migrations, CI/CD funcional.
**Porquê:** Documentação desatualizada cria desconfiança e desorienta qualquer pessoa que entre no projeto.
**Como:** Atualizar README com status real, lista de features implementadas, e link para docs. Atualizar `ARQUITETURA.md` seção F (estrutura do repo) para refletir a realidade atual.

### 🥉 #3 — Configurar ESLint ou remover o script de lint
**O quê:** `apps/web/package.json` tem `"lint": "next lint"` mas não há configuração de ESLint instalada.
**Porquê:** Gate de qualidade quebrado/ilusório. A CI não roda `pnpm lint` mas o script existe e não funciona.
**Como:** Instalar `eslint` + `eslint-config-next` como devDependencies e criar config, OU remover o script do package.json se não for prioridade agora.

---

## Apêndice: Comandos de verificação usados

```bash
# Estrutura do projeto
find . -maxdepth 3 -type f | head -120
ls -la

# Git
git status
git ls-files | wc -l
git ls-files | grep -E '^\.claude' | wc -l
git ls-files | grep -E '^\.claude-flow' | wc -l
git ls-files | grep 'node_modules' | wc -l
git ls-files | grep -E '^apps/web/\.next/' | wc -l
git log --oneline -20

# Código
grep -rEi '(TODO|FIXME|HACK|XXX|BUG)' --include='*.ts' --include='*.tsx' apps/web/ packages/ scripts/ supabase/ docs/
grep -r '@bstrainer/ui' apps/ packages/
grep -rE 'zod' apps/web/ --include='*.ts' --include='*.tsx'
ls apps/web/app/ && ls apps/web/app/api/ 2>/dev/null

# Tamanhos
du -sh apps/web/public/exercise-media/bstrainer/
wc -l $(git ls-files | grep -E '^.claude-flow/') | tail -1
```
