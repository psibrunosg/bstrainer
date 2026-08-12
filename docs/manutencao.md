# Guia de Manutenção — bstrainer

> **Versão:** 2026-08-11  
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
| `README.md` | Visão geral do produto | ⚠️ Desatualizado (diz "implementação não iniciada") |
| `docs/ARQUITETURA.md` | Plano de arquitetura e features | ⚠️ Desatualizado (lista pastas que não existem) |
| `docs/auditoria-projeto.md` | Auditoria deste repositório | ✅ Atual (2026-08-11) |
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
cd packages/engine && pnpm vitest run    # 9 suites, 66 tests
cd apps/web && pnpm vitest run           # requer jsdom instalado

# Lint
pnpm lint             # NÃO FUNCIONA — falta config ESLint (ver Dívidas)
```

### Armadilhas conhecidas

| Armadilha | Por quê | Como evitar |
|---|---|---|
| **Build falha por causa de `vitest.setup.ts`** | O `tsconfig.json` do web inclui `**/*.ts`, que pega `vitest.setup.ts`. Ele importa `@testing-library/react` (devDependency) e quebra o build de produção. | Não commite sem verificar build local. Correção: excluir `**/*.test.ts`, `**/*.test.tsx` e `vitest.setup.ts` do `tsconfig.json` include. |
| **Vitest escaneia `.worktrees/`** | Se houver uma worktree git local, o vitest pode encontrar arquivos `.test.tsx` duplicados lá e falhar. | Adicionar `.worktrees/` ao `exclude` do `vitest.config.ts`, ou manter worktrees fora do repo. |
| **Next.js static export + images** | `images: { unoptimized: true }` é obrigatório para `output: "export"`. Se alguém remover isso, o build quebra. | Não alterar `next.config.ts` sem testar build. |
| **Bundle budget gate quebra se manifest muda** | `scripts/check-bundle-budget.mjs` lê `.next/app-build-manifest.json`. Com `output: "export"`, o manifest ainda é gerado, mas o path é implícito. | Se o script falhar, verifique se `.next/` existe após build. |
| **pnpm não está no PATH em alguns ambientes** | Em shells Git Bash no Windows, `pnpm` pode não ser encontrado se instalado via corepack. | Usar `corepack pnpm <cmd>` ou path absoluto. |

---

## 3. Estado atual dos gates (validado em 2026-08-11)

> ⚠️ Não copie da auditoria — sempre revalide rodando localmente.

| Gate | Estado | Evidência |
|---|---|---|
| **Engine tests** | ✅ Passando | `packages/engine`: 9 suites, 66 tests, 0 falhas |
| **Web tests** | ⚠️ Parcial | Ambiente local não resolve `jsdom` corretamente (problema de hoisting pnpm). Em execução manual da raiz: 28 passaram, 9 falharam (todos da `.worktrees/`, não do projeto). |
| **Engine typecheck** | ✅ Passando | `tsc --noEmit` limpo no `packages/engine` |
| **Web typecheck** | ❌ Quebrado | `vitest.setup.ts` e `.test.tsx` compilados pelo tsc; `toBeInTheDocument` e `@testing-library/react` não resolvidos |
| **Web build** | ❌ Quebrado | Mesmo motivo do typecheck — `vitest.setup.ts` é pego pelo `include: ["**/*.ts"]` do `tsconfig.json` |
| **Lint** | ❌ Inexistente | Não há `.eslintrc` nem `eslint.config.*`; script `"lint": "next lint"` no `package.json` não funciona |
| **Bundle budget** | ⚠️ Depende de build | Script existe e é chamado pela CI, mas o build precisa passar primeiro |

### Resumo dos gates
```
Engine:  ████████████████████  OK  (tests + typecheck)
Web:     ██████░░░░░░░░░░░░░░  BROKEN  (build + typecheck + lint)
CI:      ░░░░░░░░░░░░░░░░░░░░  CI CONFIGURADO mas build quebraria
```

---

## 4. Dívidas técnicas vivas

> Cada dívida: o que é → onde → o que fazer ao tocar na área.

### D1 — Build/typecheck do web quebrado por `vitest.setup.ts`
- **O que é:** O `tsconfig.json` do web inclui `**/*.ts`, que captura `vitest.setup.ts`. Esse arquivo importa `@testing-library/react` (devDependency). No build de produção e no `tsc --noEmit`, essas importações não são resolvidas.
- **Onde:** `apps/web/tsconfig.json` linha 14; `apps/web/vitest.setup.ts`
- **O que fazer ao tocar:**
  - Adicionar `**/*.test.ts`, `**/*.test.tsx`, `vitest.setup.ts` ao `exclude` do `tsconfig.json`
  - Ou criar `tsconfig.test.json` separado para testes e usar no vitest
  - Verificar que `pnpm build` passa antes de abrir PR

### D2 — ESLint não configurado
- **O que é:** Script `"lint": "next lint"` existe mas não há config nem dependência instalada.
- **Onde:** `apps/web/package.json`; ausência de `.eslintrc*`
- **O que fazer ao tocar:**
  - Instalar `eslint` + `eslint-config-next` como devDependencies
  - Criar `.eslintrc.json` mínimo
  - Rodar `pnpm lint` e corrigir erros existentes (pode ser volumoso)
  - Adicionar `pnpm lint` à CI

### D3 — `vitest.config.ts` não exclui `.worktrees/`
- **O que é:** Se existir uma git worktree local, o vitest escaneia seus arquivos `.test.tsx` e pode falhar (imports não resolvem no contexto da worktree).
- **Onde:** `apps/web/vitest.config.ts`
- **O que fazer ao tocar:**
  - Adicionar `'.worktrees'` ao array `exclude` do vitest config
  - Ou usar `include` mais restrito ao invés de deixar vitest escanear tudo

### D4 — README e ARQUITETURA.md desatualizados
- **O que é:** README diz "implementação não iniciada"; ARQUITETURA.md lista `packages/ui/`, `app/(marketing)/`, `app/api/` que não existem.
- **Onde:** `README.md`; `docs/ARQUITETURA.md` seção F
- **O que fazer ao tocar:**
  - Atualizar README com status real do MVP
  - Atualizar seção F da ARQUITETURA.md para refletir estrutura real
  - Remover menções a libs não usadas (TanStack Query, Dexie) ou adicioná-las

### D5 — `@bstrainer/db` é dependência fantasma no web
- **O que é:** `apps/web/package.json` declara `@bstrainer/db` como dependência, mas nenhum arquivo do web o importa. O web usa Supabase diretamente.
- **Onde:** `apps/web/package.json`
- **O que fazer ao tocar:**
  - Remover `@bstrainer/db` do `apps/web/package.json` se não houver plano de uso imediato
  - Ou migrar os data layers do web para usar `@bstrainer/db`

### D6 — Migration gigante no repo
- **O que é:** `20260715170000_import_hasaneyldrm_exercises.sql` tem ~1MB de INSERTs. Dificulta clone e review.
- **Onde:** `supabase/migrations/`
- **O que fazer ao tocar:**
  - Considerar converter para seed script que lê JSON externo
  - Ou separar em migration de schema + seed de dados

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
- [ ] Build passa: `pnpm build`
- [ ] Typecheck passa: `pnpm typecheck`
- [ ] Testes do engine passam: `cd packages/engine && pnpm vitest run`
- [ ] Não introduz novas dependências sem justificativa
- [ ] Migrations são versionadas e nomeadas com timestamp `YYYYMMDDhhmmss_`
- [ ] RLS cobre novas tabelas (se aplicável)

---

## 6. Checklist pré-commit (para o dev)

Antes de `git commit`, verifique:

```bash
# 1. Typecheck no engine (rápido, 2-3s)
cd packages/engine && tsc --noEmit

# 2. Testes do engine (rápido, 3-5s)
cd packages/engine && vitest run

# 3. Build do web (mais lento, ~20-30s)
cd apps/web && next build
# ⚠️ Build está quebrado atualmente (D1). Não ignore — corrija ou documente.

# 4. Verifique se não commitou arquivos de runtime
# Nunca commite: .claude/, .claude-flow/, .next/, out/, node_modules/
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

*Nenhuma registrada ainda.*
