import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { Plus, X, Dumbbell } from 'lucide-react'

/* ── Medidas corporais ───────────────────────────────────────────────── */
const FIELDS = [
  { key: 'peso', label: 'Peso', unit: 'kg' },
  { key: 'gordura', label: 'Gordura', unit: '%' },
  { key: 'peito', label: 'Peito', unit: 'cm' },
  { key: 'cintura', label: 'Cintura', unit: 'cm' },
  { key: 'quadril', label: 'Quadril', unit: 'cm' },
  { key: 'biceps', label: 'Bíceps', unit: 'cm' },
  { key: 'coxa', label: 'Coxa', unit: 'cm' },
] as const
type FieldKey = (typeof FIELDS)[number]['key']

interface Entry { date: string; values: Partial<Record<FieldKey, number>>; notes?: string }

const INITIAL: Entry[] = [
  { date: '14/06', values: { peso: 83.2, gordura: 21.4, cintura: 88, peito: 101, coxa: 58 }, notes: 'Início do mesociclo 1' },
  { date: '28/06', values: { peso: 82.4, gordura: 20.6, cintura: 87, peito: 101.5, coxa: 58.5 } },
  { date: '12/07', values: { peso: 81.9, gordura: 19.9, cintura: 85.5, peito: 102, coxa: 59 } },
  { date: '26/07', values: { peso: 81.2, gordura: 19.1, cintura: 84, peito: 102.5, coxa: 59.5 } },
  { date: '09/08', values: { peso: 80.8, gordura: 18.6, cintura: 83.5, peito: 103, coxa: 60 }, notes: 'Reavaliação mensal' },
]

/* ── Avaliação de força (base das cargas prescritas) ─────────────────── */
const STRENGTH_TESTS = [
  { ex: 'Supino reto com barra', rm10: 55, updated: '12/ago', feeds: ['supino-reto'] },
  { ex: 'Agachamento livre', rm10: 80, updated: '12/ago', feeds: ['agachamento'] },
  { ex: 'Terra romeno', rm10: 85, updated: '12/ago', feeds: ['rdl'] },
  { ex: 'Crucifixo com halteres', rm10: 12, updated: '12/ago', feeds: ['crucifixo-h'] },
  { ex: 'Agachamento goblet', rm10: 20, updated: '12/ago', feeds: ['goblet'] },
  { ex: 'Supino neutro com halteres', rm10: 20, updated: '12/ago', feeds: ['supino-neutro'] },
]

const tooltipStyle = { backgroundColor: 'hsl(152 13% 9%)', border: '1px solid hsl(152 12% 14%)', borderRadius: 12, fontSize: 12 }

export default function Measurements() {
  const [tab, setTab] = useState<'corpo' | 'forca'>('corpo')
  const [entries, setEntries] = useState(INITIAL)
  const [field, setField] = useState<FieldKey>('peso')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const chartData = useMemo(
    () => entries.filter((e) => e.values[field] != null).map((e) => ({ date: e.date, value: e.values[field] })),
    [entries, field],
  )

  function save() {
    const values: Entry['values'] = {}
    for (const f of FIELDS) {
      const n = parseFloat((form[f.key] ?? '').replace(',', '.'))
      if (Number.isFinite(n)) values[f.key] = n
    }
    if (Object.keys(values).length === 0) return
    setEntries((p) => [...p, { date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), values }])
    setAdding(false)
    setForm({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between animate-rise">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Evolução</p>
          <h1 className="font-display mt-1 text-2xl lg:text-3xl">Medidas & avaliação</h1>
        </div>
        {tab === 'corpo' && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-xl bg-volt px-4 py-2.5 text-sm font-semibold text-[#101405] active:scale-95">
            <Plus size={15} /> Nova
          </button>
        )}
      </div>

      <div className="flex gap-2 animate-rise" style={{ animationDelay: '60ms' }}>
        {([['corpo', 'Medidas corporais'], ['forca', 'Avaliação de força']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${tab === k ? 'bg-volt text-[#101405]' : 'border border-line text-muted-foreground hover:text-foreground'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'corpo' ? (
        <>
          <section className="card-surface rounded-3xl p-5 animate-rise" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Evolução</h2>
              <div className="flex flex-wrap gap-1.5">
                {FIELDS.map((f) => (
                  <button key={f.key} onClick={() => setField(f.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${field === f.key ? 'bg-aqua/20 text-aqua' : 'text-muted-foreground hover:text-foreground'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(152 12% 12%)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(140 6% 56%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: 'hsl(140 6% 56%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke="hsl(73 66% 58%)" strokeWidth={2.5} dot={{ r: 3.5, fill: 'hsl(73 66% 58%)', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-2 animate-rise" style={{ animationDelay: '180ms' }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Registros</h2>
            {[...entries].reverse().map((e, i) => (
              <div key={i} className="card-surface rounded-3xl p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono-num text-sm font-semibold">{e.date}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono-num text-xs text-muted-foreground">
                    {FIELDS.filter((f) => e.values[f.key] != null).map((f) => (
                      <span key={f.key}><span className="text-foreground">{e.values[f.key]}</span> {f.unit} {f.label.toLowerCase()}</span>
                    ))}
                  </div>
                </div>
                {e.notes && <p className="mt-1.5 text-xs text-muted-foreground">{e.notes}</p>}
              </div>
            ))}
          </section>
        </>
      ) : (
        <section className="space-y-4 animate-rise">
          <div className="card-surface rounded-3xl border-l-2 border-l-volt p-5">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold text-volt">Como funciona: </span>
              quando um exercício ainda não tem histórico de treino, a carga prescrita vem daqui — o teste de repetições máximas é convertido para a faixa do plano. Assim que o aluno treina, o histórico passa a mandar.
            </p>
          </div>
          <div className="card-surface divide-y divide-line overflow-hidden rounded-3xl">
            {STRENGTH_TESTS.map((t) => (
              <div key={t.ex} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-aqua"><Dumbbell size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.ex}</p>
                  <p className="text-xs text-muted-foreground">atualizado em {t.updated}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-sm font-semibold text-volt">{t.rm10}kg</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">10RM</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full rounded-3xl border border-line py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-volt/50 hover:text-foreground">
            + Agendar nova avaliação
          </button>
        </section>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm lg:items-center" onClick={() => setAdding(false)}>
          <div className="card-surface w-full max-w-lg rounded-t-3xl p-5 lg:rounded-3xl animate-rise" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Nova medição</h3>
              <button onClick={() => setAdding(false)} className="rounded-full border border-line p-2 text-muted-foreground"><X size={14} /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <label key={f.key} className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">{f.label} ({f.unit})</span>
                  <input value={form[f.key] ?? ''} inputMode="decimal" placeholder="–"
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3 font-mono-num text-sm outline-none focus:border-volt/60" />
                </label>
              ))}
            </div>
            <button onClick={save} className="mt-5 w-full rounded-3xl bg-volt py-3.5 text-sm font-semibold text-[#101405] active:scale-[0.98]">Salvar</button>
          </div>
        </div>
      )}
    </div>
  )
}
