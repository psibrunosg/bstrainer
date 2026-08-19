import { useEffect, useMemo, useState } from 'react'
import { Check, Timer, ChevronDown, ChevronUp, Trophy, Zap, BatteryCharging, Moon, Flame, Clock3, AlertTriangle, TrendingUp, History } from 'lucide-react'
import { PLANS, type PlanExercise, type PlanDay } from '../data/plans'
import { byId } from '../data/exercises'

/* ── Dados simulados (na versão real: Supabase) ─────────────────────────
   Regra de prescrição de carga, nesta ordem:
   1. Histórico do aluno → progressão dupla sobre a última sessão
   2. Sem histórico → avaliação física (teste de 8–10RM convertido)
   3. Sem nenhum dos dois → campo vazio, aluno registra a 1ª vez      */
const LAST_SESSION: Record<string, { weight: number; reps: number }[]> = {
  'supino-reto': [{ weight: 52.5, reps: 8 }, { weight: 52.5, reps: 8 }, { weight: 52.5, reps: 7 }, { weight: 52.5, reps: 6 }],
  'remada-curvada': [{ weight: 40, reps: 10 }, { weight: 40, reps: 9 }, { weight: 40, reps: 8 }, { weight: 40, reps: 8 }],
  'supino-inclinado-h': [{ weight: 18, reps: 12 }, { weight: 18, reps: 11 }, { weight: 18, reps: 10 }],
  'puxada': [{ weight: 50, reps: 12 }, { weight: 50, reps: 11 }, { weight: 50, reps: 10 }],
  'elevacao-lateral': [{ weight: 7, reps: 16 }, { weight: 7, reps: 15 }, { weight: 7, reps: 14 }],
  'triceps-testa': [{ weight: 22.5, reps: 12 }, { weight: 22.5, reps: 10 }, { weight: 22.5, reps: 10 }],
  'rosca-alternada': [{ weight: 10, reps: 12 }, { weight: 10, reps: 11 }, { weight: 10, reps: 10 }],
  'agachamento': [{ weight: 70, reps: 8 }, { weight: 70, reps: 7 }, { weight: 70, reps: 6 }, { weight: 70, reps: 6 }],
  'mesa-flexora': [{ weight: 35, reps: 12 }, { weight: 35, reps: 11 }, { weight: 35, reps: 10 }],
  'cadeira-extensora': [{ weight: 40, reps: 15 }, { weight: 40, reps: 13 }, { weight: 40, reps: 12 }],
  'panturrilha': [{ weight: 50, reps: 15 }, { weight: 50, reps: 13 }, { weight: 50, reps: 12 }, { weight: 50, reps: 11 }],
  'abdominal': [{ weight: 0, reps: 18 }, { weight: 0, reps: 16 }, { weight: 0, reps: 15 }],
  'barra-fixa': [{ weight: 0, reps: 9 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }],
  'remada-sentada': [{ weight: 45, reps: 12 }, { weight: 45, reps: 11 }, { weight: 45, reps: 10 }],
  'desenvolvimento': [{ weight: 27.5, reps: 10 }, { weight: 27.5, reps: 9 }, { weight: 27.5, reps: 8 }],
  'crucifixo-inverso': [{ weight: 6, reps: 18 }, { weight: 6, reps: 16 }, { weight: 6, reps: 15 }],
  'rosca-martelo': [{ weight: 12, reps: 12 }, { weight: 12, reps: 11 }, { weight: 12, reps: 10 }],
  'triceps-polia': [{ weight: 25, reps: 15 }, { weight: 25, reps: 13 }, { weight: 25, reps: 12 }],
  'rdl': [{ weight: 70, reps: 8 }, { weight: 70, reps: 7 }, { weight: 70, reps: 7 }, { weight: 70, reps: 6 }],
  'leg-press': [{ weight: 140, reps: 12 }, { weight: 140, reps: 11 }, { weight: 140, reps: 10 }],
  'afundo': [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 9 }],
  'elevacao-pelvica': [{ weight: 80, reps: 12 }, { weight: 80, reps: 10 }, { weight: 80, reps: 10 }],
  'prancha': [{ weight: 5, reps: 1 }, { weight: 5, reps: 1 }, { weight: 5, reps: 1 }],
  'flexao': [{ weight: 0, reps: 20 }, { weight: 0, reps: 18 }, { weight: 0, reps: 16 }],
  'rosca-direta': [{ weight: 22.5, reps: 12 }, { weight: 22.5, reps: 11 }, { weight: 22.5, reps: 10 }],
  'remada-unilateral': [{ weight: 22, reps: 12 }, { weight: 22, reps: 11 }, { weight: 22, reps: 10 }],
  'elevacao-pernas': [{ weight: 0, reps: 14 }, { weight: 0, reps: 13 }, { weight: 0, reps: 12 }],
  // sem histórico: crucifixo-h, goblet, supino-neutro → caem na avaliação física
}

/** Avaliação física: teste de repetições máximas convertido para a faixa prescrita. */
const ASSESSMENT: Record<string, { weight: number; reps: number; test: string }> = {
  'crucifixo-h': { weight: 8, reps: 12, test: 'teste 10RM · 12/ago' },
  'goblet': { weight: 16, reps: 12, test: 'teste 10RM · 12/ago' },
  'supino-neutro': { weight: 16, reps: 10, test: 'teste 10RM · 12/ago' },
}

type Suggestion = { weight: number; reps: number; why: 'up' | 'same'; source: 'history' | 'assessment' }

function topOfRange(reps: string): number | null {
  const m = reps.match(/(\d+)\s*[–-]\s*(\d+)/)
  return m ? parseInt(m[2], 10) : null
}

/** 1º histórico (progressão dupla) · 2º avaliação física · 3º vazio */
function suggestion(pe: PlanExercise): Suggestion | null {
  const hist = LAST_SESSION[pe.ex]
  if (hist && hist.length > 0) {
    const last = hist[0]
    const top = topOfRange(pe.reps)
    if (top !== null && last.reps >= top) {
      const inc = last.weight >= 60 ? 5 : last.weight > 0 ? 2.5 : 0
      return { weight: last.weight + inc, reps: parseInt(pe.reps.split(/[–-]/)[0], 10) || last.reps, why: 'up', source: 'history' }
    }
    return { weight: last.weight, reps: last.reps + 1, why: 'same', source: 'history' }
  }
  const a = ASSESSMENT[pe.ex]
  if (a) return { weight: a.weight, reps: a.reps, why: 'same', source: 'assessment' }
  return null
}

/* ── Check-in ────────────────────────────────────────────────────────── */
interface Checkin { energy: number | null; sleep: number | null; soreness: number | null; stress: number | null; minutes: number }

function Scale({ label, hint, icon: Icon, value, onChange, invert }: {
  label: string; hint: string; icon: typeof Zap; value: number | null; onChange: (v: number) => void; invert?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium"><Icon size={15} className="text-aqua" />{label}</span>
        <span className="font-mono-num text-xs text-muted-foreground">{value ? `${value}/5 · ${hint.split('|')[value - 1]}` : hint.split('|')[2]}</span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((v) => {
          const active = value === v
          const danger = invert ? v >= 4 : v <= 2
          return (
            <button key={v} onClick={() => onChange(v)}
              className={`flex h-12 items-center justify-center rounded-full border font-mono-num text-sm font-semibold transition-all active:scale-95 ${
                active
                  ? danger
                    ? 'border-destructive bg-destructive text-white'
                    : 'border-volt bg-volt text-[#101405]'
                  : 'border-line bg-surface text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}>
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function readinessScore(c: Checkin) {
  const vals = [c.energy, c.sleep, c.soreness, c.stress].filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  const sum = (c.energy ?? 3) + (c.sleep ?? 3) + (6 - (c.soreness ?? 3)) + (6 - (c.stress ?? 3))
  return Math.round((sum / 20) * 100)
}

function CheckinScreen({ day, onStart }: { day: PlanDay; onStart: (adj: Adjustment, minutes: number) => void }) {
  const [c, setC] = useState<Checkin>({ energy: null, sleep: null, soreness: null, stress: null, minutes: 60 })
  const score = readinessScore(c)
  const complete = c.energy && c.sleep && c.soreness && c.stress

  const adj = buildAdjustment(score ?? 70, c.minutes, day)

  return (
    <div className="space-y-6">
            <div className="animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Check-in diário</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Como você chegou hoje?</h1>
        </div>
      </div>

      <div className="card-surface space-y-6 rounded-3xl p-5 lg:p-7 animate-rise" style={{ animationDelay: '60ms' }}>
        <Scale label="Energia física" hint="Esgotado|Baixa|Ok|Boa|No talo" icon={BatteryCharging} value={c.energy} onChange={(v) => setC({ ...c, energy: v })} />
        <Scale label="Sono da noite" hint="≤4h|~5h|~6h|~7h|8h+" icon={Moon} value={c.sleep} onChange={(v) => setC({ ...c, sleep: v })} />
        <Scale label="Dor muscular / fadiga" hint="Nenhuma|Leve|Moderada|Forte|Muito forte" icon={Flame} value={c.soreness} onChange={(v) => setC({ ...c, soreness: v })} invert />
        <Scale label="Estresse" hint="Zen|Baixo|Moderado|Alto|Explodindo" icon={Zap} value={c.stress} onChange={(v) => setC({ ...c, stress: v })} invert />

        <div>
          <span className="flex items-center gap-2 text-sm font-medium"><Clock3 size={15} className="text-aqua" />Tempo disponível</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[30, 45, 60, 90].map((m) => (
              <button key={m} onClick={() => setC({ ...c, minutes: m })}
                className={`flex h-12 items-center justify-center rounded-full border font-mono-num text-sm font-semibold transition-all active:scale-95 ${
                  c.minutes === m ? 'border-volt bg-volt text-[#101405]' : 'border-line bg-surface text-muted-foreground hover:text-foreground'
                }`}>
                {m}min
              </button>
            ))}
          </div>
        </div>
      </div>

      {score !== null && (
        <div className="card-surface flex items-center gap-5 rounded-3xl p-5 animate-rise">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--surface-2))" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none"
                stroke={score >= 70 ? 'hsl(var(--volt))' : score >= 45 ? 'hsl(40 90% 55%)' : 'hsl(var(--destructive))'}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - score / 100)} className="transition-all duration-700" />
            </svg>
            <span className="font-mono-num absolute inset-0 flex items-center justify-center text-2xl font-bold">{score}</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg">{score >= 70 ? 'Prontidão alta' : score >= 45 ? 'Prontidão moderada' : 'Prontidão baixa'}</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {adj.notes.map((n) => <li key={n} className="flex gap-1.5"><span className="text-volt">→</span>{n}</li>)}
            </ul>
          </div>
        </div>
      )}

      <button
        onClick={() => complete && onStart(adj, c.minutes)}
        disabled={!complete}
        className={`w-full rounded-3xl py-4 font-display text-sm uppercase tracking-wide transition-all ${
          complete ? 'bg-volt text-[#101405] hover:scale-[1.01] active:scale-[0.98]' : 'cursor-not-allowed bg-surface-2 text-muted-foreground'
        }`}>
        {complete ? `Iniciar ${day.name}` : 'Responda o check-in para começar'}
      </button>
    </div>
  )
}

/* ── Ajustes do motor ────────────────────────────────────────────────── */
interface Adjustment {
  loadFactor: number
  dropSets: number // séries a remover por exercício
  rirShift: number
  dropLast: number // exercícios acessórios removidos por tempo
  notes: string[]
  deload: boolean
}

function buildAdjustment(score: number, minutes: number, day: PlanDay): Adjustment {
  const notes: string[] = []
  let loadFactor = 1, dropSets = 0, rirShift = 0, deload = false
  if (score >= 80) notes.push('Sessão completa conforme prescrito — manda bala')
  else if (score >= 60) notes.push('Cargas sugeridas mantidas, atenção ao aquecimento')
  else if (score >= 45) { loadFactor = 0.95; rirShift = 1; notes.push('−5% nas cargas sugeridas e RIR +1 (mais reserva)') }
  else { loadFactor = 0.9; dropSets = 1; rirShift = 2; deload = true; notes.push('Modo recuperação: −1 série por exercício, −10% carga, RIR +2') }

  const baseMin = day.exercises.reduce((a, e) => a + e.sets, 0) * 3.2
  let dropLast = 0
  if (minutes * 1.15 < baseMin) {
    dropLast = minutes <= 30 ? 3 : minutes <= 45 ? 2 : 1
    notes.push(`Tempo curto: ${dropLast} acessório(s) movido(s) para a próxima sessão`)
  }
  return { loadFactor, dropSets, rirShift, dropLast, notes, deload }
}

/* ── Timer de descanso ───────────────────────────────────────────────── */
function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const pct = (left / seconds) * 100
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="card-surface w-full max-w-xs rounded-3xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Descanso</p>
        <div className="relative mx-auto mt-6 h-44 w-44">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--surface-2))" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--volt))" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - pct / 100)}
              className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-mono-num text-4xl font-semibold ${left === 0 ? 'text-volt' : ''}`}>{left === 0 ? 'Vai!' : `${mm}:${ss}`}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setLeft((s) => s + 30)} className="rounded-full border border-line px-4 py-2 font-mono-num text-sm text-muted-foreground hover:text-foreground">+30s</button>
          <button onClick={() => setLeft((s) => Math.max(0, s - 30))} className="rounded-full border border-line px-4 py-2 font-mono-num text-sm text-muted-foreground hover:text-foreground">−30s</button>
          <button onClick={onClose} className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-[#101405]">{left === 0 ? 'Continuar' : 'Pular'}</button>
        </div>
      </div>
    </div>
  )
}

/* ── Sessão ──────────────────────────────────────────────────────────── */
interface SetState { done: boolean; weight: string; reps: string; rir: number | null }

export default function Workout({ planId }: { planId: string }) {
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]
  const [dayIdx, setDayIdx] = useState(0)
  const day = plan.days[dayIdx]

  const [phase, setPhase] = useState<'checkin' | 'session' | 'done'>('checkin')
  const [adj, setAdj] = useState<Adjustment | null>(null)
  const [sets, setSets] = useState<Record<string, SetState[]>>({})
  const [open, setOpen] = useState<string | null>(day.exercises[0].ex)
  const [rest, setRest] = useState<number | null>(null)
  const [startedAt] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase !== 'session') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [phase, startedAt])

  const visibleExercises = useMemo(() => {
    const list = [...day.exercises]
    if (adj && adj.dropLast > 0) return list.slice(0, Math.max(3, list.length - adj.dropLast))
    return list
  }, [dayIdx, adj])

  const setsOf = (pe: PlanExercise): SetState[] => {
    if (sets[pe.ex]) return sets[pe.ex]
    const n = Math.max(1, pe.sets - (adj?.dropSets ?? 0))
    const sug = suggestion(pe)
    const lf = adj?.loadFactor ?? 1
    return Array.from({ length: n }, (_, i) => {
      const hist = LAST_SESSION[pe.ex]?.[i]
      const base = sug ?? (hist ? { weight: hist.weight, reps: hist.reps } : null)
      return {
        done: false,
        weight: base ? String(Math.round(base.weight * lf * 2) / 2) : '',
        reps: base ? String(base.reps) : pe.reps.split(/[–-]/)[0],
        rir: null,
      }
    })
  }

  const toggleSet = (pe: PlanExercise, i: number) => {
    const cur = setsOf(pe).map((s, j) => (j === i ? { ...s, done: !s.done } : s))
    setSets({ ...sets, [pe.ex]: cur })
    if (cur[i].done) setRest(pe.rest)
  }

  const totalSets = visibleExercises.reduce((a, e) => a + setsOf(e).length, 0)
  const doneSets = visibleExercises.reduce((a, e) => a + setsOf(e).filter((s) => s.done).length, 0)
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0

  const volume = useMemo(
    () => visibleExercises.reduce((a, e) => a + setsOf(e).filter((s) => s.done).reduce((x, s) => x + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0), 0),
    [sets, dayIdx, adj],
  )

  if (phase === 'checkin') {
    return <CheckinScreen day={day} onStart={(a) => { setAdj(a); setPhase('session') }} />
  }

  if (phase === 'done') {
    const mins = Math.max(1, Math.round(elapsed / 60))
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center animate-rise">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-volt/15">
          <Trophy size={36} className="text-volt" />
        </div>
        <h1 className="font-display mt-6 text-3xl">Treino concluído.</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{day.name} · {plan.name}</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[[`${doneSets}/${totalSets}`, 'séries'], [`${(volume / 1000).toFixed(1)}t`, 'volume'], [`${mins}min`, 'duração']].map(([v, l]) => (
            <div key={l} className="card-surface rounded-3xl px-5 py-4">
              <p className="font-mono-num text-xl font-semibold text-volt">{v}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        {adj?.deload && <p className="mt-4 text-xs text-muted-foreground">Sessão em modo recuperação registrada — descanse bem, o corpo agradece.</p>}
        <button onClick={() => { setPhase('checkin'); setSets({}); setAdj(null) }} className="mt-8 rounded-3xl border border-line px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          Voltar
        </button>
      </div>
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="space-y-5">
      <div className="animate-rise">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl lg:text-3xl">{day.name} — {day.focus}</h1>
          <span className="font-mono-num shrink-0 rounded-full border border-line px-3 py-1 text-xs text-muted-foreground">{mm}:{ss}</span>
        </div>
        {adj && adj.rirShift > 0 && (
          <p className="mt-2 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            <AlertTriangle size={14} /> Prontidão {adj.deload ? 'baixa' : 'moderada'}: hoje o alvo é RIR {adj.rirShift === 2 ? '+2' : '+1'} (mais repetições em reserva).
          </p>
        )}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gradient-to-r from-aqua to-volt transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {plan.days.map((d, i) => (
            <button key={d.name} onClick={() => { setDayIdx(i); setOpen(d.exercises[0].ex) }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                i === dayIdx ? 'bg-volt text-[#101405]' : 'border border-line text-muted-foreground hover:text-foreground'
              }`}>
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visibleExercises.map((pe, idx) => {
          const e = byId[pe.ex]
          const ss = setsOf(pe)
          const done = ss.filter((s) => s.done).length
          const isOpen = open === pe.ex
          const sug = suggestion(pe)
          const hist = LAST_SESSION[pe.ex]
          const rirTarget = pe.rir === '—' ? '—' : pe.rir.split(/[–-]/).map((r) => parseInt(r, 10) + (adj?.rirShift ?? 0)).join('–')
          return (
            <div key={pe.ex} className="card-surface overflow-hidden rounded-3xl animate-rise" style={{ animationDelay: `${idx * 40}ms` }}>
              <button onClick={() => setOpen(isOpen ? null : pe.ex)} className="flex w-full items-center gap-4 p-4 text-left">
                <img src={e.gif} alt={e.name} loading="lazy" className="h-16 w-16 shrink-0 rounded-xl border border-line bg-surface object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{idx + 1}. {e.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ss.length} × {pe.reps} · RIR {rirTarget} · desc {pe.rest >= 60 ? `${Math.floor(pe.rest / 60)}:${String(pe.rest % 60).padStart(2, '0')}` : `${pe.rest}s`}
                  </p>
                  {sug ? (
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${sug.why === 'up' ? 'text-volt' : 'text-aqua'}`}>
                      {sug.why === 'up' ? <TrendingUp size={11} /> : <History size={11} />}
                      {sug.source === 'assessment'
                        ? `Base: avaliação física (${ASSESSMENT[pe.ex].test})`
                        : sug.why === 'up'
                          ? `Progressão: sobe para ${sug.weight}kg`
                          : `Última: ${hist?.[0].weight}kg × ${hist?.[0].reps}`}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Sem referência — registre sua 1ª vez</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`font-mono-num text-sm ${done === ss.length ? 'text-volt' : 'text-muted-foreground'}`}>{done}/{ss.length}</span>
                  {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-line p-4">
                  <div className="mb-2 grid grid-cols-[2.25rem_1fr_1fr_5.5rem_2.5rem] items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>Série</span><span>Carga</span><span>Reps</span><span>RIR</span><span className="text-right">✓</span>
                  </div>
                  {ss.map((s, i) => {
                    const prev = LAST_SESSION[pe.ex]?.[i]
                    return (
                      <div key={i} className={`mb-2 rounded-full p-1.5 ${s.done ? 'bg-volt/10' : 'bg-surface'}`}>
                        <div className="grid grid-cols-[2.25rem_1fr_1fr_5.5rem_2.5rem] items-center gap-2">
                          <span className="font-mono-num text-center text-xs text-muted-foreground">{i + 1}</span>
                          <input value={s.weight} inputMode="decimal" placeholder="—"
                            onChange={(ev) => setSets({ ...sets, [pe.ex]: ss.map((x, j) => (j === i ? { ...x, weight: ev.target.value } : x)) })}
                            className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-center font-mono-num text-sm outline-none focus:border-volt/60" />
                          <input value={s.reps} inputMode="numeric"
                            onChange={(ev) => setSets({ ...sets, [pe.ex]: ss.map((x, j) => (j === i ? { ...x, reps: ev.target.value } : x)) })}
                            className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-center font-mono-num text-sm outline-none focus:border-volt/60" />
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((r) => (
                              <button key={r} onClick={() => setSets({ ...sets, [pe.ex]: ss.map((x, j) => (j === i ? { ...x, rir: r } : x)) })}
                                className={`h-8 flex-1 rounded-md font-mono-num text-[11px] transition-colors ${
                                  s.rir === r ? 'bg-aqua text-[#08110f]' : 'border border-line text-muted-foreground'
                                }`}>
                                {r}{r === 3 ? '+' : ''}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => toggleSet(pe, i)}
                            className={`flex h-9 w-9 items-center justify-center justify-self-end rounded-full transition-all ${
                              s.done ? 'bg-volt text-[#101405]' : 'border border-line text-muted-foreground hover:border-volt/50'
                            }`}>
                            <Check size={16} strokeWidth={3} />
                          </button>
                        </div>
                        {prev ? (
                          <p className="mt-1 pl-[2.25rem] text-[10px] text-muted-foreground">
                            anterior: {prev.weight > 0 ? `${prev.weight}kg × ` : ''}{prev.reps}{pe.reps.includes('s') ? ' (seg)' : ' reps'}
                          </p>
                        ) : ASSESSMENT[pe.ex] && i === 0 ? (
                          <p className="mt-1 pl-[2.25rem] text-[10px] text-muted-foreground">
                            avaliação física: {ASSESSMENT[pe.ex].weight}kg · {ASSESSMENT[pe.ex].test}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface p-3">
                    <img src={e.gif} alt="" className="h-20 w-20 rounded-full object-cover lg:hidden" />
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {e.cues.map((cu) => <li key={cu} className="flex gap-2"><span className="text-volt">→</span>{cu}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {adj && adj.dropLast > 0 && (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-center text-xs text-muted-foreground">
          {adj.dropLast} acessório(s) ocultos para caber no seu tempo — movidos para a próxima sessão.
        </p>
      )}

      <div className="sticky bottom-20 z-30 lg:bottom-4">
        <button onClick={() => setPhase('done')}
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-volt py-4 font-display text-sm uppercase tracking-wide text-[#101405] shadow-[0_8px_30px_hsl(73_66%_58%/0.25)] transition-transform hover:scale-[1.01] active:scale-[0.98]">
          <Timer size={16} /> Concluir treino · {doneSets}/{totalSets} séries
        </button>
      </div>

      {rest !== null && <RestTimer seconds={rest} onClose={() => setRest(null)} />}
    </div>
  )
}
