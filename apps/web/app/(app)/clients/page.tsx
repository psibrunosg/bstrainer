"use client";

import { useCallback, useEffect, useState } from "react";
import {
  inviteClient,
  listClientLinks,
  type ClientLink,
} from "@/lib/data/clients";

const STATUS_LABEL: Record<string, string> = {
  invited: "Convidado",
  active: "Ativo",
  archived: "Arquivado",
};

export default function ClientsPage() {
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reload = useCallback(() => {
    listClientLinks().then(setLinks);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const result = await inviteClient(email);
    setBusy(false);
    if (result.ok) {
      setEmail("");
      setMsg({ ok: true, text: "Convite registrado." });
      reload();
    } else {
      setMsg({ ok: false, text: result.error ?? "Falha." });
    }
  }

  const active = links.filter((l) => l.status === "active");
  const pending = links.filter((l) => l.status === "invited");

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Alunos
        </h1>
        <p className="mt-1 text-sm text-mute">
          Convide por e-mail. Quando o aluno criar a conta, o vínculo é ativado
          automaticamente.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@do-aluno.com"
            className="h-12 flex-1 rounded border border-line bg-surface px-4 text-base outline-none placeholder:text-mute focus:border-signal"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-12 rounded-lg bg-signal px-5 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
          >
            {busy ? "…" : "Convidar"}
          </button>
        </div>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-ok" : "text-err"}`}>
            {msg.text}
          </p>
        )}
      </form>

      {links.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-mute">
          Nenhum aluno ainda. Envie o primeiro convite acima.
        </p>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <section className="space-y-2">
              <h2 className="caps-label font-display font-semibold text-mute">
                Ativos · {active.length}
              </h2>
              <ul className="space-y-px">
                {active.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between border-b border-line px-1 py-3 last:border-b-0"
                  >
                    <span className="text-text">{l.name ?? "Aluno"}</span>
                    <span className="caps-label text-ok">
                      {STATUS_LABEL[l.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pending.length > 0 && (
            <section className="space-y-2">
              <h2 className="caps-label font-display font-semibold text-mute">
                Convites pendentes · {pending.length}
              </h2>
              <ul className="space-y-px">
                {pending.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between border-b border-line px-1 py-3 last:border-b-0"
                  >
                    <span className="text-mute">{l.invite_email}</span>
                    <span className="caps-label text-mute">
                      {STATUS_LABEL[l.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
