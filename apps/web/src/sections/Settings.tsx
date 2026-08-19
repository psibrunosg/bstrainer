import { useState } from 'react'
import { Bell, ChevronRight, LogOut, Moon, Shield, UserRound } from 'lucide-react'

function Row({ icon: Icon, label, desc, onClick, danger }: {
  icon: typeof Bell; label: string; desc?: string; onClick?: () => void; danger?: boolean
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2/40">
      <Icon size={17} className={danger ? 'text-destructive' : 'text-aqua'} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-destructive' : ''}`}>{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <ChevronRight size={15} className="text-muted-foreground" />
    </button>
  )
}

export default function Settings({ onEditProfile }: { onEditProfile: () => void }) {
  const [pro, setPro] = useState(false)
  const [notifs, setNotifs] = useState(true)

  return (
    <div className="space-y-6">
            <div className="animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Preferências</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Ajustes</h1>
        </div>
      </div>

      <section className="card-surface flex items-center gap-4 rounded-3xl p-5 animate-rise" style={{ animationDelay: '60ms' }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 font-display text-lg font-bold text-volt ring-1 ring-line">BS</div>
        <div className="flex-1">
          <p className="font-display text-lg">Bruno de Souza</p>
          <p className="text-xs text-muted-foreground">Aluno · Plano Hipertrofia Upper/Lower · desde jun/2026</p>
        </div>
        <span className="rounded-full bg-volt/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-volt">Pro</span>
      </section>

      <div className="card-surface divide-y divide-line overflow-hidden rounded-3xl animate-rise" style={{ animationDelay: '120ms' }}>
        <Row icon={UserRound} label="Perfil de treino" desc="Objetivo, nível, equipamentos e dias por semana" onClick={onEditProfile} />
        <Row icon={Bell} label="Notificações" desc={notifs ? 'Lembretes de treino ativos' : 'Desativadas'} onClick={() => setNotifs(!notifs)} />
        <Row icon={Moon} label="Aparência" desc="Tema noturno (padrão do app)" />
        <Row icon={Shield} label="Privacidade" desc="Quem vê seu progresso" />
      </div>

      <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">Atender alunos</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Ative para aparecer na busca e receber pedidos de acompanhamento.</p>
          </div>
          <button onClick={() => setPro(!pro)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${pro ? 'bg-volt' : 'bg-surface-2 ring-1 ring-line'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${pro ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {pro && <p className="mt-3 rounded-xl bg-volt/10 p-3 text-xs font-medium text-volt">Seu perfil agora aparece para novos alunos.</p>}
      </section>

      <button className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/40 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 animate-rise" style={{ animationDelay: '240ms' }}>
        <LogOut size={15} /> Sair da conta
      </button>
    </div>
  )
}
