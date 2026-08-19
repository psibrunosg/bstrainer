import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'

interface Msg { id: number; mine: boolean; body: string; time: string }
interface Thread { id: string; name: string; role: string; unread: number; preview: string; messages: Msg[] }

const THREADS: Thread[] = [
  {
    id: '1', name: 'Marcos Silva (Personal)', role: 'Seu treinador', unread: 1,
    preview: 'Manda o vídeo do agachamento que eu analiso hoje',
    messages: [
      { id: 1, mine: false, body: 'Bom dia! Como foi o Upper A de ontem?', time: '08:12' },
      { id: 2, mine: true, body: 'Foi bem! Subi pra 55kg no supino e fechei todas as séries', time: '08:20' },
      { id: 3, mine: false, body: 'Boa. Sentiu o ombro em algum momento?', time: '08:21' },
      { id: 4, mine: true, body: 'Só um leve desconforto no inclinado, última série', time: '08:24' },
      { id: 5, mine: false, body: 'Beleza, vou trocar o inclinado pela pegada neutra na próxima semana. Manda o vídeo do agachamento que eu analiso hoje', time: '08:25' },
    ],
  },
  {
    id: '2', name: 'Nutri — Dra. Aline', role: 'Parceira do plano', unread: 0,
    preview: 'Cardápio da semana atualizado no seu perfil',
    messages: [
      { id: 1, mine: false, body: 'Cardápio da semana atualizado no seu perfil', time: 'seg' },
      { id: 2, mine: true, body: 'Valeu! Aumentou o carbo do pré-treino?', time: 'seg' },
    ],
  },
]

export default function Messages({ initialName }: { initialName?: string | null }) {
  const [open, setOpen] = useState<Thread | null>(
    initialName ? (THREADS.find((t) => t.name.includes(initialName.split(' ')[0])) ?? THREADS[0]) : null,
  )
  const [threads, setThreads] = useState(THREADS)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [open?.messages.length])

  function send() {
    const body = draft.trim()
    if (!body || !open) return
    const msg: Msg = { id: Date.now(), mine: true, body, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    const updated = threads.map((t) => (t.id === open.id ? { ...t, messages: [...t.messages, msg], preview: body, unread: 0 } : t))
    setThreads(updated)
    setOpen(updated.find((t) => t.id === open.id)!)
    setDraft('')
  }

  if (open) {
    return (
      <div className="flex h-[calc(100dvh-12rem)] flex-col lg:h-[calc(100dvh-10rem)] animate-rise">
        <div className="flex items-center gap-3 border-b border-line pb-3">
          <button onClick={() => setOpen(null)} className="rounded-full border border-line p-2 text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="font-display text-lg leading-tight">{open.name}</h1>
            <p className="text-[11px] text-muted-foreground">{open.role}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2.5 overflow-y-auto py-4">
          {open.messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
              m.mine ? 'ml-auto rounded-br-md bg-volt/15 text-foreground' : 'rounded-bl-md border border-line bg-surface'
            }`}>
              {m.body}
              <span className="mt-1 block text-right font-mono-num text-[10px] text-muted-foreground">{m.time}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 border-t border-line pt-3">
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Escrever…"
            className="h-12 flex-1 rounded-3xl border border-line bg-surface px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-volt/60" />
          <button onClick={send} disabled={!draft.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-volt text-[#101405] transition-transform active:scale-95 disabled:opacity-40">
            <Send size={17} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
            <div className="animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Comunicação</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Mensagens</h1>
        </div>
      </div>
      <div className="card-surface divide-y divide-line overflow-hidden rounded-3xl animate-rise" style={{ animationDelay: '80ms' }}>
        {threads.map((t) => (
          <button key={t.id} onClick={() => setOpen({ ...t, unread: 0 })} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-surface-2/40">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-bold text-aqua ring-1 ring-line">
              {t.name.split(' ').filter((w) => /^[A-Z]/.test(w)).map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.name}</p>
              <p className="truncate text-xs text-muted-foreground">{t.preview}</p>
            </div>
            {t.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-volt px-1.5 font-mono-num text-[10px] font-bold text-[#101405]">{t.unread}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
