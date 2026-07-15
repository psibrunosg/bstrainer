import { createClient } from "@/lib/supabase/client";

export interface TrainerProfile {
  profile_id: string;
  name: string;
  bio: string;
}

export async function listTrainers(): Promise<TrainerProfile[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("trainer_profiles")
    .select("profile_id, name, bio")
    .eq("accepting_clients", true)
    .neq("profile_id", user.id)
    .order("name");

  return (data ?? []) as TrainerProfile[];
}

export async function requestTrainer(trainerId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("request_trainer", {
    p_trainer_id: trainerId,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function getMyTrainerProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("trainer_profiles")
    .select("accepting_clients")
    .eq("profile_id", user.id)
    .maybeSingle();

  return data;
}

export async function setTrainerListing(acceptingClients: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase
      .from("memberships")
      .select("org_id, role")
      .eq("profile_id", user.id)
      .in("role", ["owner", "trainer", "solo"])
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !membership) {
    return { ok: false, error: "Não foi possível preparar seu perfil profissional." };
  }

  if (acceptingClients && membership.role === "solo") {
    const { error } = await supabase
      .from("memberships")
      .update({ role: "trainer" })
      .eq("org_id", membership.org_id)
      .eq("profile_id", user.id);
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await supabase.from("trainer_profiles").upsert({
    profile_id: user.id,
    org_id: membership.org_id,
    name: profile.name,
    accepting_clients: acceptingClients,
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}
