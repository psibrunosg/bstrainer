import { createClient } from "@/lib/supabase/client";

export interface InviteResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteClient(email: string): Promise<InviteResult> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: false, error: "E-mail inválido." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("profile_id", user.id)
    .limit(1)
    .single();
  if (!membership) return { ok: false, error: "Organização não encontrada." };

  const { error } = await supabase.from("client_links").insert({
    org_id: membership.org_id,
    trainer_id: user.id,
    invite_email: clean,
    status: "invited",
  });
  if (error) return { ok: false, error: "Falha ao convidar (talvez já exista)." };

  return { ok: true };
}

export interface ClientLink {
  id: string;
  status: string;
  invite_email: string | null;
  name: string | null;
}

export async function listClientLinks(): Promise<ClientLink[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("client_links")
    .select("id, status, invite_email, profiles:client_id(name)")
    .eq("trainer_id", user.id)
    .order("status", { ascending: true });

  return ((data ?? []) as unknown as {
    id: string;
    status: string;
    invite_email: string | null;
    profiles: { name: string } | null;
  }[]).map((l) => ({
    id: l.id,
    status: l.status,
    invite_email: l.invite_email,
    name: l.profiles?.name ?? null,
  }));
}
