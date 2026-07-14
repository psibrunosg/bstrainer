"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface InviteResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Convida um aluno por e-mail: cria client_link pendente na org do trainer. */
export async function inviteClient(email: string): Promise<InviteResult> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: false, error: "E-mail inválido." };

  const supabase = await createClient();
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

  revalidatePath("/clients");
  return { ok: true };
}
