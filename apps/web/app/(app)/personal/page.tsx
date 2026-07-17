"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listTrainers,
  requestTrainer,
  type TrainerProfile,
} from "@/lib/data/trainers";
import { getMyActiveTrainerLink, type ActiveTrainerLink } from "@/lib/data/clients";

export default function PersonalPage() {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [activeTrainer, setActiveTrainer] = useState<ActiveTrainerLink | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    listTrainers().then(setTrainers);
    getMyActiveTrainerLink().then(setActiveTrainer);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function selectTrainer(trainerId: string) {
    setBusyId(trainerId);
    setMessage(null);
    const result = await requestTrainer(trainerId);
    setBusyId(null);
    setMessage(
      result.ok
        ? "Solicitação enviada. O personal precisa aceitar o acompanhamento."
        : result.error ?? "Não foi possível enviar a solicitação.",
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <p className="caps-label font-display font-semibold text-signal">Acompanhamento</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Escolha seu personal</h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Você continua com seu treino solo e pode pedir acompanhamento quando fizer sentido.
        </p>
      </div>

      {message && <p className="rounded-lg border border-line bg-surface p-3 text-sm text-text">{message}</p>}

      {activeTrainer && (
        <article className="flex items-center justify-between rounded-lg border border-signal/30 bg-signal/5 p-5">
          <div>
            <p className="caps-label font-display font-semibold text-signal">
              Seu personal
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              {activeTrainer.name}
            </h2>
          </div>
          <Link
            href={`/messages?id=${activeTrainer.trainerId}&name=${encodeURIComponent(activeTrainer.name)}`}
            className="h-10 rounded-full bg-signal px-5 text-sm font-semibold leading-10 text-surface"
          >
            Conversar
          </Link>
        </article>
      )}

      {trainers.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-mute">
          Ainda não há personais disponíveis. Peça para seu personal ativar o perfil profissional em Ajustes.
        </p>
      ) : (
        <div className="space-y-3">
          {trainers.map((trainer) => (
            <article key={trainer.profile_id} className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-display text-2xl font-semibold">{trainer.name}</h2>
              {trainer.bio && <p className="mt-2 text-sm text-mute">{trainer.bio}</p>}
              <button
                type="button"
                disabled={busyId === trainer.profile_id}
                onClick={() => selectTrainer(trainer.profile_id)}
                className="mt-4 h-10 rounded-full bg-signal px-5 text-sm font-semibold text-surface disabled:opacity-50"
              >
                {busyId === trainer.profile_id ? "Enviando…" : "Pedir acompanhamento"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
