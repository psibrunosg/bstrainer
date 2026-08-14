import { useState } from 'react'
import { BadgeCheck, MessageCircle, Star } from 'lucide-react'

const TRAINERS = [
  { id: '1', name: 'Marcos Silva', bio: 'Hipertrofia e reabilitação de ombro. 8 anos de caixa e laboratório.', rating: 4.9, students: 42 },
  { id: '2', name: 'Fernanda Ruiz', bio: 'Força para mulheres e preparação para powerlifting.', rating: 5.0, students: 31 },
  { id: '3', name: 'Diego Antunes', bio: 'Emagrecimento com musculação, foco em constância.', rating: 4.8, students: 57 },
]

export default function Personal({ onChat }: { onChat: (name: string) => void }) {
  const [active] = useState(TRAINERS[0])
  const [requested, setRequested] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-volt">Acompanhamento</p>
        <h1 className="font-display mt-1 text-3xl lg:text-4xl">Seu personal</h1>
        <p className="mt-1 text-muted-foreground">Treine solo quando quiser — e peça olho profissional quando fizer sentido.</p>
      </div>

      {active && (
        <section className="card-surface grain relative overflow-hidden rounded-3xl border-volt/25 p-6 animate-rise" style={{ animationDelay: '60ms' }}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-volt/10 blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-volt">Acompanhamento ativo</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 font-display text-lg font-bold text-volt ring-1 ring-volt/30">
                {active.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h2 className="font-display text-xl">{active.name} <BadgeCheck size={16} className="inline text-aqua" /></h2>
                <p className="text-xs text-muted-foreground">{active.students} alunos · ★ {active.rating}</p>
              </div>
            </div>
            <button onClick={() => onChat(active.name)} className="flex items-center gap-2 rounded-2xl bg-volt px-5 py-3 text-sm font-semibold text-[#101405] active:scale-95">
              <MessageCircle size={15} /> Conversar
            </button>
          </div>
        </section>
      )}

      <section className="space-y-3 animate-rise" style={{ animationDelay: '120ms' }}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Disponíveis para acompanhar</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TRAINERS.filter((t) => t.id !== active.id).map((t) => (
            <article key={t.id} className="card-surface rounded-2xl p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 font-display font-bold text-aqua ring-1 ring-line">
                {t.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <h3 className="font-display mt-3 text-lg">{t.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star size={11} className="fill-volt text-volt" /> {t.rating} · {t.students} alunos</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.bio}</p>
              <button
                onClick={() => setRequested(t.id)}
                disabled={requested === t.id}
                className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  requested === t.id ? 'cursor-default bg-surface-2 text-volt' : 'bg-volt text-[#101405]'
                }`}>
                {requested === t.id ? 'Solicitação enviada ✓' : 'Pedir acompanhamento'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
