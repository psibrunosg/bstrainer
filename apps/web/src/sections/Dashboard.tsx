import { Play, Battery, Zap, Activity, Flame, Trophy } from 'lucide-react'
import { useState } from 'react'
import { PLANS } from '../data/plans'
import { byId } from '../data/exercises'

const NEXT_MILESTONES = [
  { name: 'Supino Reto', current: '80kg', target: '82kg', type: 'Carga' },
  { name: 'Desenvolvimento', current: '10 reps', target: '12 reps', type: 'Resistência' },
]

export default function Dashboard({ onStart }: { onStart: () => void }) {
  const plan = PLANS.find((p) => p.id === 'upper-lower')!
  const today = plan.days[0]
  
  const [readiness, setReadiness] = useState<'low' | 'normal' | 'high' | null>(null)

  return (
    <div className="space-y-6 pb-6">
      <div className="animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Quarta, 14 ago</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">
            Bora, Bruno.
          </h1>
        </div>
        
        {/* Readiness Check-in */}
        <div className="flex bg-surface border border-line rounded-full p-1 gap-1">
          <button 
            onClick={() => setReadiness('low')}
            className={`p-2 rounded-full transition-colors ${readiness === 'low' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Battery size={16} />
          </button>
          <button 
            onClick={() => setReadiness('normal')}
            className={`p-2 rounded-full transition-colors ${readiness === 'normal' ? 'bg-volt/20 text-volt' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Zap size={16} />
          </button>
          <button 
            onClick={() => setReadiness('high')}
            className={`p-2 rounded-full transition-colors ${readiness === 'high' ? 'bg-aqua/20 text-aqua' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      {/* SUPER CARD: Treino de Hoje (Dominance) */}
      <section className="card-surface grain relative overflow-hidden rounded-[2rem] p-6 lg:p-8 animate-rise shadow-2xl" style={{ animationDelay: '60ms' }}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-volt/20 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-volt">
            Treino de hoje
          </span>
          <h2 className="font-display mt-3 text-4xl lg:text-5xl">{today.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {today.focus} · {today.exercises.length} exercícios · ~60 min
          </p>
          
          <button
            onClick={onStart}
            className="mt-8 w-full max-w-sm group flex items-center justify-center gap-3 rounded-full bg-volt px-8 py-5 font-display text-lg uppercase tracking-wider text-[#101405] transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(202,255,0,0.3)]"
          >
            <Play size={20} className="fill-current" /> Iniciar Treino
          </button>
        </div>

        {/* Preview dos exercícios */}
        <div className="relative z-10 mt-10 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {today.exercises.map((pe) => {
            const e = byId[pe.ex]
            return (
              <div key={pe.ex} className="w-20 shrink-0 opacity-80 transition-opacity hover:opacity-100">
                <div className="overflow-hidden rounded-xl border border-line bg-background">
                  <img src={e.gif} alt={e.name} loading="lazy" className="aspect-square w-full object-cover grayscale mix-blend-screen" />
                </div>
                <p className="mt-1.5 truncate text-[10px] font-medium text-muted-foreground">{e.name}</p>
                <p className="font-mono-num text-[9px] text-volt">{pe.sets} × {pe.reps}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Streak e Marcos (Substituindo o gráfico genérico) */}
      <div className="grid gap-4 lg:grid-cols-2 animate-rise" style={{ animationDelay: '120ms' }}>
        
        {/* Streak */}
        <section className="card-surface rounded-3xl p-5 flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <Flame size={28} />
          </div>
          <div>
            <p className="font-mono-num text-3xl font-semibold">12<span className="text-sm font-normal text-muted-foreground ml-1">dias</span></p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Sequência invicta</p>
          </div>
        </section>

        {/* Marcos / PRs Próximos */}
        <section className="card-surface rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-aqua" />
            <h3 className="font-display text-base">Alvos de Hoje</h3>
          </div>
          <div className="space-y-3">
            {NEXT_MILESTONES.map((m) => (
              <div key={m.name} className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">Último: {m.current}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-sm text-volt">{m.target}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.type}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  )
}
