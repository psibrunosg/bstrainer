"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutSession } from "@bstrainer/domain";
import {
  clearActiveSession,
  createFreeSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";

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
    const session = createFreeSession();
    saveActiveSession(session);
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
        <button
          type="button"
          onClick={startFreeSession}
          className="h-16 w-full rounded-lg bg-signal text-lg font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
        >
          Iniciar treino livre
        </button>
      )}

      <p className="text-sm text-mute">
        Ficha do dia chega em breve — por enquanto, registre um treino livre.
      </p>
    </div>
  );
}
