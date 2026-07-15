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
    .select("id, status, invite_email, profiles:client_id(name)")
    .eq("trainer_id", user.id)
    .order("status", { ascending: true });

  return ((data ?? []) as unknown as {
    id: string;
    status: string;
    invite_email: string | null;
    profiles: { name: string } | null;
  }[]).map((link) => ({
    id: link.id,
    status: link.status,
    invite_email: link.invite_email,
    name: link.profiles?.name ?? null,
  }));
}
