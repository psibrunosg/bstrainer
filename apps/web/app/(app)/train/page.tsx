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
      <h1 className="text-2xl font-bold">Treinar</h1>

      {!loaded ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : active ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push("/train/session")}
            className="flex min-h-16 w-full flex-col items-center justify-center rounded-lg bg-emerald-600 px-4 py-4 text-lg font-semibold text-white transition active:bg-emerald-500"
          >
            Continuar treino
            <span className="text-sm font-normal text-emerald-100">
              em andamento há {formatElapsed(active.startedAt, now)}
            </span>
          </button>
          <button
            type="button"
            onClick={discardActive}
            className="min-h-11 w-full rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-400 transition active:bg-zinc-900"
          >
            Descartar treino em andamento
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startFreeSession}
          className="min-h-16 w-full rounded-lg bg-emerald-600 px-4 py-5 text-lg font-semibold text-white transition active:bg-emerald-500"
        >
          Iniciar treino livre
        </button>
      )}

      <p className="text-sm text-zinc-400">
        Ficha do dia chega em breve — por enquanto, registre um treino livre.
      </p>
    </div>
  );
}
