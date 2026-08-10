# BSTRAINER — Plano de continuidade entre computadores

**Data do checkpoint:** 2026-08-10  
**Produção:** `main` em `f86483b`  
**Branch de continuidade:** `codex/reliability-foundation` em `6b568b0` antes deste documento  
**Site:** https://psibrunosg.github.io/bstrainer/

## 1. Estado confiável do projeto

### Publicado em produção

- Alertas do personal usam apenas dados reais; não há fallback demonstrativo.
- Falhas de carregamento são explícitas e recuperáveis por nova tentativa.
- Consultas de alertas foram escaladas com projeção mínima, limite de sessões, lotes para planos/mesociclos e concorrência limitada.
- O painel mantém a semântica tudo-ou-erro para não apresentar informação parcial como verdadeira.
- A `main` passou por 44 testes web, typecheck, build/export de 40 páginas e suíte raiz (web 44/44, engine 66/66).
- GitHub Actions CI e Pages concluíram com sucesso.
- Smoke público confirmou landing, login e redirecionamento de `/clients/` para `/login/`, sem erros de console.

### Implementado apenas na branch de continuidade

- Medições vinculadas ao aluno: camada de dados, UI, estados recuperáveis e migrations RLS.
- Segurança estática reforçada em `client_links` e imutabilidade do `user_id` da medição.
- Contrato canônico de fichas alinhado ao domínio e ao banco.
- Serializer de ficha atômica e pgTAP inicial/fortalecido.
- Os testes web da branch passaram nas verificações anteriores, mas as migrations ainda não foram executadas contra um banco Supabase local funcional.

### Ainda não implementado ou não validado

- RPCs `create_plan_draft` e `publish_plan` e a migração da UI para esses RPCs.
- Execução do pgTAP de medições e fichas atômicas.
- Testes autenticados de CRUD atleta/personal e estados reais do painel de alertas.
- Tela principal de treino com blocos, técnicas, mídia sob toque e registro de baixíssimo atrito.
- Ciclo de vida de fichas: ativa, inativa, excluída recuperável e histórico/versionamento.
- Preferência de autonomia do atleta e regras de aprovação do personal.
- Sinalização de dificuldade/dor, substituição segura e alertas ao personal.
- Anamnese, avaliação física, IMC e composição corporal como guia, nunca diagnóstico.
- Indicadores de progresso e medições completos.
- Auditoria final responsiva em 320, 390 e 1024 px, acessibilidade, performance e segurança.

## 2. Bloqueio conhecido

No computador de origem, o Docker Desktop não expôs o engine Linux porque o componente opcional do WSL não estava disponível (`WSL_E_WSL_OPTIONAL_COMPONENT_REQUIRED`). Por isso, nenhum resultado de pgTAP ou `supabase db reset` deve ser presumido.

O outro computador precisa ter WSL2, virtualização e Docker Desktop funcionais antes de continuar as migrations.

## 3. Sequência de execução

### Fase 0 — Ambiente e retomada segura

1. Clonar/atualizar o repositório e buscar todas as branches.
2. Abrir uma worktree isolada para `codex/reliability-foundation`.
3. Ler `AGENTS.md`, `CONTEXT-MAP.md` e os `CONTEXT.md` dos pacotes tocados.
4. Ler este handoff e os planos referenciados no fim do documento.
5. Instalar com lockfile congelado e confirmar WSL/Docker/Supabase.

```powershell
git fetch --all --prune
git worktree add .worktrees/reliability-foundation codex/reliability-foundation
Set-Location .worktrees/reliability-foundation
pnpm install --frozen-lockfile
wsl --status
docker info
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase test db
```

Se `docker info` ou o Supabase falhar, diagnosticar o ambiente e parar as alegações sobre banco. Não contornar os testes.

### Fase 1 — Fechar medições vinculadas

1. Rodar `supabase/tests/body_measurements_rls.sql` no reset/teste completo.
2. Corrigir qualquer falha com TDD.
3. Validar ao vivo: atleta cria/edita/exclui a própria medição; personal vinculado visualiza e mantém conforme a política; usuário não vinculado não acessa.
4. Testar vazio, erro, retry e foco/teclado.
5. Validar 320, 390 e 1024 px em navegador real.

Plano: `docs/superpowers/plans/2026-08-10-linked-client-measurements.md`.

### Fase 2 — Fechar fichas atômicas

1. Executar e estabilizar o pgTAP existente.
2. Implementar migrations `security invoker` para `create_plan_draft` e `publish_plan`.
3. Gerar/ajustar tipos e integrar a camada web.
4. Migrar criação, edição, revisão e publicação para os RPCs.
5. Provar rollback completo, idempotência, autorização e ausência de ficha parcialmente publicada.

Plano: `docs/superpowers/plans/2026-08-10-atomic-plan-drafts.md`.

### Fase 3 — Tela de execução do treino

Construir a tela mais usada do produto com ordem global de blocos e exercícios:

- tags para `Drop-set`, `Rest-pause` e `Cluster`;
- árvore visual para `Bi-set`, `Tri-set` e `Superset`;
- carga e repetições pré-carregadas pelo personal;
- atleta revisa carga/repetições e confirma com mínimo de toques;
- mídia do exercício abre ao toque; mídia atual pronta e próxima pré-carregada/offline quando possível;
- timer, conclusão de série e navegação com alvos adequados ao polegar;
- compatibilidade com blocos mistos e técnicas combinadas sem perder a ordem prescrita.

Antes de implementar, capturar RED para contrato de dados, agrupamento, interação e fallback de mídia.

### Fase 4 — Ciclo de vida, autonomia e feedback

- Ficha ativa e inativa; inativa aparece no histórico.
- Exclusão é lógica e recuperável; restauração simples e auditável.
- Histórico/versionamento preserva o que foi realmente executado.
- Atleta escolhe no cadastro: automático, pedir aprovação ou apenas recomendações.
- Personal define limites; o sistema automatiza dentro deles.
- Dificuldade permite continuar e gera alerta não urgente.
- Dor interrompe, sugere substituição segura dentro da prescrição e gera alerta urgente.

### Fase 5 — Anamnese, avaliação e progresso

- Atleta pré-preenche anamnese; personal revisa e valida.
- Avaliação física e medições com histórico coerente.
- IMC e composição corporal apresentados como orientação, com limites e linguagem não diagnóstica.
- Indicadores de progresso derivados de dados reais e estados vazios honestos.
- Catálogo dinâmico para Strength Score e métricas consistentes por período.

### Fase 6 — Auditoria final e novo deploy

1. Revisão independente de código e segurança.
2. pgTAP, testes focados, suíte web, typecheck, build e suíte raiz.
3. Testes autenticados de atleta e personal.
4. Browser real em 320, 390, 1024 e desktop; teclado, leitores de tela básicos e redução de movimento.
5. Orçamento de performance para tela de treino e mídia.
6. Só então integrar incrementalmente à `main`, acompanhar CI/Pages e repetir o smoke público.

## 4. Regras de orquestração obrigatórias

- O modelo atual é o orquestrador e recebe dos subagentes apenas resultado final, evidências e bloqueios.
- Usar desenvolvimento dirigido por subagentes com ledger/relatórios em `.superpowers/sdd/`.
- Um implementador fresco por tarefa; o controlador não implementa a tarefa que está revisando.
- Não executar dois implementadores em paralelo sobre o mesmo worktree/arquivos.
- Toda feature ou correção começa em RED, passa a GREEN e só então refatora.
- Cada tarefa precisa de revisor independente e correção dos achados antes de avançar.
- Antes de qualquer alegação de conclusão: comandos frescos e saída confirmada.
- Não alegar pgTAP, RLS ou migrations aprovados quando Docker/Supabase não estiver operacional.
- Preservar alterações e arquivos não rastreados do usuário; não usar reset destrutivo.
- Usar `apply_patch` para edições manuais.
- Fazer deploy incremental apenas em checkpoint que esteja completo por si só.

## 5. Gates de conclusão

| Área | Implementação | Teste automatizado | Teste ao vivo | Deploy |
|---|---:|---:|---:|---:|
| Alertas reais e escaláveis | concluída | concluído | público parcial | concluído |
| Medições vinculadas | concluída na branch | web concluído; pgTAP pendente | pendente | pendente |
| Fichas atômicas | serializer/teste parcial | pgTAP não executado | pendente | pendente |
| Execução do treino | pendente | pendente | pendente | pendente |
| Ciclo de vida/autonomia/feedback | pendente | pendente | pendente | pendente |
| Anamnese/avaliação/progresso | pendente | pendente | pendente | pendente |
| Auditoria multidispositivo | pendente | pendente | pendente | pendente |

## 6. Referências canônicas

- `docs/superpowers/specs/2026-08-10-auditoria-ui-ux-automacao-total-design.md`
- `docs/superpowers/plans/2026-08-10-real-trainer-alerts.md`
- `docs/superpowers/plans/2026-08-10-scale-real-trainer-alerts.md`
- `docs/superpowers/plans/2026-08-10-linked-client-measurements.md`
- `docs/superpowers/plans/2026-08-10-atomic-plan-drafts.md`

## 7. Primeiro checkpoint esperado no outro computador

Não começar pela nova UI. Primeiro devolver ao orquestrador um único relatório contendo:

- hash e estado limpo da branch;
- versões de Node, pnpm, Docker, WSL e Supabase CLI;
- resultado real de `supabase db reset` e `supabase test db`;
- lista exata de falhas, se houver;
- recomendação objetiva: corrigir banco/medições ou avançar para os RPCs atômicos.
