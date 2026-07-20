import { canManageClients, getTrainerOrgId } from "@/lib/data/memberships";
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

  const orgId = await getTrainerOrgId();
  if (!orgId) {
    return {
      ok: false,
      error: "Ative seu perfil profissional antes de convidar alunos.",
    };
  }

  const { error } = await supabase.from("client_links").insert({
    org_id: orgId,
    trainer_id: user.id,
    invite_email: clean,
    status: "invited",
  });
  if (error) return { ok: false, error: "Falha ao convidar. Talvez já exista." };

  return { ok: true };
}

export interface ClientLink {
  id: string;
  status: string;
  invite_email: string | null;
  name: string | null;
  client_id: string | null;
}

export async function respondToTrainerRequest(linkId: string, accept: boolean) {
  const supabase = createClient();
  const { error } = await supabase.rpc("respond_to_trainer_request", {
    p_link_id: linkId,
    p_accept: accept,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function listClientLinks(): Promise<ClientLink[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  if (!(await canManageClients())) return [];

  const { data } = await supabase
    .from("client_links")
    .select("id, status, invite_email, client_id, profiles:client_id(name)")
    .eq("trainer_id", user.id)
    .order("status", { ascending: true });

  return ((data ?? []) as unknown as {
    id: string;
    status: string;
    invite_email: string | null;
    client_id: string | null;
    profiles: { name: string } | null;
  }[]).map((link) => ({
    id: link.id,
    status: link.status,
    invite_email: link.invite_email,
    client_id: link.client_id,
    name: link.profiles?.name ?? null,
  }));
}

export interface ActiveTrainerLink {
  trainerId: string;
  name: string;
}

/** Vínculo ativo do lado do aluno (solo user com personal aceito). */
export async function getMyActiveTrainerLink(): Promise<ActiveTrainerLink | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("client_links")
    .select("trainer_id, profiles:trainer_id(name)")
    .eq("client_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as unknown as { trainer_id: string; profiles: { name: string } | null };
  return { trainerId: row.trainer_id, name: row.profiles?.name ?? "Seu personal" };
}

/** Confirma vínculo ativo trainer->client antes de deixar o trainer criar plano pro aluno. */
export async function hasActiveClientLink(clientId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("client_links")
    .select("id")
    .eq("trainer_id", user.id)
    .eq("client_id", clientId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return !!data;
}
