export interface PlanExercise {
  ex: string; // id do exercício
  sets: number;
  reps: string; // faixa, ex: "6–10" ou "30–45s"
  rir: string; // ex: "2" ou "1–2"
  rest: number; // segundos
  note?: string;
}

export interface PlanDay {
  name: string;
  focus: string;
  exercises: PlanExercise[];
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  daysPerWeek: number;
  weeks: number;
  goal: string;
  weeklySets: string; // faixa de séries/músculo/semana
  rirTarget: string;
  progression: string;
  days: PlanDay[];
  science: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'base-solida',
    name: 'Base Sólida',
    tagline: 'Full Body 3x — fundação de força e técnica',
    level: 'Iniciante',
    daysPerWeek: 3,
    weeks: 6,
    goal: 'Construir base de força, aprender os padrões de movimento e criar o hábito de treinar.',
    weeklySets: '9–12',
    rirTarget: '2–3',
    progression: 'Progressão linear: atingiu o topo da faixa em todas as séries → +2,5 kg na próxima sessão.',
    days: [
      {
        name: 'Dia A', focus: 'Corpo todo — ênfase agachar',
        exercises: [
          { ex: 'agachamento', sets: 3, reps: '5–8', rir: '2', rest: 180, note: 'Prioridade técnica: filme a série se puder' },
          { ex: 'supino-reto', sets: 3, reps: '6–10', rir: '2', rest: 150 },
          { ex: 'remada-curvada', sets: 3, reps: '8–12', rir: '2', rest: 120 },
          { ex: 'desenvolvimento', sets: 2, reps: '8–12', rir: '2', rest: 120 },
          { ex: 'prancha', sets: 3, reps: '30–45s', rir: '—', rest: 60 },
        ],
      },
      {
        name: 'Dia B', focus: 'Corpo todo — ênfase posterior',
        exercises: [
          { ex: 'rdl', sets: 3, reps: '8–10', rir: '2', rest: 180 },
          { ex: 'supino-inclinado-h', sets: 3, reps: '8–12', rir: '2', rest: 150 },
          { ex: 'puxada', sets: 3, reps: '8–12', rir: '2', rest: 120 },
          { ex: 'afundo', sets: 2, reps: '10–12 /perna', rir: '2', rest: 90 },
          { ex: 'rosca-direta', sets: 2, reps: '10–15', rir: '1–2', rest: 75 },
          { ex: 'triceps-polia', sets: 2, reps: '10–15', rir: '1–2', rest: 75 },
        ],
      },
      {
        name: 'Dia C', focus: 'Corpo todo — ênfase volume',
        exercises: [
          { ex: 'leg-press', sets: 3, reps: '10–12', rir: '2', rest: 150 },
          { ex: 'flexao', sets: 3, reps: 'Máx −2', rir: '2', rest: 120, note: 'Pare 2 reps antes da falha' },
          { ex: 'remada-sentada', sets: 3, reps: '10–12', rir: '2', rest: 120 },
          { ex: 'elevacao-lateral', sets: 3, reps: '12–20', rir: '1–2', rest: 75 },
          { ex: 'mesa-flexora', sets: 2, reps: '10–15', rir: '1–2', rest: 90 },
          { ex: 'abdominal', sets: 3, reps: '12–20', rir: '1', rest: 60 },
        ],
      },
    ],
    science: [
      'Frequência de 3x/semana por músculo: meta-análises mostram que treinar cada músculo ≥2x/semana supera 1x (bro-split) a volume igual.',
      'Cargas moderadas próximas da falha (RIR 2–3) geram praticamente a mesma hipertrofia que treinar até a falha — com muito menos fadiga.',
      'Progressão linear: iniciantes conseguem adicionar carga quase toda sessão; o plano captura essa janela.',
    ],
  },
  {
    id: 'upper-lower',
    name: 'Hipertrofia Upper/Lower',
    tagline: '4x por semana — o ponto ótimo volume × recuperação',
    level: 'Intermediário',
    daysPerWeek: 4,
    weeks: 8,
    goal: 'Maximizar hipertrofia com volume semanal na faixa de maior resposta dose-resposta (10–16 séries/músculo).',
    weeklySets: '10–16',
    rirTarget: '1–3',
    progression: 'Progressão dupla: completou todas as séries no topo da faixa → +2–5% de carga. Deload na semana 8 (metade do volume).',
    days: [
      {
        name: 'Upper A', focus: 'Ênfase peito',
        exercises: [
          { ex: 'supino-reto', sets: 4, reps: '6–8', rir: '2', rest: 180 },
          { ex: 'remada-curvada', sets: 4, reps: '8–10', rir: '2', rest: 150 },
          { ex: 'supino-inclinado-h', sets: 3, reps: '8–12', rir: '1–2', rest: 120 },
          { ex: 'puxada', sets: 3, reps: '10–12', rir: '1–2', rest: 120 },
          { ex: 'elevacao-lateral', sets: 3, reps: '12–20', rir: '1', rest: 75 },
          { ex: 'triceps-testa', sets: 3, reps: '10–12', rir: '1–2', rest: 90 },
          { ex: 'rosca-alternada', sets: 3, reps: '10–12', rir: '1–2', rest: 90 },
        ],
      },
      {
        name: 'Lower A', focus: 'Ênfase quadríceps',
        exercises: [
          { ex: 'agachamento', sets: 4, reps: '5–8', rir: '2', rest: 210 },
          { ex: 'mesa-flexora', sets: 3, reps: '10–12', rir: '1–2', rest: 120 },
          { ex: 'cadeira-extensora', sets: 3, reps: '10–15', rir: '1', rest: 90 },
          { ex: 'panturrilha', sets: 4, reps: '10–15', rir: '1', rest: 75 },
          { ex: 'abdominal', sets: 3, reps: '12–20', rir: '1', rest: 60 },
        ],
      },
      {
        name: 'Upper B', focus: 'Ênfase costas',
        exercises: [
          { ex: 'barra-fixa', sets: 4, reps: '6–10', rir: '1–2', rest: 180, note: 'Use elástico ou máquina se necessário' },
          { ex: 'supino-inclinado-h', sets: 3, reps: '8–10', rir: '2', rest: 150 },
          { ex: 'remada-sentada', sets: 3, reps: '10–12', rir: '1–2', rest: 120 },
          { ex: 'desenvolvimento', sets: 3, reps: '8–10', rir: '2', rest: 150 },
          { ex: 'crucifixo-inverso', sets: 3, reps: '12–20', rir: '1', rest: 75 },
          { ex: 'rosca-martelo', sets: 3, reps: '10–12', rir: '1–2', rest: 90 },
          { ex: 'triceps-polia', sets: 3, reps: '10–15', rir: '1', rest: 75 },
        ],
      },
      {
        name: 'Lower B', focus: 'Ênfase posteriores e glúteos',
        exercises: [
          { ex: 'rdl', sets: 4, reps: '6–8', rir: '2', rest: 210 },
          { ex: 'leg-press', sets: 3, reps: '10–12', rir: '1–2', rest: 150 },
          { ex: 'afundo', sets: 3, reps: '10 /perna', rir: '1–2', rest: 120 },
          { ex: 'elevacao-pelvica', sets: 3, reps: '8–12', rir: '1', rest: 120 },
          { ex: 'panturrilha', sets: 4, reps: '12–15', rir: '1', rest: 75 },
          { ex: 'prancha', sets: 3, reps: '45–60s', rir: '—', rest: 60 },
        ],
      },
    ],
    science: [
      'Volume: 10–16 séries duras por músculo/semana é a faixa de maior resposta dose-resposta para intermediários.',
      'Progressão dupla (reps → carga) é o método mais sustentável de sobrecarga progressiva em faixas de repetição.',
      'Deload planejado a cada 6–8 semanas consolida adaptações e reduz risco de overreaching.',
    ],
  },
  {
    id: 'ppl',
    name: 'PPL 6x Volume Máximo',
    tagline: 'Push / Pull / Legs — para quem já treina sério',
    level: 'Avançado',
    daysPerWeek: 6,
    weeks: 7,
    goal: 'Volume alto distribuído com inteligência: 16–20 séries/músculo/semana, cada um treinado 2x, com técnicas de intensidade controladas.',
    weeklySets: '16–20',
    rirTarget: '0–2',
    progression: 'Progressão dupla agressiva. Drop-set no último set dos isolados. Semana 7: deload obrigatório (−50% volume).',
    days: [
      {
        name: 'Push', focus: 'Peito · ombros · tríceps',
        exercises: [
          { ex: 'supino-reto', sets: 4, reps: '5–8', rir: '1–2', rest: 210 },
          { ex: 'supino-inclinado-h', sets: 3, reps: '8–10', rir: '1', rest: 150 },
          { ex: 'desenvolvimento', sets: 3, reps: '8–10', rir: '1–2', rest: 150 },
          { ex: 'elevacao-lateral', sets: 4, reps: '12–20', rir: '0–1', rest: 75, note: 'Drop-set na última série' },
          { ex: 'triceps-testa', sets: 3, reps: '10–12', rir: '1', rest: 90 },
          { ex: 'triceps-polia', sets: 3, reps: '12–15', rir: '0–1', rest: 75, note: 'Drop-set na última série' },
        ],
      },
      {
        name: 'Pull', focus: 'Costas · deltoide posterior · bíceps',
        exercises: [
          { ex: 'barra-fixa', sets: 4, reps: '6–8', rir: '1–2', rest: 210 },
          { ex: 'remada-curvada', sets: 4, reps: '8–10', rir: '1–2', rest: 150 },
          { ex: 'remada-unilateral', sets: 3, reps: '10–12', rir: '1', rest: 120 },
          { ex: 'crucifixo-inverso', sets: 3, reps: '12–20', rir: '0–1', rest: 75, note: 'Drop-set na última série' },
          { ex: 'rosca-direta', sets: 3, reps: '8–12', rir: '1', rest: 90 },
          { ex: 'rosca-martelo', sets: 3, reps: '10–12', rir: '0–1', rest: 75, note: 'Drop-set na última série' },
        ],
      },
      {
        name: 'Legs', focus: 'Quadríceps · posteriores · panturrilha',
        exercises: [
          { ex: 'agachamento', sets: 4, reps: '5–8', rir: '1–2', rest: 240 },
          { ex: 'rdl', sets: 3, reps: '8–10', rir: '2', rest: 180 },
          { ex: 'leg-press', sets: 3, reps: '10–12', rir: '1', rest: 150 },
          { ex: 'mesa-flexora', sets: 3, reps: '10–15', rir: '0–1', rest: 90, note: 'Drop-set na última série' },
          { ex: 'panturrilha', sets: 4, reps: '10–15', rir: '0–1', rest: 75 },
          { ex: 'elevacao-pernas', sets: 3, reps: '12–15', rir: '1', rest: 75 },
        ],
      },
    ],
    science: [
      'Repetir o ciclo 2x na semana (PPL×2) mantém cada músculo com frequência 2x mesmo com volume alto.',
      'Técnicas de intensidade (drop-set) só em isolados seguros, no último set: mesmo ganho com menos tempo, sem comprometer os compostos.',
      'Volume próximo de 20 séries/músculo/semana exige deload frequente — por isso o ciclo fecha em 6 semanas.',
    ],
  },
];

export const FUNDAMENTOS = [
  {
    title: 'Volume: 10–20 séries/músculo/semana',
    body: 'A relação volume × hipertrofia é dose-resposta: mais séries duras por semana, mais crescimento — até o limite de recuperação. Comece perto de 10 e progrida ao longo do mesociclo.',
  },
  {
    title: 'Frequência: 2x ou mais por músculo',
    body: 'Dividir o volume em 2+ sessões semanais por grupo muscular supera o tradicional “um músculo por dia”, porque cada sessão de qualidade rende mais que séries acumuladas sob fadiga.',
  },
  {
    title: 'Esforço: RIR 1–3 na maioria das séries',
    body: 'Treinar a 1–3 repetições da falha produz hipertrofia equivalente à falha total, com menos fadiga e menos risco articular. Falha absoluta fica para isolados seguros.',
  },
  {
    title: 'Faixa de reps: 5–30 funciona',
    body: 'De 5 a 30 reps, a hipertrofia é similar desde que o esforço seja alto. Compostos rendem melhor em 5–10 (força + técnica); isolados em 10–20 (menos carga articular).',
  },
  {
    title: 'Progressão dupla',
    body: 'Trabalhe numa faixa de reps. Quando completar todas as séries no topo da faixa, aumente a carga 2–5% e recomece. Simples, mensurável, sustentável.',
  },
  {
    title: 'Descanso: 2–3 min compostos, 1–2 min isolados',
    body: 'Descansos curtos demais derrubam o volume efetivo das séries seguintes. Em compostos pesados, 2–3 min preservam performance — e performance é o motor da adaptação.',
  },
  {
    title: 'Deload a cada 4–8 semanas',
    body: 'Uma semana com metade do volume dissipa fadiga acumulada, ressensibiliza o músculo ao estímulo e protege articulações. Fadiga esconde fitness — o deload revela.',
  },
];
