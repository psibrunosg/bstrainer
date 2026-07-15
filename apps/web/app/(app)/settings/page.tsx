"use client";

import { useEffect, useState } from "react";
import { getMyTrainerProfile, setTrainerListing } from "@/lib/data/trainers";

export default function SettingsPage() {
  const [acceptingClients, setAcceptingClients] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getMyTrainerProfile().then((profile) => {
      setAcceptingClients(profile?.accepting_clients ?? false);
    });
  }, []);

  async function toggleListing() {
    setBusy(true);
    setMessage(null);
    const next = !acceptingClients;
    const result = await setTrainerListing(next);
    setBusy(false);
    if (result.ok) {
      setAcceptingClients(next);
      setMessage(next ? "Seu perfil agora aparece para novos alunos." : "Seu perfil foi removido da busca.");
    } else {
      setMessage(result.error ?? "Não foi possível atualizar seu perfil.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">Perfil, organização e assinatura.</p>
      </div>

      <section className="rounded-lg border border-line bg-surface p-5">
        <p className="caps-label font-display font-semibold text-signal">Perfil profissional</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Atender alunos</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Ative para aparecer na busca e receber pedidos de acompanhamento de usuários solo.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={toggleListing}
          className="mt-4 h-10 rounded-full bg-signal px-5 text-sm font-semibold text-surface disabled:opacity-50"
        >
          {busy ? "Salvando…" : acceptingClients ? "Parar de aceitar alunos" : "Quero atender alunos"}
        </button>
        {message && <p className="mt-3 text-sm text-mute">{message}</p>}
      </section>
    </div>
  );
}
