# Plano de desenvolvimento do redesign total do bstrainer

Data: 30/07/2026  
Status: direção de produto e execução  
Escopo: experiência, interface, domínio, arquitetura e workflow autônomo

## 1. Decisão central

O bstrainer deve deixar de ser percebido como um sistema de fichas e templates. O novo produto será um aplicativo de acompanhamento contínuo do treino.

O atleta abre o app e encontra o que precisa fazer agora. O sistema recupera o histórico, preenche os valores prováveis, sugere progressão, controla o descanso, funciona sem internet e registra o treino com o mínimo de toque possível.

O treinador não deve gastar o dia preenchendo campos ou revisando aluno por aluno. Ele recebe uma visão de aderência, evolução e exceções: quem faltou, quem estagnou, quem relatou dor, quem excedeu esforço e quais prescrições pedem revisão.

Os templates continuam no sistema, mas mudam de função. Eles serão pontos de partida internos para criar programas. Não serão mais a principal forma de o usuário entender o produto.

## 2. Diagnóstico do produto atual

### 2.1 O que deve ser preservado

1. Separação entre treino prescrito e treino executado.
2. Estrutura de plano, mesociclo, sessão, exercício e série.
3. Catálogo próprio de exercícios, mídia e substituições.
4. Registro de séries em tabela, histórico por série e detecção de recorde.
5. Timer, calculadora de anilhas, RPE ou PSE, aquecimento e técnicas de treino.
6. Sessão livre e sessões originadas de uma prescrição.
7. Fila de sincronização offline e PWA já iniciada.
8. Biblioteca de programas e regras determinísticas do motor.
9. Pacotes de domínio e motor separados da interface.
10. Relação entre treinador e atleta, convites e mensagens.

### 2.2 O que está dificultando o uso

1. O produto começa pela estrutura interna, principalmente ficha e template, em vez de começar pela tarefa da pessoa.
2. A tela de planos oferece "usar template" ou "criar manual". As duas opções exigem que o usuário entenda o modelo antes de receber valor.
3. A recomendação atual escolhe um template somente para quem ainda não possui plano. Ela não acompanha a execução nem adapta o programa.
4. O atleta ainda decide e digita informação demais durante o treino. O sistema registra, mas antecipa pouco.
5. O treinador usa telas estreitas, pensadas para celular, mesmo quando a tarefa exige comparar alunos, semanas e exercícios.
6. A navegação tenta atender treinador e atleta na mesma estrutura.
7. As três engines fazem sentido como estratégia comercial, mas aparecem cedo demais na concepção do produto.
8. O offline mistura estado de sessão e fila de sincronização. A dependência `idb` já existe, mas o fluxo principal ainda precisa de uma fonte local consistente.
9. Existem bons recursos isolados, porém falta um ciclo único entre prescrição, execução, leitura dos dados e ajuste.
10. A direção visual está documentada, mas a mesma largura e densidade são usadas em contextos muito diferentes.

### 2.3 Causa estrutural

O problema não é apenas visual. A interface está refletindo um modelo centrado em cadastro.

```text
Hoje
template ou ficha -> preenchimento -> execução -> histórico

Proposta
objetivo + contexto + histórico -> próximo treino -> execução assistida
-> leitura automática -> ajuste sugerido -> próximo treino
```

## 3. Posicionamento do novo produto

### 3.1 Promessa para o atleta

"Abra, treine e registre. O bstrainer prepara o próximo passo e aprende com o que você realizou."

### 3.2 Promessa para o treinador

"Prescreva com rapidez, acompanhe por exceção e ajuste com base no que o atleta realmente fez."

### 3.3 Tese

O diferencial não será reunir todas as funções dos concorrentes. Isso produziria um app inchado. A proposta é combinar:

1. Registro de treino rápido e confiável.
2. Programação profissional com visão de mesociclo.
3. Adaptação explicável, baseada em dados e sujeita à decisão do treinador.

### 3.4 Referências e o que aproveitar

1. Hevy: logger, histórico anterior, rotinas, RPE, descanso, feed e relação treinador-atleta. A plataforma do treinador também confirma a utilidade de progressão determinística e acompanhamento remoto. Fontes: [Hevy Trainer Platform](https://www.hevyapp.com/features/trainer-platform/) e [Hevy Workout Plan Generator](https://www.hevyapp.com/features/workout-plan-generator/).
2. Fitbod: sugestão adaptativa por objetivo, histórico, recuperação, equipamento, tempo e feedback. Também é referência para funcionamento offline. Fontes: [Fitbod Algorithm](https://fitbod.me/blog/fitbod-algorithm/) e [Fitbod offline](https://help.fitbod.me/hc/en-us/articles/360006572594-Can-I-use-Fitbod-without-an-internet-connection).
3. Nike Run Club: condução durante a sessão, áudio, métricas em tempo real, planos, desafios e integração com dispositivos. Fonte: [Nike Run Club new features](https://about.nike.com/en/newsroom/releases/nike-run-club-app-new-features).
4. BeFit: onboarding orientado ao primeiro plano, usando objetivo, experiência, tempo, frequência e equipamento. O funcionamento do algoritmo é menos transparente, portanto será referência de fluxo, não de decisão técnica. Fontes: [BeFit AI Personalized Plan](https://appbefit.com/ai-personalized-plan/) e [BeFit Terms](https://appbefit.com/terms/).
5. O bstrainer não copiará identidade, texto, layout ou navegação. A pesquisa completa, com 29 fontes oficiais e separação entre fatos e inferências, está em [benchmark dos aplicativos](../../research/2026-07-30-benchmark-hevy-befit-nrc-fitbod.md).
6. Corrida por GPS não entra no núcleo desta reformulação. Do Nike Run Club serão aproveitados condução, feedback e retenção. Corrida estruturada fica registrada como trilha futura.

## 4. Princípios obrigatórios

1. Sessão primeiro. A tela inicial responde "qual é meu próximo treino?".
2. Digitação é exceção. Carga, repetições, descanso e exercício vêm preenchidos quando houver base segura.
3. Um toque conclui a ação mais comum.
4. O app funciona com uma mão, pressa, suor, ruído e internet instável.
5. O sistema sugere e explica. O atleta ou o treinador confirma.
6. O treinador trabalha por exceção.
7. Planejado e executado continuam separados.
8. A complexidade técnica fica atrás de interfaces pequenas.
9. Toda automação mostra sua origem: prescrição, última sessão, regra ou ajuste do treinador.
10. Uma função nova só entra se melhorar o ciclo "preparar, treinar, registrar, aprender e ajustar".

## 5. Nova arquitetura de experiência

### 5.1 Um produto, dois espaços de trabalho

O domínio continua compartilhado. A navegação e a densidade visual serão diferentes.

Atleta, mobile-first:

1. Hoje
2. Treinar
3. Progresso
4. Coach
5. Perfil

Treinador, desktop e tablet primeiro:

1. Visão geral
2. Atletas
3. Programação
4. Caixa de entrada
5. Biblioteca
6. Configurações

No celular, o treinador recebe acompanhamento e resposta rápida. A montagem detalhada de programas prioriza telas maiores.

### 5.2 Tela Hoje

1. Próximo treino, duração provável e estágio do programa.
2. Botão "Começar treino" ou "Continuar treino".
3. Check-in curto de energia, dor e tempo disponível.
4. Ajustes propostos, sempre explicados.
5. Meta e aderência da semana.
6. Último avanço relevante.
7. Estado offline ou sincronização pendente somente quando necessário.

### 5.3 Sessão ativa

1. Iniciar com um toque.
2. Abrir no primeiro exercício com valores preparados.
3. Confirmar uma série com um toque.
4. Iniciar o descanso automaticamente.
5. Corrigir sem modal.
6. Mostrar técnica e mídia sob demanda.
7. Oferecer substitutos compatíveis com equipamento, restrição e padrão de movimento.
8. Exibir recorde no momento em que ocorre.
9. Salvar localmente a cada ação.
10. Retomar após fechar, perder sinal ou recarregar.
11. Finalizar com esforço percebido e nota opcional.
12. Mostrar resumo curto e qualquer sugestão que exija confirmação.

### 5.4 Programação do treinador

1. Criar programa por objetivo, estrutura anterior ou biblioteca.
2. Editar semana, sessão, exercício ou série sem reconstruir o plano.
3. Arrastar e duplicar blocos no desktop, com alternativa completa por teclado.
4. Prescrever por faixa de repetições, RIR ou RPE, porcentagem, carga absoluta ou peso corporal.
5. Aplicar progressão a um conjunto de séries.
6. Copiar estruturas para vários atletas e manter exceções individuais.
7. Visualizar volume, frequência, padrão de movimento e conflitos enquanto edita.
8. Publicar uma nova versão sem alterar o histórico.
9. Programar ativação.
10. Revisar o que mudou antes de enviar.

### 5.5 Acompanhamento por exceção

A tela inicial do treinador ordena ações. Exemplos:

1. Atleta não treinou no período esperado.
2. Esforço acima do alvo em duas sessões.
3. Queda persistente de desempenho.
4. Dor ou restrição relatada.
5. Sessão abandonada.
6. Programa próximo do fim.
7. Progressão aguardando revisão.
8. Mensagem sem resposta.

Cada alerta mostra motivo, dados usados, ação recomendada e opção de ignorar com justificativa.

## 6. Redesign do sistema

### 6.1 Módulo de sessão

Criar um módulo profundo que concentre a execução. Sua interface externa permite iniciar, retomar, registrar série, editar, substituir exercício, pausar, finalizar e sincronizar.

O módulo esconde preenchimento pelo histórico, relação com a prescrição, estado local, idempotência, timer, recordes, sugestões e recuperação após falha.

O hook atual e as funções puras existentes serão aproveitados. Não será criado um segundo fluxo paralelo.

### 6.2 Programa vivo

O conceito visível passa de "template" para "programa".

1. Template: estrutura reutilizável para iniciar um programa.
2. Programa: prescrição ativa de uma pessoa, com período, objetivo e regras.
3. Sessão planejada: treino previsto dentro do programa.
4. Sessão realizada: o que ocorreu.
5. Ajuste proposto: mudança calculada, ainda não aplicada.
6. Ajuste aprovado: mudança incorporada a uma nova versão.

Os termos precisam ser confirmados e registrados no glossário de domínio.

### 6.3 Motor adaptativo

A primeira versão será determinística. Não precisa de LLM.

Entradas:

1. Prescrição.
2. Sessões comparáveis.
3. RPE ou RIR.
4. Repetições e carga.
5. Aderência.
6. Energia, dor e tempo.
7. Equipamento.
8. Restrições.

Saídas:

1. Repetir ou aumentar carga.
2. Alterar repetições dentro da faixa.
3. Reduzir carga ou volume.
4. Sugerir substituição.
5. Sugerir deload.
6. Encaminhar para revisão.

Cada sugestão grava dados usados, regra, decisão e responsável. Sem histórico, o sistema inicia um período de familiarização e não finge personalização.

### 6.4 IA

A IA entra depois que o fluxo determinístico estiver estável.

Usos adequados:

1. Resumir a semana.
2. Explicar uma sugestão.
3. Converter a intenção do treinador em rascunho estruturado.
4. Localizar atletas por critérios calculados.
5. Preparar mensagens e relatórios para revisão.

Usos rejeitados na primeira etapa:

1. Alterar programa sem confirmação.
2. Criar exercício fora do catálogo.
3. Inventar progressão sem regra verificável.
4. Usar texto livre como única base de decisão.
5. Substituir regras de segurança ou revisão profissional.

### 6.5 Offline e sincronização

O pacote `idb` já instalado será usado como armazenamento local principal.

1. Persistir cada alteração relevante.
2. Usar IDs estáveis e operações idempotentes.
3. Mostrar "salvo no aparelho", "sincronizando" e "sincronizado".
4. Manter um dispositivo escritor por sessão na primeira versão.
5. Definir limpeza de sessões antigas e dados auxiliares.
6. Manter a sessão utilizável sem carregar todo o histórico.

Não será criado um sistema genérico de eventos. A fila local registrará somente o necessário para recuperar e sincronizar a sessão.

### 6.6 Dados e banco

1. Preservar prescrito e realizado em entidades separadas.
2. Versionar programa publicado.
3. Adicionar ajuste proposto e decisão.
4. Registrar check-in e motivo de substituição.
5. Garantir RLS para atleta, treinador vinculado e organização.
6. Fazer migrações aditivas antes de remover fluxos antigos.
7. Medir uso sem armazenar conteúdo sensível desnecessário.
8. Definir retenção e exclusão conforme LGPD.

## 7. Direção visual

### 7.1 Preservar

1. Verde-petróleo sobre creme.
2. Cor de destaque restrita.
3. Dourado somente para recordes.
4. Hierarquia numérica forte.
5. Bordas e superfícies simples.
6. Identidade própria.

### 7.2 Mudar

1. A tipografia display sai de controles e textos operacionais. Números continuam fortes.
2. O modo de treino ganha densidade e contraste próprios.
3. O workspace do treinador usa largura real de desktop.
4. A navegação passa a respeitar o papel.
5. Ícones usam um conjunto SVG consistente, com rótulo acessível.
6. Toque, foco, carregamento, vazio, erro, offline e sync viram estados padronizados.
7. Movimento curto e funcional em confirmação, descanso, recorde e transição.

### 7.3 Ergonomia

1. Alvos de toque com pelo menos 44 por 44 pixels.
2. Oito pixels entre ações adjacentes.
3. Entrada numérica adequada ao campo.
4. Ação principal acessível ao polegar.
5. Nada importante depende de hover.
6. Valores essenciais aparecem sem tooltip.
7. Cor nunca é o único indicador.
8. Foco de teclado visível.
9. Suporte a redução de movimento.
10. Verificação em 375, 768, 1024 e 1440 pixels.

### 7.4 Design system

1. Tokens semânticos de cor, tipografia, espaçamento, borda e movimento.
2. Modos de densidade para treino e workspace.
3. Componentes de ação, entrada, tabela de série, painel, alerta e gráfico.
4. Padrões de estado assíncrono e offline.
5. Regras de composição por tela.
6. Checklist de acessibilidade.

A direção atual será auditada e evoluída, não descartada automaticamente.

## 8. Métricas

As metas serão ajustadas depois da linha de base.

### 8.1 Atleta

1. Iniciar ou retomar em até dois toques.
2. Registrar série comum em até três segundos.
3. Ter 80% dos campos comuns preenchidos quando houver histórico.
4. Recuperar 100% das sessões interrompidas nos testes.
5. Sincronizar sem duplicação.
6. Concluir o primeiro treino sem entender templates ou engines.
7. Superar 90% de sucesso nas tarefas críticas.

### 8.2 Treinador

1. Identificar quem exige atenção em menos de dois minutos.
2. Criar e atribuir quatro semanas em até dez minutos usando uma base.
3. Ajustar uma semana sem recriar o programa.
4. Aplicar mudança em lote sem perder exceções.
5. Entender a origem de uma progressão.

### 8.3 Engenharia

1. Zero perda de série em testes offline.
2. Zero duplicação em reenvio.
3. Fluxos críticos automatizados.
4. WCAG AA e navegação por teclado.
5. Bundle mantido ou reduzido.
6. Toda migração com teste de política e caminho de reversão.

## 9. Fases de entrega

Cada fase termina com algo utilizável.

### Fase 0. Linha de base

1. Medir fluxos atuais.
2. Testar com cinco atletas e três treinadores.
3. Mapear jornada atual e proposta.
4. Confirmar glossário.
5. Definir eventos e métricas.
6. Prototipar Hoje, sessão ativa e visão geral do treinador.

Saída: tarefas, vocabulário e direção aprovados.

### Fase 1. Fundamentos

1. Nova navegação por papel.
2. Design system consolidado.
3. Shell do atleta.
4. Shell desktop e tablet do treinador.
5. Estados padrão.
6. Compatibilidade temporária com rotas atuais.

Saída: navegação nova usando os dados existentes.

### Fase 2. Sessão do atleta

1. Módulo único de sessão.
2. Tela Hoje.
3. Início e retomada rápidos.
4. Valores sugeridos e edição direta.
5. Timer e substituição contextual.
6. Persistência em IndexedDB.
7. Sync idempotente.
8. Resumo curto.

Saída: completar offline e sincronizar sem perda ou duplicação.

### Fase 3. Programa vivo

1. Programa como conceito principal.
2. Template como origem opcional.
3. Versões publicadas.
4. Motor determinístico.
5. Familiarização.
6. Ajustes propostos e aprovados.
7. Explicação de sugestões.

Saída: preparar o próximo treino com prescrição e histórico.

### Fase 4. Workspace do treinador

1. Visão por exceção.
2. Lista de atletas.
3. Perfil consolidado.
4. Construtor desktop e tablet.
5. Duplicação, lote e exceções.
6. Revisão e publicação.
7. Caixa de entrada integrada.

Saída: administrar a semana sem abrir cada atleta para procurar problemas.

### Fase 5. Progresso e retenção

1. Evolução por exercício.
2. Volume, frequência e aderência.
3. Progresso do mesociclo.
4. Recordes e marcos.
5. Resumo semanal.
6. Streak semanal, sem punir descanso.

Saída: entender o que mudou e o próximo passo.

### Fase 6. Qualidade de app

1. PWA e atualização segura.
2. Push relevante.
3. Cache e carregamento.
4. Observabilidade de falhas.
5. Auditoria de acessibilidade.
6. Testes em aparelhos reais.
7. Avaliação dos limites da PWA.

Saída: um limite concreto precisa existir antes de assumir Android e iOS nativos.

### Fase 7. IA e integrações

1. Resumos.
2. Rascunho de programa.
3. Explicações personalizadas.
4. Busca em linguagem natural.
5. Integrações com sono, frequência cardíaca ou corrida.

Entrada: regras estáveis, dados suficientes, custo conhecido e revisão clara.

## 10. Sequência de commits

1. Registrar métricas atuais.
2. Proteger o fluxo de sessão com testes de contrato.
3. Consolidar termos de domínio.
4. Criar tokens e estados do design system.
5. Separar navegação por papel.
6. Criar shell responsivo do treinador.
7. Criar a tela Hoje.
8. Extrair a interface pública da sessão.
9. Persistir em IndexedDB.
10. Tornar sync idempotente.
11. Recuperar sessão interrompida.
12. Preencher séries por prescrição e histórico.
13. Integrar confirmação, timer e feedback tátil.
14. Adicionar substituição contextual.
15. Simplificar o resumo.
16. Versionar programa publicado.
17. Reposicionar templates.
18. Criar regras puras de progressão.
19. Registrar ajuste e decisão.
20. Exibir explicação.
21. Criar visão geral do treinador.
22. Adicionar aderência e alertas.
23. Criar perfil consolidado.
24. Evoluir o construtor.
25. Adicionar lote e exceções.
26. Integrar revisão e publicação.
27. Consolidar progresso.
28. Adicionar resumo semanal e marcos.
29. Fechar PWA, acessibilidade e performance.
30. Remover conceitos antigos somente após migração e medição.

## 11. Workflow autônomo obrigatório

Este é o padrão para qualquer plano de desenvolvimento futuro do bstrainer.

### 11.1 Entrada

1. Ler `AGENTS.md`, `CONTEXT-MAP.md`, o `CONTEXT.md` afetado e o handoff mais recente.
2. Verificar Git, alterações locais, issues e PRs.
3. Observar o fluxo antes de planejar.
4. Definir resultado, métrica, aceite e fora de escopo.
5. Nomear as skills adequadas no plano.

### 11.2 Pesquisa e design

1. Usar fontes primárias.
2. Comparar soluções em decisões difíceis de reverter.
3. Prototipar quando houver incerteza de interação.
4. Atualizar o glossário após confirmação.
5. Criar ADR somente para decisão difícil de reverter, surpreendente e com troca real.

### 11.3 Execução

1. Uma issue por fatia vertical.
2. Branch com prefixo `codex/`.
3. Commits pequenos e funcionais.
4. Reutilizar módulos, recursos nativos e dependências instaladas.
5. Escrever o menor teste que proteja lógica não trivial.
6. Uma mudança conceitual por commit.
7. Não misturar redesign, migração e limpeza ampla.

### 11.4 Verificação

1. Teste focado durante o desenvolvimento.
2. Typecheck, testes e build antes do PR.
3. RLS e migração quando houver banco.
4. Fluxo crítico no navegador.
5. Capturas em 375, 768, 1024 e 1440 pixels.
6. Offline, recarregamento e reenvio para sessão.
7. Revisão de comportamento, segurança e complexidade.

### 11.5 Entrega

1. PR com problema, solução, aceite, testes, imagens e risco.
2. Rótulos de triagem.
3. CI e revisão antes de liberar.
4. Medir depois da entrega.
5. Registrar decisão, pendência, ideia frágil e próximo passo no handoff.
6. Atualizar o plano quando a evidência mudar a prioridade.

### 11.6 Pontos de parada

O agente pode pesquisar, planejar, implementar, testar, corrigir e preparar PR sem interromper o usuário.

Deve pedir decisão em:

1. Mudança de posicionamento.
2. Alteração difícil de reverter no domínio.
3. Migração destrutiva.
4. Direções visuais realmente diferentes.
5. Custo externo recorrente.
6. Uso novo de dados sensíveis.
7. Publicação em produção ou comunicação externa.

## 12. Skills por etapa

| Skill | Uso |
|---|---|
| `research` | Concorrentes, normas e fontes primárias |
| `ui-ux-pro-max` | Ergonomia, responsividade, acessibilidade e gráficos |
| `design-an-interface` | Alternativas de interface para os fluxos críticos |
| `prototype` | Testar interação antes de mudanças caras |
| `domain-modeling` | Glossário de programa, sessão, ajuste e decisão |
| `codebase-design` | Módulos profundos de sessão, programa e sync |
| `request-refactor-plan` | Decompor fases em commits pequenos |
| `tdd` | Motor adaptativo, sessão, sync e regras |
| `supabase:supabase` | Migrações, Auth, RLS e Realtime |
| `supabase-postgres-best-practices` | Índices, consultas e políticas |
| `database-schema-designer` | Programa versionado e decisões |
| `browser:control-in-app-browser` | Fluxos e responsividade |
| `diagnosing-bugs` | Falhas difíceis de sessão e sync |
| `code-review` | Revisão antes do merge |
| `ponytail` | Controle de escopo |
| `humanizer` | Interface, documentação e mensagens |
| `context-mode` | Análise eficiente do repositório |
| `github:github` | Issues, triagem e PRs |

Nem todas precisam rodar em toda tarefa. O plano nomeia apenas as que correspondem ao risco.

## 13. Riscos

1. Colagem de concorrentes. Converter referências em princípios e métricas.
2. Escopo amplo. Entregar uma fatia por vez, começando por Hoje e sessão.
3. IA precoce. Usar regras explicáveis antes de LLM.
4. Duas personas na mesma navegação. Separar espaços de trabalho.
5. Dados insuficientes. Usar familiarização e indicar incerteza.
6. Perda offline. Persistir a cada ação e testar falhas.
7. Conflito de sync. Escritor único e idempotência na primeira versão.
8. Sobrecarga do treinador. Alertas acionáveis e revisão em lote.
9. Dashboard cheio. Mostrar decisão e tendência, com detalhes sob demanda.
10. Reescrita total. Migrar progressivamente.
11. Falsa precisão fisiológica. Mostrar estimativa e origem.
12. LGPD. Acesso mínimo, auditoria, retenção e exclusão.

## 14. Fora da primeira entrega

1. Marketplace.
2. Nutrição.
3. Feed social completo.
4. Corrida com GPS.
5. Wearables.
6. App nativo independente.
7. Geração autônoma por LLM.
8. Billing novo.
9. Gestão financeira.
10. Gamificação com moedas ou loja.

Essas ideias ficam registradas e podem voltar com evidência.

## 15. Melhorias futuras

### Atleta

1. Treino guiado em áudio.
2. Modo tela bloqueada.
3. Controle por relógio.
4. Compartilhamento de recordes.
5. Mobilidade e recuperação.

### Treinador

1. Modelos próprios versionados.
2. Regras personalizadas de alerta.
3. Relatórios programados.
4. Aprovação de mudanças pelo atleta.
5. Grupos e equipes.

### Inteligência

1. Estagnação por exercício.
2. Deload com revisão.
3. Plano pelo tempo disponível.
4. Simulação de volume.
5. Resumo de risco e aderência.

### Plataforma

1. API de integrações.
2. Importação de outros apps.
3. Exportação completa.
4. Relógios e sensores.
5. Casca nativa após limite comprovado.

## 16. Próxima ação

Executar uma Fase 0 curta e produzir três protótipos testáveis:

1. Tela Hoje.
2. Sessão ativa com preenchimento automático.
3. Visão geral do treinador por exceção.

Depois dos testes, transformar as Fases 1 e 2 em issues pequenas. O sistema atual permanece funcional durante a transição.
