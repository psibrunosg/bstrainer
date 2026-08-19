import { useState } from 'react'
import { ArrowLeft, CheckCircle2, FlaskConical } from 'lucide-react'
import { PLANS, FUNDAMENTOS, type Plan } from '../data/plans'
import { byId } from '../data/exercises'

const LEVEL_STYLE: Record<Plan['level'], string> = {
  Iniciante: 'bg-aqua/10 text-aqua',
  Intermediário: 'bg-volt/10 text-volt',
  Avançado: 'bg-destructive/10 text-destructive',
}

function PlanDetail({ plan, onBack, active, onSelect }: { plan: Plan; onBack: () => void; active: boolean; onSelect: () => void }) {
  return (
    <div className="space-y-6 animate-rise">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Todos os planos
      </button>

      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-[0.25em] ${LEVEL_STYLE[plan.level]}`}>{plan.level}</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">{plan.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Frequência', `${plan.daysPerWeek}x/sem`],
          ['Duração', `${plan.weeks} semanas`],
          ['Séries/músculo/sem', plan.weeklySets],
          ['RIR alvo', plan.rirTarget],
        ].map(([k, v]) => (
          <div key={k} className="card-surface rounded-3xl p-4">
            <p className="font-mono-num text-xl font-semibold text-volt">{v}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="card-surface rounded-3xl border-l-2 border-l-volt p-5">
        <p className="text-sm leading-relaxed"><span className="font-semibold text-volt">Progressão: </span>{plan.progression}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.goal}</p>
      </div>

      <div className="space-y-4">
        {plan.days.map((d) => (
          <section key={d.name} className="card-surface overflow-hidden rounded-3xl">
            <div className="border-b border-line bg-surface px-5 py-4">
              <h3 className="font-display text-lg">{d.name}</h3>
              <p className="text-xs text-muted-foreground">{d.focus}</p>
            </div>
            <div className="divide-y divide-line">
              {d.exercises.map((pe) => {
                const e = byId[pe.ex]
                return (
                  <div key={pe.ex} className="flex items-center gap-4 px-5 py-3">
                    <img src={e.gif} alt={e.name} loading="lazy" className="h-14 w-14 shrink-0 rounded-full border border-line bg-surface object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.muscle} · {e.kind}</p>
                    </div>
                    <div className="shrink-0 text-right font-mono-num text-xs">
                      <p className="text-sm font-semibold">{pe.sets} × {pe.reps}</p>
                      <p className="text-muted-foreground">RIR {pe.rir}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="card-surface rounded-3xl p-5">
        <h3 className="flex items-center gap-2 font-display text-lg"><FlaskConical size={18} className="text-aqua" /> Por que funciona</h3>
        <ul className="mt-3 space-y-2.5">
          {plan.science.map((s) => (
            <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 text-volt">→</span>{s}
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={onSelect}
        disabled={active}
        className={`w-full rounded-full py-4 font-display text-sm uppercase tracking-wide transition-all ${
          active ? 'cursor-default bg-surface-2 text-muted-foreground' : 'bg-volt text-[#101405] hover:scale-[1.01] active:scale-[0.98]'
        }`}
      >
        {active ? 'Plano ativo' : 'Ativar este plano'}
      </button>
    </div>
  )
}

export default function Plans({ activePlan, onSelect }: { activePlan: string; onSelect: (id: string) => void }) {
  const [detail, setDetail] = useState<string | null>(null)

  if (detail) {
    const plan = PLANS.find((p) => p.id === detail)!
    return <PlanDetail plan={plan} onBack={() => setDetail(null)} active={activePlan === plan.id} onSelect={() => onSelect(plan.id)} />
  }

  return (
    <div className="space-y-8">
            <div className="animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Mesociclos</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Planos de treino</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setDetail(p.id)}
            className="card-surface group relative overflow-hidden rounded-3xl p-5 text-left transition-transform hover:-translate-y-1 animate-rise"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {activePlan === p.id && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-volt/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-volt">
                <CheckCircle2 size={11} /> Ativo
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${LEVEL_STYLE[p.level]}`}>{p.level}</span>
            <h2 className="font-display mt-4 text-xl leading-tight">{p.name}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.tagline}</p>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono-num text-xs text-muted-foreground">
              <span>{p.daysPerWeek}x/sem</span>
              <span>{p.weeks} sem</span>
              <span className="text-volt">{p.weeklySets} séries</span>
            </div>
          </button>
        ))}
      </div>

      <section className="animate-rise" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center gap-2">
          <FlaskConical size={20} className="text-aqua" />
          <h2 className="font-display text-2xl">Fundamentos por trás dos planos</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Cada parâmetro dos planos sai destes princípios — não de achismo de academia.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {FUNDAMENTOS.map((f) => (
            <div key={f.title} className="card-surface rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-volt">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
