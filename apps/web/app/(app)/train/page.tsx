"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Readiness, WorkoutSession } from "@bstrainer/domain";
import { suggestAdjustment } from "@bstrainer/engine";
import {
  clearActiveSession,
  createFreeSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";

const READINESS_FIELDS: { key: keyof Readiness; label: string }[] = [
  { key: "sleep", label: "Sono" },
  { key: "soreness", label: "Dor muscular" },
  { key: "energy", label: "Energia" },
];

function formatElapsed(startedAt: string, now: number): string {
  const totalSec = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TrainPage() {
  const router = useRouter();
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [readiness, setReadiness] = useState<Readiness>({
    sleep: null,
    soreness: null,
    energy: null,
  });
  const [deloadWarning, setDeloadWarning] = useState<string | null>(null);

  useEffect(() => {
    setActive(loadActiveSession());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  function startFreeSession() {
    // ponytail: sem histórico de sessão anterior ainda, então lastSessionRpe/recentE1rmTrend
    // ficam null — upgrade path é ler a última sessão de loadSessionHistory() quando existir.
    const { recommendation, reason } = suggestAdjustment({
      readiness,
      lastSessionRpe: null,
      recentE1rmTrend: null,
    });
    if (recommendation === "deload") {
      setDeloadWarning(reason);
      return;
    }
    saveActiveSession({ ...createFreeSession(), readiness });
    router.push("/train/session");
  }

  function confirmDeloadAndStart() {
    saveActiveSession({ ...createFreeSession(), readiness });
    router.push("/train/session");
  }

  function discardActive() {
    clearActiveSession();
    setActive(null);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Treinar
      </h1>

      {!loaded ? (
        <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
      ) : active ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push("/train/session")}
            className="flex h-16 w-full flex-col items-center justify-center rounded-lg bg-signal text-lg font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
          >
            Continuar treino
            <span className="tnum text-sm font-normal text-ink/70">
              em andamento há {formatElapsed(active.startedAt, now)}
            </span>
          </button>
          <button
            type="button"
            onClick={discardActive}
            className="h-11 w-full rounded-lg border border-line text-sm text-mute transition active:bg-surface-2"
          >
            Descartar treino em andamento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
            <h2 className="caps-label font-display font-semibold text-mute">
              Como você está hoje?
            </h2>
            {READINESS_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-2">
                <span className="text-sm">{field.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setReadiness((prev) => ({
                          ...prev,
                          [field.key]: prev[field.key] === value ? null : value,
                        }))
                      }
                      aria-label={`${field.label} ${value}`}
                      aria-pressed={readiness[field.key] === value}
                      className={`tnum h-9 w-9 rounded border text-sm font-semibold transition active:scale-[0.98] ${
                        readiness[field.key] === value
                          ? "border-signal bg-signal text-ink"
                          : "border-line bg-ink text-mute"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {deloadWarning && (
            <p className="text-sm text-err">
              Sinal de baixa recuperação: {deloadWarning} Considere reduzir a carga hoje.
            </p>
          )}

          <button
            type="button"
            onClick={deloadWarning ? confirmDeloadAndStart : startFreeSession}
            className="h-16 w-full rounded-lg bg-signal text-lg font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
          >
            {deloadWarning ? "Começar mesmo assim" : "Começar treino"}
          </button>
        </div>
      )}

      <p className="text-sm text-mute">
        Ficha do dia chega em breve — por enquanto, registre um treino livre.
      </p>
    </div>
  );
}
