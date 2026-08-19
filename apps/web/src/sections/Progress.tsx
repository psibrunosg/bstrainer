import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, Medal, CalendarCheck, Target, Zap } from 'lucide-react'

const XP = { level: 7, into: 340, next: 500 }
const STRENGTH = { overall: 62, lifts: [['Supino', 58], ['Agachamento', 66], ['Terra', 61], ['Barra fixa', 55]] as const }
const BADGES = [
  { label: '4 semanas seguidas', earned: true },
  { label: '100 sessões', earned: true },
  { label: 'Primeiro PR duplo', earned: true },
  { label: 'Club dos 100kg', earned: false },
  { label: 'Deload respeitado', earned: true },
  { label: '12 semanas sem falta', earned: false },
]
const GOALS = [
  { label: 'Supino 60kg', current: 55, target: 60, unit: 'kg' },
  { label: 'Frequência 4x/semana', current: 4, target: 4, unit: 'x' },
  { label: 'Agachamento 100kg', current: 70, target: 100, unit: 'kg' },
]

const VOLUME = [
  { s: 'S1', v: 42 }, { s: 'S2', v: 48 }, { s: 'S3', v: 45 },
  { s: 'S4', v: 52 }, { s: 'S5', v: 55 }, { s: 'S6', v: 61 },
]
const CARGA = [
  { s: 'S1', supino: 60, agach: 80, terra: 100 },
  { s: 'S2', supino: 62.5, agach: 82.5, terra: 105 },
  { s: 'S3', supino: 62.5, agach: 85, terra: 107.5 },
  { s: 'S4', supino: 65, agach: 87.5, terra: 110 },
  { s: 'S5', supino: 67.5, agach: 90, terra: 115 },
  { s: 'S6', supino: 70, agach: 92.5, terra: 117.5 },
]
const PRS = [
  { ex: 'Agachamento livre', val: '92,5 kg', delta: '+2,5' },
  { ex: 'Supino reto', val: '70 kg', delta: '+2,5' },
  { ex: 'Terra romeno', val: '117,5 kg', delta: '+5' },
  { ex: 'Barra fixa', val: '8 reps', delta: '+1' },
]
const WEEKS = Array.from({ length: 12 }, (_, i) =>
  [true, true, false, true, true, true, false, true, true, true, true, i === 11 ? true : true][i]
    ? Math.min(4, 2 + ((i * 7) % 3))
    : 0,
)

const tooltipStyle = {
  backgroundColor: 'hsl(152 13% 9%)',
  border: '1px solid hsl(152 12% 14%)',
  borderRadius: 12,
  fontSize: 12,
}

export default function ProgressSection() {
  return (
    <div className="space-y-6">
            <div className="animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Estatísticas</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Progresso</h1>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 animate-rise" style={{ animationDelay: '60ms' }}>
        {/* Nível XP */}
        <section className="card-surface grain relative overflow-hidden rounded-3xl p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-aqua/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"><Zap size={13} className="text-volt" /> Nível {XP.level}</span>
            <span className="font-mono-num text-xs text-muted-foreground">{XP.into}/{XP.next} XP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-gradient-to-r from-aqua to-volt" style={{ width: `${(XP.into / XP.next) * 100}%` }} />
          </div>
        </section>

        {/* Strength score */}
        <section className="card-surface rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Strength Score</span>
            <span className="font-mono-num font-display text-3xl font-bold text-volt">{STRENGTH.overall}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STRENGTH.lifts.map(([k, v]) => (
              <span key={k} className="rounded-full border border-line bg-surface px-2.5 py-1 font-mono-num text-[11px] text-muted-foreground">{k}: <span className="text-foreground">{v}</span></span>
            ))}
          </div>
        </section>
      </div>

      {/* Badges + Metas */}
      <div className="grid gap-3 lg:grid-cols-2 animate-rise" style={{ animationDelay: '90ms' }}>
        <section className="card-surface rounded-3xl p-5">
          <h3 className="font-display text-lg">Conquistas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <span key={b.label} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                b.earned ? 'border-volt/30 bg-volt/10 text-volt' : 'border-line bg-surface text-muted-foreground opacity-50'
              }`}>{b.label}</span>
            ))}
          </div>
        </section>
        <section className="card-surface rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Metas</h3>
            <Target size={15} className="text-aqua" />
          </div>
          <div className="mt-3 space-y-3">
            {GOALS.map((g) => {
              const p = Math.min(100, Math.round((g.current / g.target) * 100))
              return (
                <div key={g.label}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{g.label}</span>
                    <span className="font-mono-num text-muted-foreground">{g.current}/{g.target}{g.unit}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className={`h-full rounded-full ${p >= 100 ? 'bg-volt' : 'bg-aqua'}`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-3 gap-3 animate-rise" style={{ animationDelay: '100ms' }}>
        {[
          { icon: TrendingUp, label: 'Volume total', value: '303t' },
          { icon: Medal, label: 'PRs no ciclo', value: '7' },
          { icon: CalendarCheck, label: 'Adesão', value: '92%' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card-surface rounded-3xl p-4">
            <Icon size={16} className="text-aqua" />
            <p className="font-mono-num mt-3 text-2xl font-semibold lg:text-3xl">{value}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '120ms' }}>
        <h3 className="font-display text-lg">Carga estimada nos básicos</h3>
        <p className="text-xs text-muted-foreground">Top set de trabalho, kg</p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CARGA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gTerra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(73 66% 58%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(73 66% 58%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAgach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(172 70% 52%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(172 70% 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="s" tick={{ fill: 'hsl(140 6% 56%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(140 6% 56%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="terra" name="Terra" stroke="hsl(73 66% 58%)" strokeWidth={2.5} fill="url(#gTerra)" />
              <Area type="monotone" dataKey="agach" name="Agachamento" stroke="hsl(172 70% 52%)" strokeWidth={2.5} fill="url(#gAgach)" />
              <Area type="monotone" dataKey="supino" name="Supino" stroke="hsl(140 6% 56%)" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '180ms' }}>
          <h3 className="font-display text-lg">Volume semanal</h3>
          <p className="text-xs text-muted-foreground">Toneladas por semana</p>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VOLUME} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="s" tick={{ fill: 'hsl(140 6% 56%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(140 6% 56%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(152 13% 12%)' }} />
                <Bar dataKey="v" name="Volume (t)" fill="hsl(172 70% 52%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '240ms' }}>
          <h3 className="font-display text-lg">Recordes recentes</h3>
          <div className="mt-3 divide-y divide-line">
            {PRS.map((p) => (
              <div key={p.ex} className="flex items-center justify-between py-3">
                <span className="text-sm">{p.ex}</span>
                <span className="font-mono-num text-sm">
                  <span className="font-semibold">{p.val}</span>
                  <span className="ml-2 text-xs text-volt">{p.delta}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '300ms' }}>
        <h3 className="font-display text-lg">Consistência — 12 semanas</h3>
        <div className="mt-4 grid grid-cols-12 gap-1.5">
          {WEEKS.map((n, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="aspect-square w-full rounded-md"
                style={{
                  backgroundColor: n === 0 ? 'hsl(152 13% 9%)' : n === 2 ? 'hsl(172 70% 52% / 0.35)' : n === 3 ? 'hsl(172 70% 52% / 0.65)' : 'hsl(73 66% 58%)',
                }}
                title={`${n} sessões`}
              />
              <span className="text-[9px] text-muted-foreground">{i + 1}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
