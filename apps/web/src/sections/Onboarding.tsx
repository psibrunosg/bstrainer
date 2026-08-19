import { useState } from 'react'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

const GOALS = ['Hipertrofia', 'Força', 'Potência', 'Resistência', 'Saúde', 'Emagrecimento']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado']
const PLACES = ['Academia', 'Casa', 'Ar livre']
const EQUIPMENT = ['Barra', 'Halteres', 'Máquinas', 'Elásticos', 'Kettlebell', 'Peso corporal']

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('Hipertrofia')
  const [level, setLevel] = useState('Intermediário')
  const [place, setPlace] = useState('Academia')
  const [days, setDays] = useState(4)
  const [equip, setEquip] = useState<string[]>(['Barra', 'Halteres', 'Máquinas'])
  const [weight, setWeight] = useState('81')
  const [height, setHeight] = useState('175')

  const steps = ['Objetivo', 'Nível', 'Rotina', 'Corpo']

  function OptionGrid({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)}
            className={`rounded-3xl border px-4 py-4 text-sm font-semibold transition-all active:scale-[0.97] ${
              value === o ? 'border-volt bg-volt/10 text-volt' : 'border-line bg-surface text-muted-foreground hover:text-foreground'
            }`}>
            {o}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-rise">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Perfil de treino</p>
        <h1 className="font-display mt-1 text-2xl lg:text-3xl">Conta pra gente sobre você</h1>
        <div className="mt-4 flex gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-volt' : 'bg-surface-2'}`} />
          ))}
        </div>
      </div>

      <div className="animate-rise" key={step}>
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg">Qual seu objetivo principal?</h2>
            <OptionGrid options={GOALS} value={goal} onPick={setGoal} />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg">Seu nível de experiência</h2>
            <OptionGrid options={LEVELS} value={level} onPick={setLevel} />
            <h2 className="font-display pt-2 text-lg">Onde você treina?</h2>
            <OptionGrid options={PLACES} value={place} onPick={setPlace} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-lg">Quantos dias por semana?</h2>
            <div className="card-surface flex items-center justify-between rounded-3xl p-4">
              <button onClick={() => setDays((d) => Math.max(1, d - 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-xl text-muted-foreground active:scale-95">−</button>
              <span className="font-mono-num text-4xl font-bold text-volt">{days}x</span>
              <button onClick={() => setDays((d) => Math.min(7, d + 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-xl text-muted-foreground active:scale-95">+</button>
            </div>
            <h2 className="font-display text-lg">Equipamentos disponíveis</h2>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT.map((eq) => {
                const on = equip.includes(eq)
                return (
                  <button key={eq} onClick={() => setEquip((p) => (on ? p.filter((e) => e !== eq) : [...p, eq]))}
                    className={`flex items-center justify-between rounded-3xl border px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.97] ${
                      on ? 'border-volt bg-volt/10 text-volt' : 'border-line bg-surface text-muted-foreground'
                    }`}>
                    {eq}{on && <Check size={14} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg">Por último, seu corpo</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Peso (kg)</span>
                <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal"
                  className="h-14 w-full rounded-3xl border border-line bg-surface px-4 font-mono-num text-lg outline-none focus:border-volt/60" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Altura (cm)</span>
                <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric"
                  className="h-14 w-full rounded-3xl border border-line bg-surface px-4 font-mono-num text-lg outline-none focus:border-volt/60" />
              </label>
            </div>
            <p className="card-surface rounded-3xl p-4 text-xs leading-relaxed text-muted-foreground">
              Com objetivo <span className="text-volt">{goal.toLowerCase()}</span>, nível <span className="text-volt">{level.toLowerCase()}</span> e {days}x/semana, o motor recomenda o plano <span className="text-volt">{days >= 6 ? 'PPL 6x' : days >= 4 ? 'Hipertrofia Upper/Lower' : 'Base Sólida'}</span>.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="flex h-13 items-center gap-2 rounded-3xl border border-line px-5 py-3.5 text-sm font-semibold text-muted-foreground">
            <ArrowLeft size={15} /> Voltar
          </button>
        )}
        <button onClick={() => (step < 3 ? setStep(step + 1) : onDone())}
          className="flex flex-1 items-center justify-center gap-2 rounded-3xl bg-volt py-3.5 font-display text-sm uppercase tracking-wide text-[#101405] active:scale-[0.98]">
          {step < 3 ? <>Continuar <ArrowRight size={15} /></> : 'Salvar perfil'}
        </button>
      </div>
    </div>
  )
}
