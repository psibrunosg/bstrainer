"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getMessages,
  sendMessage,
  subscribeToIncomingMessages,
  type Message,
} from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/client";

function MessageThread() {
  const search = useSearchParams();
  const router = useRouter();
  const counterpartId = search.get("id");
  const counterpartName = search.get("name") ?? "Conversa";

  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!counterpartId) return;
    getMessages(counterpartId).then((m) => {
      setMessages(m);
      setLoaded(true);
    });

    let unsubscribe: (() => void) | null = null;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      unsubscribe = subscribeToIncomingMessages(user.id, (row) => {
        if (row.senderId !== counterpartId) return;
        setMessages((prev) => [...prev, row]);
      });
    });
    return () => unsubscribe?.();
  }, [counterpartId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit() {
    if (!counterpartId) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const result = await sendMessage(counterpartId, body);
    setSending(false);
    if (!result.ok) {
      setError(result.error ?? "Falha ao enviar.");
      return;
    }
    setDraft("");
    setMessages(await getMessages(counterpartId));
  }

  if (!counterpartId) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <p className="text-sm text-mute">Nenhuma conversa selecionada.</p>
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98]"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-lg flex-col p-4">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
        >
          ←
        </button>
        <h1 className="font-display text-xl font-semibold">{counterpartName}</h1>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {!loaded && <div className="h-16 animate-pulse rounded-lg bg-surface-2" />}
        {loaded && messages.length === 0 && (
          <p className="text-center text-sm text-mute">
            Nenhuma mensagem ainda. Diga oi.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm ${
              m.mine
                ? "ml-auto border-signal/30 bg-signal/10 text-text"
                : "border-line bg-surface text-text"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-err">{error}</p>}

      <div className="flex gap-2 border-t border-line pt-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !sending) submit();
          }}
          placeholder="Escrever…"
          className="h-11 flex-1 rounded border border-line bg-ink px-3 text-base outline-none placeholder:text-mute focus:border-signal"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending || !draft.trim()}
          className="h-11 rounded-lg bg-signal px-4 text-sm font-semibold text-ink transition active:scale-[0.98] disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-surface-2" />}>
      <MessageThread />
    </Suspense>
  );
}
