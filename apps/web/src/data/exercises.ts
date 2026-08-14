export type Muscle =
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Quadríceps'
  | 'Posteriores'
  | 'Glúteos'
  | 'Panturrilha'
  | 'Bíceps'
  | 'Tríceps'
  | 'Core';

export interface Exercise {
  id: string;
  name: string;
  gif: string;
  muscle: Muscle;
  secondary?: Muscle[];
  equipment: string;
  kind: 'Composto' | 'Isolado';
  cues: string[];
}

export const EXERCISES: Exercise[] = [
  {
    id: 'agachamento', name: 'Agachamento livre com barra', gif: '/exercises/0026.gif',
    muscle: 'Quadríceps', secondary: ['Glúteos'], equipment: 'Barra', kind: 'Composto',
    cues: ['Pés na largura dos ombros, pontas levemente para fora', 'Desça “sentando entre os quadris”, joelhos acompanham as pontas dos pés', 'Peito orgulhoso e tronco firme durante todo o movimento'],
  },
  {
    id: 'leg-press', name: 'Leg press 45°', gif: '/exercises/0739.gif',
    muscle: 'Quadríceps', secondary: ['Glúteos'], equipment: 'Máquina', kind: 'Composto',
    cues: ['Pés na largura do quadril, no meio da plataforma', 'Desça até ~90° sem tirar o quadril do banco', 'Não trave os joelhos no topo'],
  },
  {
    id: 'cadeira-extensora', name: 'Cadeira extensora', gif: '/exercises/0585.gif',
    muscle: 'Quadríceps', equipment: 'Máquina', kind: 'Isolado',
    cues: ['Ajuste o rolo na canela, logo acima do tornozelo', 'Suba com controle e segure 1s no topo', 'Desça devagar — a excêntrica conta dobrado'],
  },
  {
    id: 'rdl', name: 'Levantamento terra romeno', gif: '/exercises/0085.gif',
    muscle: 'Posteriores', secondary: ['Glúteos'], equipment: 'Barra', kind: 'Composto',
    cues: ['Empurre o quadril para trás, joelhos semiflexionados', 'Barra colada nas pernas, coluna neutra', 'Desça até sentir alongar os posteriores'],
  },
  {
    id: 'mesa-flexora', name: 'Mesa flexora', gif: '/exercises/0586.gif',
    muscle: 'Posteriores', equipment: 'Máquina', kind: 'Isolado',
    cues: ['Quadril colado no banco durante toda a série', 'Flexione até o rolo tocar os glúteos', 'Controle a volta, sem soltar o peso'],
  },
  {
    id: 'elevacao-pelvica', name: 'Elevação pélvica com barra', gif: '/exercises/1409.gif',
    muscle: 'Glúteos', secondary: ['Posteriores'], equipment: 'Barra', kind: 'Composto',
    cues: ['Escápulas apoiadas no banco, queixo levemente recolhido', 'Estenda o quadril até alinhar joelho-quadril-ombro', 'Contraia o glúteo 1–2s no topo'],
  },
  {
    id: 'afundo', name: 'Afundo com halteres', gif: '/exercises/0336.gif',
    muscle: 'Quadríceps', secondary: ['Glúteos'], equipment: 'Halteres', kind: 'Composto',
    cues: ['Passada longa para glúteos, curta para quadríceps', 'Tronco levemente inclinado à frente', 'Empurre o chão com a perna da frente'],
  },
  {
    id: 'panturrilha', name: 'Panturrilha em pé com barra', gif: '/exercises/0108.gif',
    muscle: 'Panturrilha', equipment: 'Barra', kind: 'Isolado',
    cues: ['Amplitude completa: alongue embaixo, suba na ponta do pé', 'Pausa de 1s no topo e embaixo', 'Joelhos estendidos, sem quicar'],
  },
  {
    id: 'supino-reto', name: 'Supino reto com barra', gif: '/exercises/0025.gif',
    muscle: 'Peito', secondary: ['Tríceps', 'Ombros'], equipment: 'Barra', kind: 'Composto',
    cues: ['Retraia as escápulas e mantenha arco lombar natural', 'Barra desce na linha dos mamilos', 'Punhos firmes sobre os cotovelos'],
  },
  {
    id: 'supino-inclinado-h', name: 'Supino inclinado com halteres', gif: '/exercises/0314.gif',
    muscle: 'Peito', secondary: ['Ombros', 'Tríceps'], equipment: 'Halteres', kind: 'Composto',
    cues: ['Banco a 30–45° para ênfase no peitoral superior', 'Cotovelos a ~45° do tronco', 'Amplitude completa, halteres quase se tocam no topo'],
  },
  {
    id: 'crucifixo-h', name: 'Crucifixo com halteres', gif: '/exercises/0308.gif',
    muscle: 'Peito', equipment: 'Halteres', kind: 'Isolado',
    cues: ['Cotovelos levemente flexionados e fixos', 'Abra até a linha do peito, sem esticar o ombro', 'Feche “abraçando um barril”'],
  },
  {
    id: 'flexao', name: 'Flexão de braços', gif: '/exercises/3216.gif',
    muscle: 'Peito', secondary: ['Tríceps'], equipment: 'Peso corporal', kind: 'Composto',
    cues: ['Corpo em linha reta dos calcanhares à cabeça', 'Cotovelos a ~45° do tronco', 'Peito quase toca o chão'],
  },
  {
    id: 'puxada', name: 'Puxada alta na polia', gif: '/exercises/0197.gif',
    muscle: 'Costas', secondary: ['Bíceps'], equipment: 'Cabo', kind: 'Composto',
    cues: ['Puxe com os cotovelos, não com as mãos', 'Peito para cima, leve inclinação para trás', 'Barra na altura do peito, escápulas descem juntas'],
  },
  {
    id: 'remada-curvada', name: 'Remada curvada com barra', gif: '/exercises/0027.gif',
    muscle: 'Costas', secondary: ['Bíceps'], equipment: 'Barra', kind: 'Composto',
    cues: ['Tronco a ~45°, coluna neutra', 'Puxe a barra em direção ao umbigo', 'Sinta as escápulas se fechando antes dos braços'],
  },
  {
    id: 'remada-sentada', name: 'Remada sentada no cabo', gif: '/exercises/0861.gif',
    muscle: 'Costas', secondary: ['Bíceps'], equipment: 'Cabo', kind: 'Composto',
    cues: ['Tronco ereto, sem balançar para trás', 'Cotovelos colados ao corpo', 'Aperte as escápulas no fim do movimento'],
  },
  {
    id: 'barra-fixa', name: 'Barra fixa (pull-up)', gif: '/exercises/0652.gif',
    muscle: 'Costas', secondary: ['Bíceps'], equipment: 'Peso corporal', kind: 'Composto',
    cues: ['Pegada pronada um pouco além dos ombros', 'Inicie deprimindo as escápulas', 'Queixo acima da barra, desça com controle total'],
  },
  {
    id: 'remada-unilateral', name: 'Remada unilateral com haltere', gif: '/exercises/0292.gif',
    muscle: 'Costas', secondary: ['Bíceps'], equipment: 'Halteres', kind: 'Composto',
    cues: ['Mão e joelho apoiados no banco', 'Puxe o haltere em direção ao quadril', 'Sem rodar o tronco'],
  },
  {
    id: 'desenvolvimento', name: 'Desenvolvimento militar com barra', gif: '/exercises/1457.gif',
    muscle: 'Ombros', secondary: ['Tríceps'], equipment: 'Barra', kind: 'Composto',
    cues: ['Punhos sobre os cotovelos, pegada firme', 'Empurre a barra em linha reta, passe a cabeça', 'Core contraído, não hiperestenda a lombar'],
  },
  {
    id: 'elevacao-lateral', name: 'Elevação lateral com halteres', gif: '/exercises/0334.gif',
    muscle: 'Ombros', equipment: 'Halteres', kind: 'Isolado',
    cues: ['Suba até a linha dos ombros, não além', 'Cotovelos guiam o movimento, punhos neutros', 'Desça devagar — 2–3s na excêntrica'],
  },
  {
    id: 'crucifixo-inverso', name: 'Crucifixo inverso com halteres', gif: '/exercises/0378.gif',
    muscle: 'Ombros', equipment: 'Halteres', kind: 'Isolado',
    cues: ['Tronco inclinado ~45°, coluna neutra', 'Abra os braços “espalhando” o peso', 'Foque no deltoide posterior, não nas escápulas'],
  },
  {
    id: 'rosca-direta', name: 'Rosca direta com barra', gif: '/exercises/0031.gif',
    muscle: 'Bíceps', equipment: 'Barra', kind: 'Isolado',
    cues: ['Cotovelos fixos ao lado do tronco', 'Suba sem balançar o corpo', 'Desça com controle até estender quase tudo'],
  },
  {
    id: 'rosca-alternada', name: 'Rosca alternada com halteres', gif: '/exercises/0285.gif',
    muscle: 'Bíceps', equipment: 'Halteres', kind: 'Isolado',
    cues: ['Supine o punho durante a subida', 'Alterne os braços sem impulso', 'Cotovelo parado ao lado do corpo'],
  },
  {
    id: 'rosca-martelo', name: 'Rosca martelo', gif: '/exercises/0313.gif',
    muscle: 'Bíceps', equipment: 'Halteres', kind: 'Isolado',
    cues: ['Pegada neutra (palmas viradas uma para a outra)', 'Trabalha braquial e antebraço junto', 'Mesma disciplina: sem balanço'],
  },
  {
    id: 'triceps-polia', name: 'Tríceps na polia (pushdown)', gif: '/exercises/0241.gif',
    muscle: 'Tríceps', equipment: 'Cabo', kind: 'Isolado',
    cues: ['Cotovelos colados e imóveis', 'Estenda por completo e segure 1s', 'Tronco levemente à frente, sem usar o peso do corpo'],
  },
  {
    id: 'triceps-testa', name: 'Tríceps testa com barra', gif: '/exercises/0060.gif',
    muscle: 'Tríceps', equipment: 'Barra', kind: 'Isolado',
    cues: ['Cotovelos apontados para o teto', 'Flexione só o antebraço, barra rumo à testa', 'Estenda sem travar com violência'],
  },
  {
    id: 'prancha', name: 'Prancha com carga', gif: '/exercises/2135.gif',
    muscle: 'Core', equipment: 'Peso corporal', kind: 'Isolado',
    cues: ['Cotovelos sob os ombros, corpo em linha', 'Contraia glúteos e abdômen', 'Respire normal — nada de prender o ar'],
  },
  {
    id: 'abdominal', name: 'Abdominal crunch', gif: '/exercises/0001.gif',
    muscle: 'Core', equipment: 'Peso corporal', kind: 'Isolado',
    cues: ['Enrole a coluna vértebra por vértebra', 'Não puxe o pescoço', 'Expire na subida'],
  },
  {
    id: 'elevacao-pernas', name: 'Elevação de pernas suspensa', gif: '/exercises/0474.gif',
    muscle: 'Core', equipment: 'Barra fixa', kind: 'Isolado',
    cues: ['Pendure-se sem balanço', 'Eleve as pernas enrolando a pelve', 'Desça devagar, sem impulso'],
  },
  {
    id: 'goblet', name: 'Agachamento goblet', gif: '/exercises/0291.gif',
    muscle: 'Quadríceps', secondary: ['Glúteos'], equipment: 'Halteres', kind: 'Composto',
    cues: ['Haltere colado no peito', 'Desça profundo, cotovelos entre os joelhos', 'Ideal para aprender o padrão de agachamento'],
  },
  {
    id: 'supino-neutro', name: 'Supino reto com halteres (pegada neutra)', gif: '/exercises/0352.gif',
    muscle: 'Peito', secondary: ['Tríceps'], equipment: 'Halteres', kind: 'Composto',
    cues: ['Palmas viradas uma para a outra', 'Mais confortável para ombros sensíveis', 'Cotovelos próximos ao tronco'],
  },
];

export const MUSCLES: Muscle[] = ['Peito', 'Costas', 'Ombros', 'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Bíceps', 'Tríceps', 'Core'];

export const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
