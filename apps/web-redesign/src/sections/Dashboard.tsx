import { Flame, Play, ChevronRight, CalendarCheck, Weight, Repeat } from 'lucide-react'
import { PLANS } from '../data/plans'
import { byId } from '../data/exercises'

const WEEK = [
  { d: 'seg', v: 16.2 }, { d: 'ter', v: 0 }, { d: 'qua', v: 18.4 },
  { d: 'qui', v: 14.1 }, { d: 'sex', v: 0 }, { d: 'sáb', v: 12.8 }, { d: 'dom', v: 0 },
]
const NEXT = [
  { day: 'Amanhã', name: 'Lower A', focus: 'Quadríceps' },
  { day: 'Sex', name: 'Upper B', focus: 'Costas' },
  { day: 'Sáb', name: 'Lower B', focus: 'Posteriores' },
]

export default function Dashboard({ onStart }: { onStart: () => void }) {
  const plan = PLANS.find((p) => p.id === 'upper-lower')!
  const today = plan.days[0]

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Quarta-feira, 14 de agosto</p>
        <h1 className="font-display mt-1 text-3xl lg:text-4xl">
          Bora, Bruno. <span className="text-gradient-volt">Dia de Upper.</span>
        </h1>
      </div>

      {/* Treino de hoje */}
      <section className="card-surface grain relative overflow-hidden rounded-3xl p-5 lg:p-7 animate-rise" style={{ animationDelay: '60ms' }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-volt/10 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-volt/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-volt">
              <CalendarCheck size={12} /> Treino de hoje
            </span>
            <h2 className="font-display mt-3 text-2xl lg:text-3xl">{today.name} — {today.focus}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {today.exercises.length} exercícios · ~{today.exercises.reduce((a, e) => a + e.sets, 0)} séries · Plano {plan.name}, semana 3 de {plan.weeks}
            </p>
          </div>
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2 rounded-2xl bg-volt px-6 py-3.5 font-display text-sm uppercase tracking-wide text-[#101405] transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Play size={16} className="fill-current" /> Iniciar treino
          </button>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
          {today.exercises.slice(0, 5).map((pe) => {
            const e = byId[pe.ex]
            return (
              <div key={pe.ex} className="w-28 shrink-0">
                <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <img src={e.gif} alt={e.name} loading="lazy" className="aspect-square w-full object-cover" />
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-tight text-muted-foreground">{e.name}</p>
                <p className="font-mono-num text-[10px] text-volt">{pe.sets} × {pe.reps}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 animate-rise" style={{ animationDelay: '120ms' }}>
        {[
          { icon: Flame, label: 'Sequência', value: '12', unit: 'dias' },
          { icon: Weight, label: 'Volume na semana', value: '18,4', unit: 'ton' },
          { icon: Repeat, label: 'Sessões', value: '4/4', unit: 'na semana' },
        ].map(({ icon: Icon, label, value, unit }) => (
          <div key={label} className="card-surface rounded-2xl p-4">
            <Icon size={16} className="text-aqua" />
            <p className="font-mono-num mt-3 text-2xl font-semibold lg:text-3xl">
              {value}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-5">
        {/* Volume semanal */}
        <section className="card-surface rounded-2xl p-5 lg:col-span-3 animate-rise" style={{ animationDelay: '180ms' }}>
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg">Volume da semana</h3>
            <span className="font-mono-num text-xs text-muted-foreground">toneladas/dia</span>
          </div>
          <div className="mt-5 flex h-32 items-end gap-2 lg:gap-3">
            {WEEK.map(({ d, v }) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full overflow-hidden rounded-md bg-surface-2" style={{ height: 96 }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-md transition-all ${v > 0 ? 'bg-gradient-to-t from-aqua/60 to-volt' : ''}`}
                    style={{ height: `${(v / 20) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Próximos */}
        <section className="card-surface rounded-2xl p-5 lg:col-span-2 animate-rise" style={{ animationDelay: '240ms' }}>
          <h3 className="font-display text-lg">Próximos treinos</h3>
          <div className="mt-4 space-y-2">
            {NEXT.map((n) => (
              <button key={n.name} className="group flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-volt/40">
                <div>
                  <p className="text-sm font-semibold">{n.name}</p>
                  <p className="text-xs text-muted-foreground">{n.day} · {n.focus}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-volt" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
