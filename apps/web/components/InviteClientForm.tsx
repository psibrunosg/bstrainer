"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteClient } from "@/app/(app)/clients/actions";

export function InviteClientForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const result = await inviteClient(email);
      if (result.ok) {
        setEmail("");
        setMsg({ ok: true, text: "Convite registrado." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: result.error ?? "Falha." });
      }
    });
  }

  return (
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
          disabled={pending}
          className="h-12 rounded-lg bg-signal px-5 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
        >
          {pending ? "…" : "Convidar"}
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p>
      )}
    </form>
  );
}
