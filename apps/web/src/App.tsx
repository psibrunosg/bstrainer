import { useState } from 'react'
import { Routes, Route } from 'react-router'
import { LayoutDashboard, Dumbbell, CalendarRange, Library, TrendingUp, Users, Ruler, MessageCircle, UserCheck, Settings as SettingsIcon, Menu, X } from 'lucide-react'
import Dashboard from './sections/Dashboard'
import Workout from './sections/Workout'
import Plans from './sections/Plans'
import LibrarySection from './sections/Library'
import ProgressSection from './sections/Progress'
import Clients from './sections/Clients'
import Measurements from './sections/Measurements'
import Messages from './sections/Messages'
import Personal from './sections/Personal'
import Settings from './sections/Settings'
import Onboarding from './sections/Onboarding'
import Login from './sections/Login'

export type Tab =
  | 'inicio' | 'treino' | 'planos' | 'biblioteca' | 'progresso'
  | 'alunos' | 'medidas' | 'mensagens' | 'personal' | 'ajustes' | 'perfil'

const PRIMARY: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'inicio', label: 'Início', icon: LayoutDashboard },
  { id: 'treino', label: 'Treino', icon: Dumbbell },
  { id: 'planos', label: 'Planos', icon: CalendarRange },
  { id: 'biblioteca', label: 'Exercícios', icon: Library },
]

const MORE: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'progresso', label: 'Progresso', icon: TrendingUp },
  { id: 'medidas', label: 'Medidas', icon: Ruler },
  { id: 'mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'personal', label: 'Personal', icon: UserCheck },
  { id: 'alunos', label: 'Alunos', icon: Users },
  { id: 'ajustes', label: 'Ajustes', icon: SettingsIcon },
]

const ALL = [...PRIMARY, ...MORE]

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img src={`${import.meta.env.BASE_URL}lobo-movimento.png`} alt="BS Trainer" width={size} height={size}
        className="rounded-xl object-cover ring-1 ring-line" style={{ width: size, height: size }} />
      <div className="leading-none">
        <span className="font-display text-lg tracking-tight text-foreground">BS<span className="text-volt">TRAINER</span></span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Força · Movimento</span>
      </div>
    </div>
  )
}

function Shell() {
  const [tab, setTab] = useState<Tab>('inicio')
  const [activePlan, setActivePlan] = useState('upper-lower')
  const [moreOpen, setMoreOpen] = useState(false)
  const [chatWith, setChatWith] = useState<string | null>(null)

  const go = (t: Tab) => { setTab(t); setMoreOpen(false) }
  const goChat = (name: string) => { setChatWith(name); go('mensagens') }

  const moreActive = MORE.some((m) => m.id === tab)

  return (
    <div className="min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-6"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {ALL.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === id ? 'bg-volt/10 text-volt' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              }`}>
              <Icon size={18} strokeWidth={2.2} />{label}
            </button>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Semana 3 · Mesociclo 2</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-volt to-aqua" />
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-background/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Logo size={34} />
        <span className="font-mono-num text-xs text-muted-foreground">qua · 14 ago</span>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-60">
        <div className={`mx-auto px-4 pt-6 lg:px-10 lg:pt-10 ${tab === 'alunos' ? 'max-w-6xl' : 'max-w-5xl'}`}>
          {tab === 'inicio' && <Dashboard onStart={() => go('treino')} />}
          {tab === 'treino' && <Workout planId={activePlan} />}
          {tab === 'planos' && <Plans activePlan={activePlan} onSelect={setActivePlan} />}
          {tab === 'biblioteca' && <LibrarySection />}
          {tab === 'progresso' && <ProgressSection />}
          {tab === 'alunos' && <Clients onChat={goChat} />}
          {tab === 'medidas' && <Measurements />}
          {tab === 'mensagens' && <Messages initialName={chatWith} />}
          {tab === 'personal' && <Personal onChat={goChat} />}
          {tab === 'ajustes' && <Settings onEditProfile={() => go('perfil')} />}
          {tab === 'perfil' && <Onboarding onDone={() => go('inicio')} />}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {PRIMARY.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${tab === id ? 'text-volt' : 'text-muted-foreground'}`}>
              <Icon size={20} strokeWidth={2.2} />{label}
            </button>
          ))}
          <button onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${moreActive ? 'text-volt' : 'text-muted-foreground'}`}>
            <Menu size={20} strokeWidth={2.2} />Mais
          </button>
        </div>
      </nav>

      {/* Menu "Mais" mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full rounded-t-3xl border-t border-line bg-surface p-5 pb-8 animate-rise" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg">Mais</p>
              <button onClick={() => setMoreOpen(false)} className="rounded-full border border-line p-2 text-muted-foreground"><X size={15} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => go(id)}
                  className={`flex flex-col items-center gap-2 rounded-3xl border py-4 text-xs font-medium transition-colors ${
                    tab === id ? 'border-volt/40 bg-volt/10 text-volt' : 'border-line text-muted-foreground'
                  }`}>
                  <Icon size={20} />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <Routes>
      <Route path="/" element={<Shell />} />
      <Route path="*" element={<Shell />} />
    </Routes>
  )
}
