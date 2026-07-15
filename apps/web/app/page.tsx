import Link from "next/link";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function LandingPage() {
  return (
    <main className="bg-ink text-text">
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-surface-2/80 blur-3xl" />
        <div aria-hidden className="absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-16 md:grid-cols-[1.05fr_0.95fr] md:pb-20 md:pt-20">
          <div>
            <p className="caps-label font-display text-lg font-semibold text-signal">
              bstrainer · a matilha em movimento
            </p>
            <h1 className="mt-5 max-w-xl font-display text-6xl font-bold leading-[0.9] tracking-tight md:text-8xl">
              TREINAR É
              <br />
              CUIDAR DE SI.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-mute">
              Força, constância e bem-estar no mesmo ritmo. Registre seu treino,
              acompanhe seu progresso e construa uma rotina que cabe na sua vida.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-signal px-8 text-[15px] font-semibold text-surface transition active:scale-[0.98] active:bg-signal-press"
              >
                Começar grátis
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center px-4 text-[15px] font-medium text-mute transition hover:text-text"
              >
                Sou personal →
              </Link>
            </div>
          </div>
          <div className="relative mx-auto max-w-md md:max-w-none">
            <div aria-hidden className="absolute inset-x-10 bottom-8 h-16 rounded-full bg-surface-2" />
            <img
              src={`${BASE_PATH}/lobo-movimento.png`}
              alt="Lobo que representa movimento, constância e bem-estar"
              width={1365}
              height={1365}
              className="relative mx-auto w-full max-w-md"
            />
          </div>
        </div>
      </section>

      {/* Prova — faixa de números */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-3">
          <Proof number="78" label="exercícios curados em pt-BR" />
          <Proof number="10" label="periodizações da literatura" />
          <Proof number="3s" label="para registrar uma série" />
        </div>
      </section>

      {/* Feature: Logger */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2 md:py-32">
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Registrar em 3 toques.
            </h2>
            <p className="mt-4 max-w-sm text-mute">
              Peso, reps, feito. O timer já começou. A carga da última sessão
              está na tela — você nunca precisa lembrar.
            </p>
          </div>
          <LoggerMock />
        </div>
      </section>

      {/* Feature: Personal */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2 md:py-32">
          <div className="md:order-2">
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Sua planilha, aposentada.
            </h2>
            <p className="mt-4 max-w-sm text-mute">
              Monte a periodização, entregue no celular do aluno, acompanhe em
              tempo real. Macrociclo, mesociclo, deload — tudo visível.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5 md:order-1">
            <p className="caps-label font-display font-semibold text-mute">
              Mesociclo 2 · Semana 3 de 5
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full w-3/5 rounded-full bg-signal" />
            </div>
            <div className="mt-5 space-y-2.5">
              {["Ana — Lower Pesado concluído", "Carlos — Upper Volume hoje", "Marina — deload semana que vem"].map(
                (t) => (
                  <div
                    key={t}
                    className="flex items-center justify-between rounded border border-line bg-ink px-3 py-2.5 text-sm"
                  >
                    <span>{t}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature: Progresso */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            O gráfico que sobe junto com você.
          </h2>
          <p className="mt-4 max-w-sm text-mute">
            e1RM por exercício, tonelagem semanal, volume por músculo. Calculado
            dos seus dados brutos, sessão a sessão.
          </p>
          <ChartMock />
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Planos
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <PriceCard
              name="Solo"
              price="R$0"
              items={["Logger completo", "Templates de periodização", "Progresso e e1RM"]}
            />
            <PriceCard
              name="Atleta"
              price="R$19/mês"
              highlight
              items={["Tudo do Solo", "Análises avançadas", "Histórico ilimitado"]}
            />
            <PriceCard
              name="Personal"
              price="R$49/mês"
              items={["Alunos ilimitados", "Prescrição e acompanhamento", "Aderência em tempo real"]}
            />
          </div>
          <p className="mt-6 text-xs text-mute">
            Valores de lançamento. Cobrança em breve — hoje é tudo grátis.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-24 text-center md:py-32">
          <h2 className="font-display text-5xl font-black italic tracking-tight md:text-7xl">
            HOJE TEM TREINO.
          </h2>
          <Link
            href="/login"
            className="mt-10 inline-flex h-12 items-center justify-center rounded-lg bg-signal px-10 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
          >
            Criar conta grátis
          </Link>
        </div>
        <footer className="border-t border-line py-6 text-center text-xs text-mute">
          bstrainer · treino de força, registrado. · Exercícios base: wger (CC-BY-SA)
        </footer>
      </section>
    </main>
  );
}

function Proof({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="tnum font-display text-4xl font-bold">{number}</p>
      <p className="mt-1 text-sm text-mute">{label}</p>
    </div>
  );
}

function LoggerMock() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg font-semibold">Supino reto</p>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-gold">
          PR · 92,5 kg
        </span>
      </div>
      <div className="mt-4 space-y-px">
        {[
          { n: 1, kg: "80", reps: "8", done: true },
          { n: 2, kg: "85", reps: "6", done: true },
          { n: 3, kg: "87,5", reps: "5", done: false },
        ].map((s) => (
          <div
            key={s.n}
            className={`grid h-14 grid-cols-[32px_1fr_1fr_44px] items-center gap-2 border-b border-line ${
              !s.done ? "border-l-2 border-l-signal pl-2" : ""
            }`}
          >
            <span className="caps-label text-mute">{s.n}</span>
            <span className="tnum rounded bg-ink py-2 text-center font-display text-xl font-semibold">
              {s.kg}
            </span>
            <span className="tnum rounded bg-ink py-2 text-center font-display text-xl font-semibold">
              {s.reps}
            </span>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded border ${
                s.done
                  ? "border-ok/30 bg-ok/15 text-ok"
                  : "border-line text-mute"
              }`}
            >
              ✓
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded bg-surface-2 px-4 py-3">
        <span className="tnum font-display text-3xl font-bold text-signal">
          1:24
        </span>
        <span className="text-sm text-mute">-15s · +15s · Pular</span>
      </div>
    </div>
  );
}

function ChartMock() {
  const points = "0,80 40,74 80,76 120,66 160,60 200,62 240,50 280,44 320,38 360,30 400,24";
  return (
    <div className="mt-10 rounded-lg border border-line bg-surface p-5">
      <p className="caps-label font-display font-semibold text-mute">
        e1RM · Agachamento livre
      </p>
      <svg viewBox="0 0 400 90" className="mt-4 w-full" aria-hidden>
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-signal)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-mute">
        <span>há 12 semanas</span>
        <span className="tnum font-display text-base font-bold text-text">
          142,5 kg
        </span>
      </div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  items,
  highlight,
}: {
  name: string;
  price: string;
  items: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg border bg-ink p-6 ${
        highlight ? "border-signal" : "border-line"
      }`}
    >
      {highlight && (
        <span className="caps-label absolute -top-2.5 left-6 bg-ink px-2 font-display font-semibold text-signal">
          Mais escolhido
        </span>
      )}
      <p className="caps-label font-display font-semibold text-mute">{name}</p>
      <p className="tnum mt-2 font-display text-3xl font-bold">{price}</p>
      <ul className="mt-5 space-y-2 text-sm text-mute">
        {items.map((item) => (
          <li key={item}>— {item}</li>
        ))}
      </ul>
    </div>
  );
}
