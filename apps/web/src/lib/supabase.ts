/* Supabase — catálogo real de exercícios (anon key, leitura pública via RLS) */

export const SUPABASE_URL = 'https://ojgryehzjqvfgdpjtmft.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZ3J5ZWh6anF2ZmdkcGp0bWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4OTA0OTIsImV4cCI6MjA5OTQ2NjQ5Mn0.rwoSRbFYXLkwpnnOz7CGf_uVKcmy2Ignzsa2vk19OcQ'

const MEDIA_BASE =
  'https://raw.githubusercontent.com/psibrunosg/bstrainer/main/apps/web/public'

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
  | 'Core'

export const MUSCLE_MAP: Record<Muscle, string[]> = {
  Peito: ['pectorals', 'chest'],
  Costas: ['lats', 'upper back', 'traps', 'trapezius', 'back', 'lower back', 'serratus anterior'],
  Ombros: ['shoulders', 'delts', 'deltoids', 'rotator cuff'],
  Quadríceps: ['quadriceps', 'quads'],
  Posteriores: ['hamstrings'],
  Glúteos: ['glutes', 'hip flexors', 'adductors'],
  Panturrilha: ['calves', 'ankles'],
  Bíceps: ['biceps', 'forearms', 'wrist flexors'],
  Tríceps: ['triceps'],
  Core: ['abs', 'obliques', 'core', 'cardiovascular system'],
}

const LOAD_LABEL: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halteres',
  machine: 'Máquina',
  bodyweight: 'Peso corporal',
  cable: 'Cabo',
  kettlebell: 'Kettlebell',
  band: 'Elástico',
  smith: 'Smith',
  other: 'Outro',
}

export interface DbExercise {
  id: string
  name: string
  muscle: Muscle | 'Outros'
  musclesRaw: string[]
  equipment: string
  gif: string | null
}

function toTitleCase(s: string) {
  return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

function mapMuscle(primary: string[]): Muscle | 'Outros' {
  const set = new Set(primary.map((m) => m.toLowerCase()))
  for (const [group, values] of Object.entries(MUSCLE_MAP)) {
    if (values.some((v) => set.has(v))) return group as Muscle
  }
  return 'Outros'
}

function mapRow(r: any): DbExercise {
  const primary: string[] = r.primary_muscles ?? []
  return {
    id: r.id,
    name: toTitleCase(String(r.name ?? '').trim()),
    muscle: mapMuscle(primary),
    musclesRaw: primary,
    equipment: LOAD_LABEL[String(r.load_type ?? '').toLowerCase()] ?? 'Peso corporal',
    gif: r.media_url ? `${MEDIA_BASE}${r.media_url}` : null,
  }
}

export interface ExerciseQuery {
  search?: string
  muscle?: Muscle | 'Todos'
  page?: number
  pageSize?: number
}

export interface ExercisePage {
  items: DbExercise[]
  total: number
}

export async function fetchExercises({ search = '', muscle = 'Todos', page = 0, pageSize = 24 }: ExerciseQuery): Promise<ExercisePage> {
  const params = new URLSearchParams()
  params.set('select', 'id,name,primary_muscles,load_type,media_url')
  params.set('order', 'name.asc')
  if (search.trim()) params.set('name', `ilike.*${search.trim()}*`)
  if (muscle !== 'Todos') params.set('primary_muscles', `ov.{${MUSCLE_MAP[muscle].join(',')}}`)

  const from = page * pageSize
  const to = from + pageSize - 1

  const res = await fetch(`${SUPABASE_URL}/rest/v1/exercises?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Range: `${from}-${to}`,
      Prefer: 'count=exact',
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  const range = res.headers.get('content-range') ?? '0-0/0'
  const total = parseInt(range.split('/')[1] ?? '0', 10)
  const rows = await res.json()
  return { items: (rows as any[]).map(mapRow), total }
}
