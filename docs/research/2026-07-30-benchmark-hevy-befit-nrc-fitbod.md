# Benchmark funcional para o redesign do bstrainer

Data da pesquisa: 30/07/2026

Apps analisados: Hevy, Befit da 3APPS, Nike Run Club e Fitbod.

## Escopo e método

Esta pesquisa usa fontes primárias: páginas oficiais dos produtos, centrais de ajuda e páginas publicadas pelos próprios desenvolvedores nas lojas. Os textos comerciais descrevem o que cada empresa afirma entregar. Eles não comprovam, por si só, a qualidade do algoritmo ou o resultado do treino.

Os achados aparecem em duas categorias:

1. **Fato documentado:** recurso descrito por uma fonte oficial.
2. **Inferência para o bstrainer:** decisão de produto derivada da comparação. Não é uma afirmação sobre o concorrente.

Não foram usados layouts, ilustrações, textos, nomes de recursos ou identidades visuais como material para reprodução. A referência válida está nos problemas resolvidos e nos princípios de interação.

## Leitura rápida

| Aplicativo | Melhor referência | Limite para o bstrainer |
|---|---|---|
| Hevy | Registro rápido de musculação e continuidade entre treino prescrito e treino executado | A experiência principal ainda exige que o usuário decida ou receba a estrutura do treino |
| Befit | Onboarding orientado a objetivo e plano inicial gerado com pouca configuração técnica | A comunicação oficial explica pouco como a recomendação chega a cada ajuste |
| Nike Run Club | Orientação durante a sessão, motivação contextual e retenção sem interromper o treino | O modelo foi feito para corrida e não cobre a relação operacional entre personal e aluno |
| Fitbod | Recomendação adaptativa, recuperação muscular, preferência de equipamento e operação offline | O produto prioriza treino autônomo e não oferece, nas fontes consultadas, um fluxo equivalente ao Hevy Coach |

## 1. Hevy

### Fatos documentados

1. **Criação e execução de treino.** O Hevy separa rotina, que é o plano salvo, de workout, que é a sessão em execução. O usuário pode iniciar uma rotina, começar um treino vazio ou usar um atalho. Durante o treino, registra séries, repetições e carga, consulta o desempenho anterior e usa temporizador de descanso, RPE, superséries e tipos de série como aquecimento, drop set e falha. A biblioteca oficial também permite salvar programas e filtrar por nível, objetivo e equipamento. Fontes: [guia de recursos do Hevy](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2025-Features-Guide), [workouts e rotinas](https://help.hevyapp.com/hc/en-us/articles/33703513582871-Workouts-vs-Routines-in-Hevy-What-They-Mean-and-How-to-Use-Them) e [biblioteca de programas](https://help.hevyapp.com/hc/en-us/articles/36011518408983-How-to-Access-and-Use-Hevy-s-Routine-and-Program-Library).

2. **Onboarding e progressão automática.** O Hevy Trainer pergunta objetivo, experiência, dados corporais, equipamento, frequência, duração e grupo muscular prioritário. Ele gera o programa com um algoritmo que a empresa distingue de IA generativa. A carga aumenta quando o atleta atinge o limite superior da faixa de repetições em todas as séries prescritas. O usuário ainda pode trocar exercícios, incluir ou retirar séries e ajustar intervalos. Fontes: [explicação do Hevy Trainer](https://help.hevyapp.com/hc/en-us/articles/38385724273047-Hevy-Trainer-Explained-How-It-Builds-Your-Workout-Program) e [Hevy Trainer](https://www.hevyapp.com/features/workout-plan-generator/).

3. **Relação treinador e atleta.** O Hevy Coach permite criar e atribuir planos, acompanhar atividade e desempenho, conversar com clientes e receber os dados registrados pelo atleta. Alterações feitas pelo treinador aparecem no plano do cliente. O painel pode notificar o treinador quando o aluno conclui uma sessão ou registra uma medida. O treinador também pode registrar a sessão pelo aluno durante atendimento presencial. Fonte: [Hevy App e Hevy Coach](https://www.hevyapp.com/features/trainer-platform/).

4. **Métricas e feedback.** O produto documenta recordes pessoais, 1RM estimada, volume por sessão, séries por grupo muscular, frequência, consistência, medidas corporais, fotos de progresso e notificações de recorde durante o treino. O valor anterior fica visível para orientar a próxima série. Fonte: [guia de recursos do Hevy](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2025-Features-Guide).

5. **Integrações e retenção.** O Hevy funciona em celular, web, Apple Watch e Wear OS, sincroniza com Strava, Apple Health e Health Connect e mantém feed social, seguidores, curtidas, comentários, calendário de consistência, sequência semanal e retrospectiva anual. Fontes: [guia de recursos](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2025-Features-Guide), [integrações de saúde](https://help.hevyapp.com/hc/en-us/articles/34462684813079) e [plataforma para treinadores](https://www.hevyapp.com/features/trainer-platform/).

6. **Offline.** O site oficial informa que Apple Watch e Wear OS conseguem registrar o treino offline e sincronizar as rotinas. Não foi localizada uma especificação equivalente sobre todo o fluxo offline no telefone. Fonte: [site oficial do Hevy](https://www.hevyapp.com/).

7. **Monetização.** O logger adota freemium. Na consulta de 30/07/2026, o Hevy Trainer estava incluído no Pro, anunciado por US$ 2,99 ao mês, US$ 23,99 ao ano ou US$ 74,99 em licença vitalícia. O Hevy Coach tem assinatura própria, teste de 30 dias e concede Pro ao cliente enquanto ele estiver vinculado ao treinador. Valores podem variar por país e canal. Fontes: [Hevy Trainer](https://www.hevyapp.com/features/workout-plan-generator/) e [Hevy Coach](https://www.hevyapp.com/features/trainer-platform/).

### Inferências para o bstrainer

1. O logger deve ser a tela mais rápida do produto. Série anterior, carga, repetições, esforço e confirmação precisam caber no mesmo contexto, sem abrir uma sequência de formulários.
2. O plano prescrito e a execução devem ser entidades diferentes, mas ligadas. O aluno precisa adaptar carga, série ou exercício no momento do treino sem apagar a intenção do treinador.
3. O treinador não deve depender de mensagem manual para saber que o aluno treinou. A sessão concluída, as alterações e o feedback devem alimentar automaticamente uma caixa de acompanhamento.
4. A progressão por faixa de repetições é um primeiro motor simples, compreensível e auditável. Não exige um sistema genérico de “modelos” para começar a funcionar.

## 2. Befit

### Fatos documentados

1. **Onboarding.** Os termos do Befit descrevem uma coleta inicial de experiência, frequência atual, objetivo, local, região corporal prioritária, idade, altura, peso, meta de peso, frequência semanal, duração e escolha entre treino automático ou personalizado. Fonte: [termos do Befit, atualizados em 14/04/2026](https://appbefit.com/terms/).

2. **Criação, recomendação e adaptação.** O plano usa objetivo, nível, rotina, equipamento, frequência, sessões concluídas, feedback e recuperação. A empresa afirma que o plano permanece estável e muda quando há progresso relevante, em vez de trocar toda a estrutura depois de cada treino. O usuário também pode criar uma rotina do zero e trocar exercícios antes ou durante a sessão. Fontes: [plano personalizado](https://appbefit.com/ai-personalized-plan/) e [Central de Ajuda](https://appbefit.com/help-center/).

3. **Progressão.** A documentação comercial cita sobrecarga progressiva, controle de volume e intensidade e programação sensível à recuperação. Ela não publica regras equivalentes ao critério objetivo de progressão do Hevy. Fonte: [plano personalizado](https://appbefit.com/ai-personalized-plan/).

4. **Execução, métricas e feedback.** O app registra séries, repetições, cargas e descanso. Acompanha treinos concluídos, sequência, volume, consistência e tendências de desempenho. A biblioteca traz vídeos e instruções de execução. No Apple Watch, o usuário acompanha o treino, registra séries e monitora frequência cardíaca e calorias pelo Apple Health. Fontes: [página oficial](https://appbefit.com/), [plano personalizado](https://appbefit.com/ai-personalized-plan/) e [Befit no Apple Watch](https://appbefit.com/apple-watch/).

5. **Offline.** O Befit precisa de internet para gerar ou atualizar o plano e sincronizar o progresso. Depois que a sessão foi carregada, o treino pode ser concluído sem conexão. Fonte: [Central de Ajuda](https://appbefit.com/help-center/).

6. **Treinador e atleta.** As fontes consultadas tratam o Befit como treino autônomo. Não foi encontrado um painel para personal com prescrição, revisão e comunicação comparável ao Hevy Coach.

7. **Retenção e monetização.** A retenção se apoia em sequência, progresso visível, programas especiais e adaptação do plano. O modelo é assinatura com acesso gratuito limitado. A página brasileira consultada apresenta plano mensal e anual, mas valores e promoções variam entre a central, a landing page e o checkout. Para benchmark, importa mais a estrutura do paywall do que o preço anunciado. Fontes: [Central de Ajuda](https://appbefit.com/pt-br/central-de-ajuda/), [landing page brasileira](https://appbefit.com/landing-page/) e [termos](https://appbefit.com/terms/).

### Inferências para o bstrainer

1. O onboarding deve falar a língua do aluno. Objetivo, dias disponíveis, tempo, equipamento e experiência vêm antes de conceitos como mesociclo ou template.
2. O primeiro plano precisa aparecer rápido e ser editável. Configuração técnica avançada pode ficar para o treinador ou para uma etapa posterior.
3. Adaptação não significa instabilidade. O app deve preservar os exercícios principais e explicar cada mudança relevante.
4. O bstrainer precisa publicar regras e motivos da recomendação. Uma frase como “carga mantida porque duas séries ficaram abaixo da meta” é mais útil do que um selo genérico de IA.

## 3. Nike Run Club

### Fatos documentados

1. **Criação e execução.** O NRC oferece planos para diferentes distâncias e níveis, além de corridas livres e corridas guiadas por áudio. Os planos explicam o objetivo da semana e a finalidade de cada sessão. Fontes: [planos do NRC](https://www.nike.com/help/a/nrc-plan) e [Nike Run Club na App Store](https://apps.apple.com/us/app/nike-run-club-running-coach/id387771637).

2. **Feedback durante o treino.** As corridas guiadas entregam orientação e motivação por áudio. O app acompanha distância, tempo, ritmo, rota, elevação e frequência cardíaca. Amigos podem enviar incentivos sonoros durante a corrida. Fonte: [Nike Run Club na App Store](https://apps.apple.com/us/app/nike-run-club-running-coach/id387771637).

3. **Recomendação e contexto.** A Nike documenta dicas locais antes da corrida com clima, nascer e pôr do sol. Há seis planos e cerca de 300 corridas guiadas. A documentação não descreve um motor de progressão de carga ou uma adaptação automática comparável ao Fitbod. Fonte: [comunicado oficial da Nike de 13/11/2024](https://about.nike.com/en/newsroom/releases/nike-run-club-app-new-features).

4. **Métricas, integração e segurança.** O NRC integra Apple Health, Strava, Apple Watch, Garmin e Coros. Também permite compartilhar localização, distância, ritmo médio e duração em tempo real por um link que funciona para quem não tem o app. Fontes: [comunicado oficial](https://about.nike.com/en/newsroom/releases/nike-run-club-app-new-features) e [App Store](https://apps.apple.com/us/app/nike-run-club-running-coach/id387771637).

5. **Offline.** A Nike informa que corridas guiadas podem ser baixadas no Apple Watch. Uma corrida gravada sem o telefone sincroniza quando o relógio volta a se conectar. Nas fontes consultadas, não foi localizada uma especificação completa de paridade offline no celular. Fontes: [corridas de velocidade no NRC](https://www.nike.com/help/a/nrc-speed-run/nrc-runs) e [sincronização de corridas](https://www.nike.com/help/a/nrc-upload/1000).

6. **Retenção.** O NRC usa desafios pessoais e coletivos, metas de distância, troféus, recordes, sequências, compartilhamento, comunidade e controle de quilometragem do tênis. Fonte: [Nike Run Club na App Store](https://apps.apple.com/us/app/nike-run-club-running-coach/id387771637).

7. **Monetização e relação com treinador.** O aplicativo é gratuito para membros Nike. A orientação vem de planos e áudios produzidos pela Nike, não de uma área operacional para um personal acompanhar um aluno individual. Fonte: [comunicado oficial](https://about.nike.com/en/newsroom/releases/nike-run-club-app-new-features).

### Inferências para o bstrainer

1. Durante a série, o app deve orientar sem exigir leitura longa. Avisos de descanso, próxima meta e mudança de carga podem funcionar como feedback curto por som, vibração ou texto.
2. A tela de treino deve reduzir o produto ao que importa naquele momento: exercício atual, desempenho anterior, meta, descanso e próxima ação.
3. Retenção não precisa depender de pontos artificiais. Marco pessoal, consistência, conclusão do bloco e progresso compartilhado com o treinador têm vínculo direto com o treino.
4. Informações contextuais podem evitar atrito. Duração disponível, equipamento ocupado, dor relatada ou local de treino devem ajudar o app a oferecer uma substituição plausível.

## 4. Fitbod

### Fatos documentados

1. **Onboarding e perfil de treino.** O Fitbod pergunta objetivo, experiência e equipamento disponível. O perfil também aceita duração, frequência, divisão, local, preferência de variabilidade, aquecimento, cardio, superséries e circuitos. Esses dados influenciam dificuldade, seleção de exercícios e volume. Fontes: [guia de início](https://help.fitbod.me/hc/en-us/articles/30721771750039-Getting-Started-with-Fitbod-A-New-User-s-Guide) e [como o Fitbod personaliza treinos](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works).

2. **Recomendação e progressão.** A empresa descreve dois componentes: um seletor de exercícios e um recomendador de capacidade, responsável por carga, séries e repetições. O sistema estima 1RM, considera histórico, objetivo, experiência, equipamento e recuperação e aprende com troca de exercícios, ajustes de carga, sessões concluídas e feedback de esforço. Fonte: [algoritmo do Fitbod, publicado em 09/06/2026](https://fitbod.me/blog/fitbod-algorithm/).

3. **Recuperação.** Cada grupo muscular recebe uma estimativa de recuperação entre 0% e 100%. O mapa corporal orienta a seleção do próximo treino, e o usuário pode corrigir manualmente a estimativa. Atividades importadas de Apple Health, Fitbit ou Strava também alteram a recuperação e podem regenerar a recomendação. Fontes: [recuperação muscular](https://fitbod.me/blog/muscle-recovery/) e [personalização do Fitbod](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works).

4. **Execução, feedback e métricas.** O Fitbod oferece instruções e vídeos, temporizador, ajuste manual de série, repetição e carga, RIR, dias de esforço máximo, relatórios e metas semanais de séries por grupo muscular. O app reconhece uma limitação: os treinos sugeridos ainda não garantem o cumprimento de todas as metas semanais de séries. Fontes: [guia de início](https://help.fitbod.me/hc/en-us/articles/30721771750039-Getting-Started-with-Fitbod-A-New-User-s-Guide) e [metas semanais](https://help.fitbod.me/hc/en-us/sections/1500000536822-Progress-Performance-Tracking).

5. **Offline.** O app gera treino com algoritmo local, registra e salva a sessão no aparelho, mostra miniaturas e vídeos já armazenados e sincroniza ao recuperar conexão. Alguns recursos, vídeos e históricos completos dependem da internet. Fonte: [uso offline do Fitbod, atualizado em 03/03/2026](https://help.fitbod.me/hc/en-us/articles/360006572594-Can-I-use-Fitbod-without-an-internet-connection).

6. **Integrações.** O Fitbod integra Apple Health, Health Connect, Fitbit, Strava e Apple Watch. O dado importado participa da recuperação e da próxima recomendação, não serve apenas como exportação. Fontes: [algoritmo](https://fitbod.me/blog/fitbod-algorithm/) e [App Store](https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543).

7. **Treinador, retenção e monetização.** O Ask a Trainer permite enviar dúvidas a treinadores certificados e receber orientação por e-mail, mas não cria um plano integral nem oferece acompanhamento contínuo comparável ao Hevy Coach. A retenção usa recomendação pronta, progresso, recuperação, metas semanais, prévias, sequências e relatórios. O modelo é teste seguido de assinatura mensal ou anual. Fontes: [Ask a Trainer](https://help.fitbod.me/hc/en-us/articles/1500012605521-Fitbod-s-Ask-a-Trainer-Program), [metas e sequências](https://help.fitbod.me/hc/en-us/articles/360013245993-Weekly-Workout-Goal-Previews-Streaks) e [Fitbod na App Store](https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543).

### Inferências para o bstrainer

1. O melhor princípio do Fitbod é reduzir a pergunta “o que treino hoje?”. O bstrainer deve abrir com uma recomendação utilizável e os motivos essenciais, não com uma lista de modelos.
2. A recomendação precisa aceitar restrições do mundo real: tempo, equipamentos disponíveis, exercício bloqueado, dor, fadiga percebida e alterações do treinador.
3. O motor inicial pode ser determinístico e auditável. Regras de progressão, volume, frequência e substituição já cobrem o núcleo. IA generativa deve ajudar a explicar ou organizar, não decidir carga sem validação.
4. O offline precisa abranger o fluxo inteiro: abrir a sessão, registrar cada série, editar, concluir, preservar o dado local e sincronizar sem duplicar.

## 5. Direção combinada para o bstrainer

### O que aproveitar

1. **Do Hevy:** logger denso, desempenho anterior visível, confirmação rápida e sincronização automática com o treinador.
2. **Do Befit:** onboarding simples, plano inicial rápido, escolha entre recomendação automática e controle manual.
3. **Do NRC:** orientação breve durante a sessão, marcos ligados à prática e experiência focada no treino atual.
4. **Do Fitbod:** recomendação por objetivo, histórico, recuperação, tempo e equipamento, com funcionamento offline.

### O diferencial que os quatro não entregam juntos

O bstrainer pode unir treino autônomo e acompanhamento profissional sem criar dois sistemas desconectados. O treinador define limites e intenção. O motor sugere progressão e adaptação. O atleta executa com pouca digitação. O resultado retorna ao treinador já organizado, com exceções que realmente pedem atenção.

### Fluxo de referência

1. **Entrada do aluno:** objetivo, experiência, frequência, tempo, local, equipamentos, restrições e preferência de acompanhamento.
2. **Plano inicial:** recomendação pronta, com explicação curta e opção de ajuste pelo treinador.
3. **Tela “Hoje”:** sessão sugerida, duração prevista, estado de recuperação e alertas relevantes.
4. **Execução:** valor anterior preenchido, meta atual, confirmação por série, descanso automático e substituição contextual.
5. **Encerramento:** esforço percebido, dor ou dificuldade, recordes e resumo breve.
6. **Adaptação:** regra mostra o que mudou e por quê. Mudanças sensíveis ficam para revisão do treinador.
7. **Acompanhamento:** o personal recebe um feed de exceções, como ausência, dor, queda de desempenho, baixa adesão ou progressão bloqueada.

## 6. Prioridades sugeridas

1. **Primeiro:** logger offline, sessão do dia e sincronização confiável.
2. **Depois:** progressão determinística com justificativa, substituições e feedback pós-treino.
3. **Em seguida:** workspace do treinador com prescrição, feed de exceções e comunicação contextual.
4. **Por último:** desafios, relatórios avançados, wearables adicionais e recursos sociais amplos.

O sistema atual de modelos não deve ser expandido antes desses fluxos funcionarem. Uma rotina prescrita, uma sessão executável e regras claras de progressão cobrem a maior parte do valor sem criar outra camada genérica.

## 7. Cuidados de produto

1. Não copiar grade, ícones, cores, ilustrações, microtextos, áudios, nomes de recursos ou sequência exata de telas.
2. Validar o logger com treinador e atleta usando tarefas reais, tempo por série, erros de digitação e número de toques.
3. Tratar recomendações como sugestões justificadas e reversíveis. O histórico precisa registrar regra aplicada, valor anterior, novo valor e intervenção humana.
4. Separar métricas úteis de métricas decorativas. A primeira entrega deve priorizar adesão, volume, intensidade, progressão, esforço, dor e consistência.
5. Não prometer “IA personalizada” sem mostrar quais dados influenciaram a decisão e como o usuário pode corrigi-la.

## Fontes primárias consultadas

Consulta realizada em 30/07/2026.

1. Hevy: [guia de recursos](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2025-Features-Guide), [rotinas e workouts](https://help.hevyapp.com/hc/en-us/articles/33703513582871-Workouts-vs-Routines-in-Hevy-What-They-Mean-and-How-to-Use-Them), [biblioteca](https://help.hevyapp.com/hc/en-us/articles/36011518408983-How-to-Access-and-Use-Hevy-s-Routine-and-Program-Library), [explicação do Hevy Trainer](https://help.hevyapp.com/hc/en-us/articles/38385724273047-Hevy-Trainer-Explained-How-It-Builds-Your-Workout-Program), [Hevy Trainer](https://www.hevyapp.com/features/workout-plan-generator/), [Hevy Coach](https://www.hevyapp.com/features/trainer-platform/) e [site oficial](https://www.hevyapp.com/).
2. Befit: [site oficial](https://appbefit.com/), [plano personalizado](https://appbefit.com/ai-personalized-plan/), [Central de Ajuda](https://appbefit.com/help-center/), [termos](https://appbefit.com/terms/), [Apple Watch](https://appbefit.com/apple-watch/) e [landing page brasileira](https://appbefit.com/landing-page/).
3. Nike Run Club: [comunicado oficial](https://about.nike.com/en/newsroom/releases/nike-run-club-app-new-features), [planos](https://www.nike.com/help/a/nrc-plan), [corridas de velocidade](https://www.nike.com/help/a/nrc-speed-run/nrc-runs), [sincronização](https://www.nike.com/help/a/nrc-upload/1000) e [App Store](https://apps.apple.com/us/app/nike-run-club-running-coach/id387771637).
4. Fitbod: [algoritmo](https://fitbod.me/blog/fitbod-algorithm/), [recuperação](https://fitbod.me/blog/muscle-recovery/), [guia de início](https://help.fitbod.me/hc/en-us/articles/30721771750039-Getting-Started-with-Fitbod-A-New-User-s-Guide), [personalização](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works), [uso offline](https://help.fitbod.me/hc/en-us/articles/360006572594-Can-I-use-Fitbod-without-an-internet-connection), [metas e desempenho](https://help.fitbod.me/hc/en-us/sections/1500000536822-Progress-Performance-Tracking), [metas e sequências](https://help.fitbod.me/hc/en-us/articles/360013245993-Weekly-Workout-Goal-Previews-Streaks), [Ask a Trainer](https://help.fitbod.me/hc/en-us/articles/1500012605521-Fitbod-s-Ask-a-Trainer-Program) e [App Store](https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543).
