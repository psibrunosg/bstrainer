import { createClient } from "@/lib/supabase/client";

export interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

interface MessageRow {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export async function getMessages(counterpartId: string): Promise<Message[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${counterpartId}),and(sender_id.eq.${counterpartId},recipient_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true });

  return ((data ?? []) as MessageRow[]).map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
    mine: r.sender_id === user.id,
  }));
}

export interface SendMessageResult {
  ok: boolean;
  error?: string;
}

export async function sendMessage(
  counterpartId: string,
  body: string,
): Promise<SendMessageResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Mensagem vazia." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: counterpartId,
    body: trimmed,
  });
  if (error) return { ok: false, error: "Falha ao enviar. Vínculo ativo?" };

  return { ok: true };
}

/** Realtime: novas mensagens recebidas de qualquer contato. Retorna função de unsubscribe. */
export function subscribeToIncomingMessages(
  myId: string,
  onMessage: (row: Message) => void,
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`messages:${myId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `recipient_id=eq.${myId}`,
      },
      (payload) => {
        const r = payload.new as MessageRow;
        onMessage({
          id: r.id,
          senderId: r.sender_id,
          body: r.body,
          createdAt: r.created_at,
          mine: false,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
