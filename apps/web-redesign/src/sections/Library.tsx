import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { EXERCISES, MUSCLES, type Exercise, type Muscle } from '../data/exercises'

function ExerciseModal({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm lg:items-center" onClick={onClose}>
      <div className="card-surface max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 lg:rounded-3xl animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-aqua/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-aqua">{ex.muscle} · {ex.kind}</span>
            <h2 className="font-display mt-3 text-2xl leading-tight">{ex.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ex.equipment}{ex.secondary ? ` · também recruta ${ex.secondary.join(', ')}` : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-line p-2 text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
          <img src={ex.gif} alt={ex.name} className="aspect-square w-full object-cover" />
        </div>
        <h3 className="font-display mt-5 text-sm uppercase tracking-widest text-muted-foreground">Execução</h3>
        <ul className="mt-3 space-y-2.5">
          {ex.cues.map((c, i) => (
            <li key={c} className="flex gap-3 text-sm leading-relaxed">
              <span className="font-mono-num font-semibold text-volt">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-muted-foreground">{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function LibrarySection() {
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'Todos'>('Todos')
  const [sel, setSel] = useState<Exercise | null>(null)

  const list = useMemo(
    () => EXERCISES.filter(
      (e) =>
        (muscle === 'Todos' || e.muscle === muscle) &&
        e.name.toLowerCase().includes(q.toLowerCase()),
    ),
    [q, muscle],
  )

  return (
    <div className="space-y-5">
      <div className="animate-rise">
        <h1 className="font-display text-3xl lg:text-4xl">Biblioteca de exercícios</h1>
        <p className="mt-1 text-muted-foreground">Execução em movimento, dicas de técnica e grupo muscular.</p>
      </div>

      <div className="relative animate-rise" style={{ animationDelay: '60ms' }}>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar exercício…"
          className="w-full rounded-2xl border border-line bg-surface py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-volt/60"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 animate-rise" style={{ animationDelay: '120ms' }}>
        {(['Todos', ...MUSCLES] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              muscle === m ? 'bg-volt text-[#101405]' : 'border border-line text-muted-foreground hover:text-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {list.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setSel(e)}
            className="card-surface group overflow-hidden rounded-2xl text-left transition-transform hover:-translate-y-1 animate-rise"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <div className="relative overflow-hidden">
              <img src={e.gif} alt={e.name} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-volt backdrop-blur-sm">{e.muscle}</span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{e.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{e.equipment} · {e.kind}</p>
            </div>
          </button>
        ))}
      </div>
      {list.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">Nenhum exercício encontrado.</p>
      )}

      {sel && <ExerciseModal ex={sel} onClose={() => setSel(null)} />}
    </div>
  )
}
