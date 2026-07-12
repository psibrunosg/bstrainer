# bstrainer — Plano de Arquitetura e Features

**Documento oficial v0.1 — 2026-07-12**
Repo: `bstrainer`

---

## Visão em uma frase

SaaS web (PWA-ready) para prescrição, execução e análise de treinamento de força, servindo personal trainers (multi-aluno) e praticantes solo, com três motores de prescrição escalonados por plano: templates de periodização → manual assistido → geração por IA com revisão profissional.

---

## Decisões já fechadas com Bruno

| Tema | Decisão |
|---|---|
| Público | Híbrido: personal prescreve pra alunos + usuário solo monta próprio treino |
| Plataforma | Web primeiro, arquitetura pronta pra virar PWA/mobile sem reescrever |
| Engines | As 3 coexistem, escalonadas por tier pago |
| MVP | Planejamento + execução + analytics (ciclo completo) |
| Modelo de negócio | SaaS com planos pagos |
| Banco de exercícios | wger (semente, CC-BY-SA, exige atribuição) + curadoria própria pt-BR |
| Stack | Next.js (App Router) + Supabase — reuso do padrão já dominado (psibrunosg) |
| Enquadramento legal (usuário solo x CONFEF/CREF) | **Não trava MVP.** Disclaimer básico + PAR-Q+ na triagem; resolver formalmente antes de lançamento público |
| Billing | **Fora do MVP técnico.** Schema de `subscription`/`entitlement` fica pronto pra plugar depois; sem provedor escolhido ainda |

---

## A) Modelo de dados conceitual

### Princípio organizador

```
Macrociclo (3-12 meses, objetivo de longo prazo)
  └── Mesociclo (2-6 semanas, ênfase: hipertrofia/força/potência/deload)
        └── Microciclo (tipicamente 1 semana)
              └── Sessão planejada (o "treino A/B/C")
                    └── Exercício prescrito
                          └── Série prescrita (reps, carga-alvo, RPE/RIR-alvo, descanso)
```

Em paralelo existe a hierarquia do **executado** — nunca a mesma tabela do planejado. Comparar planejado × executado é o produto do analytics.

### Entidades

**Identidade e papéis**
- `profile` — id (= auth.users), nome, avatar, locale, unidade (kg/lb)
- `organization` — id, nome, owner_id. Usuário solo tem org pessoal implícita (mesmo modelo, sem bifurcar schema)
- `membership` — org_id, profile_id, role: `owner`/`trainer`/`client`/`solo`
- `client_link` — trainer_id, client_id, status (invited/active/archived). Aluno pode existir sem conta (convite pendente)

**Billing** (schema pronto, provedor a decidir)
- `subscription` — org_id, tier (`starter`/`pro`/`ai`), status, provider_customer_id, current_period_end
- `entitlement` — org_id, feature_key, limit (ex.: `max_clients: 5`, `ai_generations_month: 20`)

**Exercícios**
- `exercise` — id, org_id (NULL = global/importado), nome, padrão de movimento (squat/hinge/push_h/push_v/pull_h/pull_v/lunge/carry/core/isolation), grupos musculares, equipamento, tipo de carga, lateralidade, instruções, media_url, source (`wger`/`custom`), external_id
- `exercise_alias` — nome_alternativo (pt-BR: "levantamento terra" = "deadlift")
- `exercise_substitution` — substitute_id, motivo (alimenta swap por lesão/equipamento)

**Planejamento**
- `training_plan` (macrociclo) — org_id, client_id, criado_por, objetivo, data_início/fim, engine (`template`/`assisted`/`ai`), status
- `mesocycle` — plan_id, ordem, semanas, ênfase, modelo_progressão, inclui_deload
- `workout_template` (sessão planejada) — mesocycle_id, nome, dia_semana, ordem
- `prescribed_exercise` — workout_template_id, exercise_id, ordem, técnica (straight/superset/dropset/rest_pause/cluster)
- `prescribed_set` — reps_min/max, método_carga (%1rm/rpe/rir/absolute/bodyweight), valor_carga, rpe/rir_alvo, descanso_seg, is_warmup, is_amrap
- `plan_template` — biblioteca reutilizável, tier mínimo, autoria, tags

**Execução**
- `workout_session` — client_id, workout_template_id (nullable — treino livre existe), started_at/finished_at, status, sRPE geral, prontidão pré-treino (sono/dor/energia)
- `performed_exercise` — session_id, exercise_id, prescribed_exercise_id (nullable), foi_substituído
- `performed_set` — reps, carga_kg, rpe/rir, is_failure, is_warmup, tempo_seg, notas. e1RM sempre derivado, nunca armazenado

**Avaliação física**
- `assessment` — client_id, avaliador_id, data, tipo (anthropometry/strength_test/readiness/parq)
- `assessment_measure` — EAV controlado por catálogo (massa, perímetros, dobras com protocolo registrado, 1RM/nRM com fórmula usada)
- `injury_restriction` — região/padrão afetado, exercícios contraindicados, vigência, origem

**IA e auditoria**
- `ai_generation` — input (anamnese pseudonimizada), output bruto, modelo, custo, plan_id resultante, revisado_por, aprovado_em, diff. Trilha obrigatória
- `audit_log` — genérico de alterações

### Regras estruturais

1. **Planejado ≠ executado, sempre.** `prescribed_*` imutável após ativação (versionar, não editar in-place)
2. **RLS por `org_id` em tudo** + `client` só lê próprios dados; `trainer` lê dados dos `client_link` ativos
3. **Exercícios globais** (`org_id NULL`) somente-leitura; customização = fork copy-on-write, preservando `external_id`
4. **Nada de métricas derivadas armazenadas como fonte** (e1RM, tonelagem, volume semanal) — calcular em views

---

## B) Features por fase

### MVP — o ciclo completo, fino

Critério de corte: cada feature no caminho crítico do loop **criar ficha → executar → ver progresso**.

1. Auth + orgs + convite de aluno (link mágico)
2. Banco de exercícios (wger importado + custom + busca pt-BR)
3. Construtor de ficha (engine manual simples, sem sugestões ainda)
4. Biblioteca de templates de periodização (engine Tier 1) — 8–12 templates: linear iniciante, full body 3x, upper/lower, PPL, ondulatória diária DUP 2x/sem, bloco acumulação→intensificação com deload
5. Modo execução (logger) mobile-first, offline-first básico — timer de descanso, "repetir última carga", teclado numérico grande
6. RPE/RIR no registro, com micro-onboarding explicativo
7. Dashboard de progresso v1 — e1RM por exercício, tonelagem semanal, séries semanais por grupo muscular, aderência, sRPE×duração
8. Schema de billing pronto (`subscription`/`entitlement`), sem provedor plugado ainda
9. PWA básico (manifest, instalável, cache de shell)

**Fora do MVP de propósito:** chat trainer↔aluno, nutrição, wearables, vídeos próprios, agenda, avaliação física completa (entra reduzida: peso + PAR-Q+ no onboarding).

### V2 — assistência inteligente e retenção

1. Engine assistida completa (Tier médio) — precisa de 4–8 semanas de dados reais por usuário
2. Alertas de volume e monotonia (faixas configuráveis, rotuladas como heurística)
3. Avaliação física completa (antropometria com protocolo, testes de nRM, fotos)
4. Engine IA (Tier alto) + fluxo de revisão/aprovação
5. Anamnese estruturada
6. Relatório periódico pro aluno (PDF/link)
7. Deload automático sugerido
8. Push notifications (PWA)
9. **Billing real plugado** (provedor a decidir — ver Riscos)
10. **Enquadramento legal formal** pro usuário solo (ver Riscos)

### V3 — plataforma

1. Marketplace de templates entre profissionais
2. Integração wearables (HR, sono)
3. Testes de campo adicionais (saltos, VBT)
4. Times/equipes (múltiplos trainers por org, academias) — muda modelo comercial B2B
5. App nativo (Capacitor/Expo casca sobre mesma API) — só se PWA provar limite real
6. Nutrição básica ou integração — escopo-armadilha, adiar ao máximo

---

## C) As três engines de prescrição

Chassi único: todas produzem `training_plan` no mesmo schema. Diferença é quem decide o quê — uma camada `plan-engine` com três estratégias, não três sistemas.

### C.1 Engine 1 — Templates de periodização (Tier baixo)

Biblioteca curada de macro/mesociclos parametrizáveis (periodização linear, ondulatória diária/semanal, blocos ATR simplificado). Instancia e escala, não gera.

**Entrada:** template + dias/semana + equipamento + cargas de referência (ou "não sei" → 1-2 semanas de familiarização em RPE).

**Processa:** instancia esqueleto → resolve slot de padrão de movimento para exercício concreto compatível → converte %1RM em kg (arredondado ao incremento de placa) ou faixa de reps+RPE se sem 1RM → aplica progressão do template.

**Saída:** `training_plan` ativo, editável (edição rebaixa pra "template modificado", rastreado).

### C.2 Engine 2 — Manual assistido (Tier médio)

Profissional monta tudo; sistema é copiloto de segurança e progressão. Nunca decide sozinho.

**Três serviços:**
1. Sugestão de progressão (dupla progressão: topo da faixa de reps + RPE ≤ alvo → sugerir +carga; abaixo do piso ou RPE estourado 2x → manter/reduzir 5-10%). e1RM móvel plano/negativo 3+ sessões com sRPE subindo → sinalizar estagnação/deload
2. Auditoria de volume em tempo de edição (séries semanais por grupo/padrão, alertas de grupo zerado, assimetria push/pull, salto >30-50% entre semanas — heurística, não veredito)
3. Guarda de restrições (exercício em conflito com `injury_restriction` → aviso bloqueável com justificativa registrada)

### C.3 Engine 3 — IA com revisão profissional (Tier alto)

Geração de rascunho por LLM, estruturalmente restrita, obrigatoriamente revisada.

**Entrada:** anamnese estruturada (pseudonimizada) + catálogo de exercícios pré-filtrado por equipamento/restrições.

**Arquitetura anti-alucinação:**
1. LLM devolve JSON validado contra schema, exercícios só por ID do catálogo fornecido
2. Pós-validação determinística (mesma auditoria da Engine 2) — falhou → re-prompt automático; falhou de novo → degrada pra template mais próximo + aviso
3. Prompt de sistema ancorado em princípios (sobrecarga progressiva, especificidade, faixas de volume/intensidade) — LLM preenche variáveis dentro de trilhos
4. Fluxo de aprovação: plano nasce `draft`, ativa só com aprovação do trainer (diff gravado). Usuário solo: aceite de termos + PAR-Q+ sem bandeira vermelha (bandeira vermelha bloqueia geração)

**Saída:** `training_plan` draft + `ai_generation` completo. Gerações contadas por `entitlement` mensal.

---

## D) Riscos e decisões em aberto

1. **wger — atribuição obrigatória.** Dados CC-BY-SA: creditar fonte, manter share-alike nos dados derivados. Curar ~150 exercícios mais usados em pt-BR como ativo próprio.
2. **Enquadramento legal (CONFEF/CREF) — adiado.** MVP segue com disclaimer + PAR-Q+ básico. **Resolver formalmente antes de lançamento público** — considerar profissional de EF parceiro pra chancelar templates e revisar IA (mitiga risco + dá credibilidade técnica).
3. **LGPD.** Anamnese/lesões/PAR-Q+ são dados sensíveis (art. 5º, II). Consentimento explícito, RLS impecável, retenção/exclusão. Engine IA nunca recebe dado identificado — anamnese pseudonimizada (mesma regra já aplicada no roteamento Jarvis).
4. **Billing — adiado do MVP técnico.** Schema `subscription`/`entitlement` pronto; provedor (Stripe/Mercado Pago/outro) e preços dos tiers decidir no V2.
5. **Autoria do conteúdo dos templates.** Bruno não é profissional de EF — recomendado parceiro/consultor de EF pra chancelar a biblioteca de templates (liga com risco 2).
6. **Offline no logger.** MVP: fila otimista IndexedDB + last-write-wins por série. Academia com sinal ruim é cenário normal, não exceção.
7. **Provedor da engine IA (V2).** Custo/geração, structured output, zero-retention — abstração de provedor entra no design desde já (reusa padrão de roteamento do Jarvis).

---

## E) Stack técnica

**Next.js (App Router) + Supabase.**

- Reuso de conhecimento já validado no psibrunosg — reduz custo de debugging.
- Supabase cobre 80% do backend do MVP: Postgres+RLS (multi-tenant é RLS puro), Auth magic link, Realtime, Storage, Edge Functions.
- PWA sobre Next.js (Serwist/next-pwa) cumpre "mobile depois sem reescrever". V3 nativo = Capacitor sobre mesma codebase.
- Descartado: Expo/RN já (dobra superfície cedo demais), backend próprio (nada exige agora), Firebase (domínio fortemente relacional).

| Camada | Escolha |
|---|---|
| Framework | Next.js 15+, App Router, TypeScript strict |
| UI | Tailwind + shadcn/ui |
| Estado/servidor | TanStack Query + supabase-js; Zod nas bordas |
| Gráficos | Recharts |
| Offline | IndexedDB (Dexie) + fila de sync própria |
| Billing | Schema pronto, provedor a decidir; webhooks em Edge Function; `entitlement` local — nunca checar tier no client |
| IA | Route handler server-side, abstração de provedor, structured outputs, dados pseudonimizados |
| Testes | Vitest (engines — puras e testáveis) + Playwright (fluxo crítico) |
| Deploy | Vercel + Supabase cloud; migrations versionadas (supabase CLI) |

**Decisão-chave:** lógica de domínio (progressão, auditoria de volume, e1RM, instanciação de template, validação IA) em pacotes TS puros sem dependência de framework (`packages/engine`, `packages/domain`) — garante portabilidade mobile e testabilidade isolada.

---

## F) Estrutura do repositório

```
bstrainer/
├── apps/
│   └── web/                        # Next.js (App Router)
│       ├── app/
│       │   ├── (marketing)/        # landing, pricing
│       │   ├── (auth)/             # login, convite, onboarding
│       │   ├── (app)/
│       │   │   ├── dashboard/      # analytics
│       │   │   ├── clients/        # gestão de alunos (trainer)
│       │   │   ├── plans/          # construtor de ficha + templates
│       │   │   ├── train/          # logger de execução (mobile-first, offline)
│       │   │   ├── assessments/    # avaliações (V2 amplia)
│       │   │   └── settings/       # org, billing, perfil
│       │   └── api/
│       │       ├── webhooks/stripe/
│       │       └── ai/generate/    # engine 3, server-only
│       ├── components/
│       ├── lib/                    # supabase clients, auth helpers
│       └── public/                 # manifest PWA, ícones
├── packages/
│   ├── domain/                     # tipos de domínio (Zod = fonte única), sem framework
│   ├── engine/                     # AS 3 ENGINES — TS puro, 100% testável
│   │   ├── templates/              # engine 1 + biblioteca tipada
│   │   ├── progression/            # dupla progressão, e1RM, estagnação (engine 2)
│   │   ├── audit/                  # volume semanal, alertas, guarda de restrições
│   │   └── ai/                     # prompts, schema output, validação (engine 3)
│   ├── db/                         # tipos gerados do Supabase, queries compartilhadas
│   └── ui/                         # adiar até precisar
├── supabase/
│   ├── migrations/                 # SQL versionado (schema seção A)
│   ├── seed/                       # exercícios wger+curados, templates
│   └── functions/
├── docs/
│   ├── ARQUITETURA.md              # este documento
│   ├── decisoes/                   # ADRs curtos
│   └── templates-treino/           # fichas técnicas dos templates com referências
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Sequência de execução do MVP

1. Scaffold monorepo + Supabase project + auth + orgs/membership + RLS
2. Migrations do domínio completo (schema estável cedo evita retrabalho)
3. Seed de exercícios (wger + curadoria pt-BR)
4. Construtor de ficha manual
5. Logger de execução
6. Dashboard v1
7. Engine de templates
8. PWA polish

(Billing e engine IA/assistida ficam pro V2, conforme decisão de escopo.)
