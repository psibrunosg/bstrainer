import { useState } from 'react'
import { UserPlus, AlertTriangle, MessageCircle, TrendingUp, ClipboardList, Check, X, RefreshCw, ChevronRight } from 'lucide-react'

interface Client {
  id: string
  name: string
  plan: string
  adherence: number // %
  lastSession: string
  status: 'active' | 'invited' | 'requested'
  email?: string
  alerts: { kind: 'warn' | 'info'; text: string }[]
}

const CLIENTS: Client[] = [
  {
    id: '1', name: 'Marina Duarte', plan: 'Hipertrofia Upper/Lower', adherence: 92, lastSession: 'ontem', status: 'active',
    alerts: [{ kind: 'info', text: 'Atingiu o topo da faixa no supino 2x seguidas — hora de subir carga' }],
  },
  {
    id: '2', name: 'Rafael Pires', plan: 'Base Sólida', adherence: 55, lastSession: 'há 6 dias', status: 'active',
    alerts: [{ kind: 'warn', text: 'Sem treinar há 6 dias — risco de abandono' }],
  },
  {
    id: '3', name: 'Camila Sosa', plan: 'PPL 6x', adherence: 88, lastSession: 'hoje', status: 'active',
    alerts: [{ kind: 'warn', text: 'RIR 0 em 4 sessões seguidas — fadiga acumulando, considere deload' }],
  },
  {
    id: '4', name: 'João Terra', plan: 'Base Sólida', adherence: 71, lastSession: 'há 2 dias', status: 'active',
    alerts: [],
  },
  { id: '5', name: 'Pedro Lima', plan: '—', adherence: 0, lastSession: '—', status: 'requested', email: 'pedro@email.com', alerts: [] },
  { id: '6', name: '—', plan: '—', adherence: 0, lastSession: '—', status: 'invited', email: 'aluna.nova@gmail.com', alerts: [] },
]

export default function Clients({ onChat }: { onChat: (name: string) => void }) {
  const [links, setLinks] = useState(CLIENTS)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const active = links.filter((l) => l.status === 'active')
  const requests = links.filter((l) => l.status === 'requested')
  const invited = links.filter((l) => l.status === 'invited')
  const allAlerts = active.flatMap((c) => c.alerts.map((a) => ({ ...a, name: c.name })))

  function invite() {
    if (!email.includes('@')) return
    setLinks((p) => [...p, { id: String(Date.now()), name: '—', plan: '—', adherence: 0, lastSession: '—', status: 'invited', email, alerts: [] }])
    setEmail('')
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-rise">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Workspace profissional</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Painel de alunos</h1>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-2.5 font-mono-num text-xs">
          <span>{active.length} ativos</span>
          <span className="text-line">·</span>
          <span className={allAlerts.length ? 'text-destructive' : 'text-volt'}>{allAlerts.length} alertas</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Convidar */}
          <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '60ms' }}>
            <h2 className="font-display text-lg">Convidar aluno</h2>
            <p className="text-xs text-muted-foreground">O vínculo é ativado assim que a pessoa entrar no app.</p>
            <div className="mt-3 flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email.do.aluno@gmail.com"
                className="h-12 flex-1 rounded-xl border border-line bg-surface px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-volt/60" />
              <button onClick={invite} className="flex h-12 items-center gap-2 rounded-full bg-volt px-5 text-sm font-semibold text-[#101405] transition-transform active:scale-95">
                <UserPlus size={16} /> Convidar
              </button>
            </div>
            {sent && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-volt"><Check size={13} /> Convite registrado</p>}
          </section>

          {/* Solicitações */}
          {requests.length > 0 && (
            <section className="space-y-2 animate-rise" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Pedidos de acompanhamento · {requests.length}</h2>
              {requests.map((r) => (
                <div key={r.id} className="card-surface flex items-center justify-between gap-3 rounded-3xl border-volt/20 p-4">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setLinks((p) => p.map((l) => (l.id === r.id ? { ...l, status: 'active' as const, plan: 'Base Sólida' } : l)))}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-volt px-4 text-xs font-bold text-[#101405] active:scale-95"><Check size={14} /> Aceitar</button>
                    <button onClick={() => setLinks((p) => p.filter((l) => l.id !== r.id))}
                      className="flex h-9 items-center rounded-xl border border-line px-3 text-xs text-muted-foreground hover:text-destructive"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Ativos */}
          <section className="space-y-2 animate-rise" style={{ animationDelay: '140ms' }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Alunos ativos · {active.length}</h2>
            <div className="card-surface divide-y divide-line overflow-hidden rounded-3xl">
              {active.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-surface-2/40">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-bold text-volt ring-1 ring-line">
                    {c.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.plan} · último treino {c.lastSession}</p>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="flex justify-between text-[10px] text-muted-foreground"><span>Adesão</span><span className="font-mono-num">{c.adherence}%</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${c.adherence >= 80 ? 'bg-volt' : c.adherence >= 60 ? 'bg-aqua' : 'bg-destructive'}`} style={{ width: `${c.adherence}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted-foreground transition-colors hover:border-volt/50 hover:text-volt" title="Fichas"><ClipboardList size={15} /></button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted-foreground transition-colors hover:border-volt/50 hover:text-volt" title="Progresso"><TrendingUp size={15} /></button>
                    <button onClick={() => onChat(c.name)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/10 text-volt transition-colors hover:bg-volt hover:text-[#101405]" title="Chat"><MessageCircle size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Convites pendentes */}
          {invited.length > 0 && (
            <section className="space-y-2 animate-rise" style={{ animationDelay: '180ms' }}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Convites pendentes · {invited.length}</h2>
              {invited.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-3xl border border-line bg-surface px-4 py-3 text-sm">
                  <span>{i.email}</span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted-foreground">Aguardando cadastro</span>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Alertas por exceção */}
        <aside className="space-y-3 animate-rise lg:sticky lg:top-6 lg:self-start" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Alertas por exceção</h2>
            <RefreshCw size={14} className="text-muted-foreground" />
          </div>
          {allAlerts.length === 0 && <p className="card-surface rounded-3xl p-5 text-sm text-muted-foreground">Nenhuma exceção hoje. Todo mundo no trilho.</p>}
          {allAlerts.map((a, i) => (
            <div key={i} className={`card-surface rounded-3xl border-l-2 p-4 ${a.kind === 'warn' ? 'border-l-destructive' : 'border-l-aqua'}`}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={14} className={a.kind === 'warn' ? 'text-destructive' : 'text-aqua'} />
                {a.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.text}</p>
              <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-volt">Intervir <ChevronRight size={12} /></button>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
