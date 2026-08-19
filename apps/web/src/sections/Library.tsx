import { useEffect, useMemo, useState } from 'react'
import { Search, X, Dumbbell, Loader2 } from 'lucide-react'
import { fetchExercises, type DbExercise, type Muscle } from '../lib/supabase'
import { MUSCLES } from '../data/exercises'

function ExerciseModal({ ex, onClose }: { ex: DbExercise; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm lg:items-center" onClick={onClose}>
      <div className="card-surface max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 lg:rounded-3xl animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-aqua/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-aqua">{ex.muscle}</span>
            <h2 className="font-display mt-3 text-2xl leading-tight">{ex.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ex.equipment}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-line p-2 text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        {ex.gif ? (
          <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-surface">
            <img src={ex.gif} alt={ex.name} className="aspect-square w-full object-cover" />
          </div>
        ) : (
          <div className="mt-5 flex aspect-video items-center justify-center rounded-3xl border border-line bg-surface text-muted-foreground">
            <Dumbbell size={28} />
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {ex.musclesRaw.map((m) => (
            <span key={m} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 24

export default function LibrarySection() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'Todos'>('Todos')
  const [items, setItems] = useState<DbExercise[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sel, setSel] = useState<DbExercise | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchExercises({ search: debounced, muscle, page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return
        setItems((prev) => (page === 0 ? r.items : [...prev, ...r.items]))
        setTotal(r.total)
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [debounced, muscle, page])

  useEffect(() => { setPage(0) }, [debounced, muscle])

  const hasMore = useMemo(() => items.length < total, [items.length, total])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-rise">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Catálogo</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Biblioteca de exercícios</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-aqua">
          <span className="h-1.5 w-1.5 rounded-full bg-volt animate-pulse-soft" /> Supabase ao vivo
        </span>
      </div>

      <div className="relative animate-rise" style={{ animationDelay: '60ms' }}>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar exercício…"
          className="w-full rounded-3xl border border-line bg-surface py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-volt/60"
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

      {error && (
        <p className="card-surface rounded-3xl p-5 text-sm text-destructive animate-rise">
          Não consegui falar com o Supabase agora. Verifique a conexão e tente de novo.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setSel(e)}
            className="card-surface group overflow-hidden rounded-3xl text-left transition-transform hover:-translate-y-1 animate-rise"
            style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 12) * 30}ms` }}
          >
            <div className="relative aspect-square overflow-hidden bg-surface">
              {e.gif ? (
                <img src={e.gif} alt={e.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/40"><Dumbbell size={26} /></div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-volt backdrop-blur-sm">{e.muscle}</span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{e.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{e.equipment}</p>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin text-volt" /> Carregando exercícios…
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">Nenhum exercício encontrado.</p>
      )}

      {!loading && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full rounded-3xl border border-line py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-volt/50 hover:text-foreground"
        >
          Carregar mais ({items.length} de {total})
        </button>
      )}

      {sel && <ExerciseModal ex={sel} onClose={() => setSel(null)} />}
    </div>
  )
}
