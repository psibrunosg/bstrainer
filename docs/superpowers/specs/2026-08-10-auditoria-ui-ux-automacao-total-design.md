# Auditoria UI/UX, automação e jornada completa do bstrainer

**Data:** 2026-08-10  
**Estado:** proposta aprovada em conversa; aguardando revisão deste documento  
**Escopo:** auditoria completa, remediação incremental e deploy verificado

## 1. Objetivo

Transformar o bstrainer em um sistema de prescrição e execução de treino no qual:

- o atleta informa contexto, revisa carga e repetições e registra a execução com o mínimo de interação;
- o personal define modelos, limites e exceções, em vez de remontar manualmente cada treino;
- o motor aplica progressões explicáveis dentro da autonomia escolhida pelo atleta e dos limites definidos pelo personal;
- dor, dificuldade, baixa adesão e regressão chegam ao personal como exceções acionáveis;
- anamnese, avaliação física, medições, fichas, treino e progresso formam uma única jornada rastreável;
- computador, tablet e celular oferecem interfaces adequadas ao contexto de uso, sem apenas ampliar ou reduzir a mesma tela.

O trabalho será organizado por jornadas verticais. Cada jornada cobre interface, comportamento, domínio, persistência, segurança, acessibilidade, responsividade, performance, offline e observabilidade.

## 2. Princípios de produto

1. **Execução antes de configuração.** A tela de treino é a superfície prioritária do produto.
2. **Um toque quando o valor sugerido estiver correto.** Digitação é exceção, não caminho padrão.
3. **Automação explicável e reversível.** Toda recomendação relevante registra dados de entrada, regra, valor anterior, sugestão, decisão e responsável.
4. **Autonomia supervisionada.** O atleta escolhe o nível de autonomia; o personal pode restringi-lo com motivo visível. Limites de segurança nunca podem ser ultrapassados.
5. **Prescrito e realizado permanecem distintos.** Alterar a ficha não reescreve o histórico executado.
6. **Gestão por exceções.** O personal recebe somente o que exige conferência ou intervenção.
7. **Indicadores orientam; não diagnosticam.** IMC, composição corporal e relações antropométricas são apresentados com contexto e limitações, sem substituir avaliação médica.
8. **Sem dark patterns.** Nenhum mecanismo de adesão pode ocultar intenção, retirar alternativas ou explorar vulnerabilidades.
9. **Offline é um estado normal.** O atleta deve conseguir abrir, executar, editar e concluir a sessão sem conexão, com sincronização idempotente posterior.
10. **Não copiar concorrentes.** Benchmarks informam padrões e expectativas; identidade, textos, sequência e composição visual permanecem próprios do bstrainer.

## 3. Personas e níveis de autonomia

### 3.1 Atleta

Escolhe no onboarding e pode alterar depois:

- **Automático:** o sistema aplica progressões dentro dos limites do personal e informa o que mudou.
- **Aprovação prévia:** o sistema recomenda e o atleta confirma antes de aplicar.
- **Somente recomendação:** o sistema explica, mas não altera valores automaticamente.

### 3.2 Personal

Define limites por atleta, plano e técnica. Pode restringir a autonomia escolhida, desde que registre um motivo visível ao atleta. Recebe um feed priorizado de exceções, não uma lista genérica de atividades.

### 3.3 Regras invariantes

- Dor ou desconforto interrompe o exercício, oferece uma substituição segura e cria alerta prioritário.
- Dificuldade sem dor permite continuar, pular ou substituir e cria sinalização não urgente.
- Mudanças fora dos limites do personal exigem aprovação humana, independentemente da preferência do atleta.

## 4. Jornadas da auditoria

1. Cadastro, vínculo e onboarding.
2. Escolha e alteração do nível de autonomia.
3. Anamnese preenchida pelo atleta e validada pelo personal.
4. Avaliação física, medições, indicadores orientativos e reavaliação.
5. Criação, revisão, publicação, ativação, inativação, exclusão recuperável e restauração de fichas.
6. Preparação do treino do dia com dados já preenchidos.
7. Execução de exercícios, atividades, circuitos e técnicas avançadas.
8. Sinalização de dificuldade, dor e indisponibilidade de equipamento.
9. Progressão, deload, substituição e demais adaptações automáticas.
10. Progresso, metas, adesão, medidas e composição corporal.
11. Workspace do personal e gestão por exceções.
12. Mensagens e comunicação contextual.

## 5. Diagnóstico inicial confirmado

### 5.1 Tela de treino

- A mídia só aparece quando o exercício possui `mediaSrc`; os 15 exercícios locais legados não possuem mídia.
- Os 1.324 exercícios importados possuem arquivos GIF correspondentes, indicando problema de vínculo/canonicalização, não ausência geral de arquivos.
- Quando existe, a mídia fica sempre aberta; não há interação de expandir ou recolher.
- `SetTechnique` declara `superset`, `dropset`, `rest_pause` e `cluster`, mas a instanciação de templates força `straight` e `supersetGroup: null`.
- A biblioteca atual não usa o campo `technique`.
- O logger exibe somente uma tag de “Superset”; dropset, rest-pause e cluster não possuem representação de execução.
- Circuitos mostram apenas meta e rounds concluídos; não apresentam claramente membros, sequência, etapa atual ou timer.
- A página filtra e renderiza exercícios, atividades e circuitos em listas separadas, podendo perder a ordem mista definida no plano.

### 5.2 Progressão e indicadores

- O check-in produz avisos, mas não altera a prescrição.
- A sugestão de progressão precisa ser aplicada manualmente no logger.
- O `Strength Score` depende de IDs legados dos quatro levantamentos e pode não reconhecer os exercícios canônicos atuais.
- Dashboard e gráficos dependem de sessões concluídas e sincronizadas; falhas podem resultar em vazio ou loading sem recuperação clara.
- Os gráficos usam cores do design anterior e não explicam tendência, diferença ou qualidade do dado.

### 5.3 Medições

- A rota do personal inclui o aluno na URL, mas a camada de dados de medições consulta somente o usuário autenticado.
- O personal pode, portanto, ver as próprias medições em vez das medições do aluno selecionado.
- A edição existe; a exclusão remove o item da tela mesmo se a operação no banco falhar.
- O gráfico só aparece com dois pontos e não oferece resumo textual ou interpretação orientativa.
- Não há vínculo completo com anamnese, avaliação, método de composição corporal ou responsável pela coleta.

### 5.4 Fichas

- O personal escolhe um aluno para criar outra ficha, mas não consegue abrir, editar, versionar, inativar, excluir ou restaurar a ficha existente nesse contexto.
- A criação é composta por várias gravações e não é atômica.
- Planos são criados ativos; não há revisão segura de rascunho antes da publicação.
- Capacidades do domínio, como técnicas, deload e blocos mistos, não estão disponíveis no editor manual.

## 6. Arquitetura de experiência

### 6.1 Workspace do aluno para o personal

Cada aluno terá uma página única com abas ou seções responsivas:

- Resumo e exceções;
- Anamnese;
- Avaliações e medições;
- Ficha atual;
- Histórico de fichas;
- Progresso;
- Mensagens.

No desktop, o workspace usa navegação lateral ou tabs e permite comparação. No celular, usa resumo e ações progressivamente reveladas, preservando alvos de toque de no mínimo 44 px.

### 6.2 Ciclo de vida da ficha

Estados lógicos:

- `draft`: ainda não publicada;
- `active`: fonte dos próximos treinos;
- `inactive`: preservada no histórico e reativável;
- `deleted`: exclusão lógica, visível na lixeira do histórico e recuperável.

Regras:

- somente uma versão da mesma ficha pode estar ativa para um atleta por vez;
- ativar uma nova versão inativa a anterior sem apagar seus vínculos;
- editar uma ficha já utilizada cria nova versão;
- excluir usa `deleted_at` e `deleted_by`; restaurar recupera como inativa;
- exclusão física ocorre apenas por fluxo administrativo de retenção/privacidade, fora da operação cotidiana;
- cada mudança registra autor, data, motivo e diferenças relevantes.

### 6.3 Tela de treino mobile-first

- O exercício atual abre automaticamente.
- Exercícios futuros ficam compactos; tocar no cabeçalho expande mídia, instruções, meta e séries.
- A mídia do exercício seguinte é pré-carregada.
- GIFs e metadados necessários à sessão são armazenados para uso offline.
- O estado padrão mostra somente exercício atual, desempenho anterior, meta atual, carga, repetições, confirmação e descanso.
- Trocar, remover, notas, calculadora e explicação detalhada ficam em ações secundárias.
- Confirmar uma série preenchida exige um toque.
- O descanso começa conforme a unidade de execução: após a série simples ou após completar uma volta do grupo.

### 6.4 Técnicas e grupos

Técnica individual e agrupamento são conceitos separados.

**Técnicas individuais:** `straight`, `dropset`, `rest_pause`, `cluster`. Cada uma recebe tag visível, instrução curta e estrutura de segmentos compatível com o registro realizado.

**Grupos:** `bi_set`, `tri_set`, `superset`. O personal seleciona explicitamente o tipo; o sistema valida a quantidade de membros e não tenta inferir a intenção apenas pelo número de exercícios.

Exemplo visual:

```text
BI-SET
Supino inclinado + Supino reto
│
├─ Volta 1
│  ├─ Supino inclinado   8 reps · 10 kg  ✓
│  └─ Supino reto        8 reps · 10 kg  ✓
├─ Volta 2
│  ├─ Supino inclinado   8 reps · 10 kg
│  └─ Supino reto        8 reps · 10 kg
└─ Volta 3 …
```

O modelo de domínio deve representar:

- tipo do grupo;
- membros e ordem;
- número de voltas;
- descanso entre membros e após a volta;
- segmentos de dropset, rest-pause e cluster;
- valores prescritos e realizados por membro/segmento;
- retomada offline sem perder a etapa atual.

ADR-0001 e ADR-0002 permanecem válidas. A primeira correção renderiza `session.blocks` como uma única lista ordenada. Qualquer nova tabela de grupo ou segmento será complementar às tabelas irmãs existentes; uma migração para pai polimórfico exige ADR separado e evidência de que a colisão entre tipos se tornou problema real.

### 6.5 Dificuldade e dor

Uma ação rápida por exercício oferece:

- carga muito alta;
- execução difícil;
- dor ou desconforto;
- equipamento indisponível;
- não gostei do exercício;
- não entendi a execução;
- outro, com nota opcional.

O alerta inclui atleta, sessão, exercício, série, valores realizados, mídia, histórico recente, severidade e ações sugeridas. Dor tem comportamento prioritário; dificuldade comum não bloqueia a sessão.

### 6.6 Anamnese e avaliação

- O atleta preenche a anamnese antes do atendimento.
- O personal valida, corrige e registra restrições.
- Campos sensíveis exibem finalidade, consentimento e responsável pela coleta.
- Respostas são versionadas para preservar o contexto da prescrição.
- Avaliações registram método, data, avaliador e observações.
- IMC, relação cintura/altura, variação de peso e composição corporal são indicadores orientativos com limitações visíveis.
- Valores de risco não geram diagnóstico ou prescrição automática; produzem alerta e recomendação de avaliação profissional.

### 6.7 Progresso e medições

O progresso será organizado em três níveis:

1. **Agora:** desempenho anterior, meta e tendência do exercício atual.
2. **Ciclo:** adesão, volume, intensidade, evolução por exercício e cumprimento da ficha.
3. **Longo prazo:** medidas, composição corporal, metas e reavaliações.

Cada indicador deve mostrar definição, período, origem dos dados, variação e estado de insuficiência de dados. Identidades de exercícios canônicos substituem IDs legados hardcoded. O personal seleciona o aluno de forma explícita na camada de dados, com RLS e testes de autorização.

## 7. Fluxo de dados e automação

```text
Anamnese + avaliação + preferência de autonomia
                    │
                    v
        Modelo e limites do personal
                    │
                    v
       Prescrição versionada e publicada
                    │
                    v
   Sessão local preenchida + execução offline
                    │
                    v
 Sincronização idempotente + eventos de execução
                    │
          ┌─────────┴─────────┐
          v                   v
 Progressão explicada     Feed de exceções
          │                   │
          └─────────┬─────────┘
                    v
        Próxima prescrição/versionamento
```

A recomendação armazena `input_snapshot`, `rule_code`, `previous_value`, `suggested_value`, `autonomy_mode`, `decision`, `decided_by` e timestamps. Mudanças automáticas permanecem dentro dos limites publicados. O personal recebe somente exceções, mudanças fora do limite e eventos de segurança.

## 8. Erros, segurança e privacidade

- Toda tela assíncrona possui estados de carregamento, vazio, erro e retry.
- A interface nunca remove uma entidade localmente antes de confirmar ou enfileirar uma operação recuperável.
- Sincronização usa IDs estáveis e upsert idempotente, com fila, idade da pendência e ação de retry.
- Tabelas expostas mantêm RLS; políticas diferenciam atleta, personal vinculado e administrador.
- Dados de saúde não usam `user_metadata` como autorização.
- Views analíticas usam comportamento compatível com RLS e são verificadas antes do deploy.
- Dor, anamnese e avaliação possuem trilha de auditoria.
- Exclusão lógica e restauração não substituem o fluxo legal de eliminação definitiva de dados.
- Textos deixam claro quando um valor é estimativa, classificação ou recomendação.

## 9. Método da auditoria e uso dos repositórios

### 9.1 Ordem de aplicação

1. **Karpathy skills:** explicitar hipóteses, evidências e critérios de verificação.
2. **Matt Pocock skills:** alinhar domínio, ADRs, issues e decomposição em tickets.
3. **Behavioral Design:** mapear comportamentos-alvo, barreiras, hipótese e ética.
4. **Impeccable:** crítica e auditoria de UI, acessibilidade, responsividade, conteúdo, estados e performance.
5. **Refactoring UI skill:** detalhar hierarquia, tipografia, espaçamento, cor e profundidade nas correções aprovadas.
6. **Ponytail:** reduzir complexidade e dependências durante a remediação, sem remover acessibilidade, erro ou segurança.
7. **Superpowers:** brainstorming, planos, TDD, revisão e verificação antes da conclusão.

Os repositórios com licença ou proveniência inconsistente serão usados como referência de leitura até revisão explícita; hooks e instaladores não serão executados cegamente.

### 9.2 Benchmark visual

Comparar tarefas equivalentes, e não apenas screenshots isolados, em produtos consolidados de treino autônomo e acompanhamento profissional. A lista inicial inclui Hevy, Fitbod, Nike Run Club, Befit e ferramentas de personal a validar durante a pesquisa. Para cada fluxo:

- registrar dispositivo, viewport, data e fonte;
- capturar estado inicial, interação principal, erro, vazio e conclusão;
- contar toques, digitações, mudanças de contexto e tempo;
- extrair princípios sem copiar identidade ou composição proprietária;
- comparar com o mesmo roteiro executado no bstrainer.

## 10. Arquitetura de agentes

O modelo atual atua como orquestrador e recebe somente resultados finais. Subagentes não precisam expor raciocínio intermediário ao orquestrador.

Frentes especializadas:

1. jornada do atleta e logger;
2. workspace do personal e ciclo de vida da ficha;
3. anamnese, avaliação, medições e privacidade;
4. motor, progressão e técnicas;
5. UI visual, acessibilidade e responsividade;
6. dados, Supabase, RLS, offline e performance;
7. benchmark e teste ao vivo;
8. revisão de especificação, código e critérios de aceite.

Agentes mais leves fazem inventário, matrizes, screenshots e verificações determinísticas. Agentes de maior capacidade tratam domínio, migrações, automação, segurança e integração. Cada tarefa define escopo de arquivos, proíbe alterações fora dele e exige uma síntese final com evidência.

Como há quatro slots de concorrência, as frentes serão executadas em ondas. Agentes que editam arquivos não atuarão simultaneamente sobre a mesma área.

## 11. Critérios de aceite

### 11.1 Atleta

- pelo menos 90% das séries prescritas podem ser confirmadas sem abrir o teclado;
- uma série pré-preenchida exige um toque para confirmação;
- iniciar o treino recomendado e chegar à primeira série exige no máximo duas ações após o check-in;
- mídia e instruções abrem ao tocar e o exercício seguinte é pré-carregado;
- sessão completa funciona offline e sincroniza sem duplicação;
- bi-set, tri-set, superset, dropset, rest-pause, cluster, circuito e atividade possuem representação inequívoca;
- dificuldade e dor produzem comportamentos distintos e verificáveis.

### 11.2 Personal

- o workspace de um aluno reúne anamnese, avaliação, ficha, histórico, progresso e mensagens;
- ficha pode ser criada, revisada, publicada, inativada, excluída logicamente, restaurada e versionada;
- nenhuma ficha parcialmente gravada aparece como ativa;
- o feed mostra somente exceções reais, sem conteúdo simulado;
- cada recomendação apresenta regra, evidência e ação disponível.

### 11.3 Qualidade

- fluxos críticos funcionam em 320, 360, 390, 768, 1024 e 1440 px;
- zoom de texto a 200% não esconde ações essenciais;
- controles de toque têm pelo menos 44 px;
- teclado, leitor de tela, foco, modais e anúncios de estado são testados;
- carregamentos críticos exibem erro e retry em vez de skeleton infinito;
- listas e dashboards são testados com 100 alunos e 12 meses de histórico;
- build, typecheck, testes unitários, integração, E2E, acessibilidade e regressão visual passam antes do deploy.

## 12. Estratégia de entrega

O programa será dividido em planos independentes e implantáveis:

1. **Confiabilidade imediata:** erros/retry, remoção de alertas simulados, correção de medições por aluno e integridade da criação de ficha.
2. **Logger essencial:** mídia expansível, canonicalização de exercícios, ordem única de blocos, pré-preenchimento e confirmação em um toque.
3. **Técnicas e grupos:** modelo, persistência e UI de bi-set, tri-set, superset, dropset, rest-pause e cluster.
4. **Ciclo de vida da ficha:** workspace do aluno, draft, active, inactive, deleted, restauração e versionamento.
5. **Progressão supervisionada:** autonomia, limites, aplicação automática, explicações e trilha de decisão.
6. **Progresso e medições:** indicadores canônicos, gráficos, tendências e composição corporal.
7. **Anamnese e avaliação:** formulários, validação, consentimento, indicadores orientativos e reavaliação.
8. **Polimento transversal:** acessibilidade, performance, responsividade, offline, textos e estados.

Cada plano começa com teste que demonstra a lacuna, produz uma entrega verificável e termina com revisão. Deploys serão incrementais; a tela de treino e a integridade de dados não aguardam a conclusão de todas as frentes.

## 13. Gate de deploy

Antes de cada publicação:

1. revisar diff e migrações;
2. executar testes específicos e suíte completa proporcional ao risco;
3. verificar RLS e advisors quando houver mudança no Supabase;
4. testar atleta e personal com dados semeados;
5. testar offline, reconexão e idempotência quando o logger mudar;
6. comparar screenshots nos viewports-alvo;
7. registrar rollback e versão anterior;
8. publicar primeiro em preview/staging quando disponível;
9. executar smoke test pós-deploy;
10. só então promover para produção.

## 14. Fora do escopo inicial

- diagnóstico médico;
- decisão automática fora dos limites publicados pelo personal;
- integração com wearables antes da confiabilidade do logger;
- gamificação social ampla;
- reescrita total do banco sem evidência;
- substituição da identidade visual por cópia de concorrente;
- expansão de “IA” que não seja explicável e auditável.

