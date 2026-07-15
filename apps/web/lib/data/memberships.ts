import { createClient } from "@/lib/supabase/client";

interface MembershipRow {
  org_id: string;
  role: string;
}

function pickOrg(rows: MembershipRow[], roles: string[]): string | null {
  return rows.find((row) => roles.includes(row.role))?.org_id ?? null;
}

export async function listMyMemberships(): Promise<MembershipRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getTrainingOrgId(): Promise<string | null> {
  const rows = await listMyMemberships();
  return pickOrg(rows, ["client"]) ?? pickOrg(rows, ["owner", "trainer", "solo"]);
}

export async function getTrainerOrgId(): Promise<string | null> {
  const rows = await listMyMemberships();
  return pickOrg(rows, ["owner", "trainer"]);
}

export async function canManageClients(): Promise<boolean> {
  return (await getTrainerOrgId()) != null;
}

export async function isClientOnly(): Promise<boolean> {
  const rows = await listMyMemberships();
  return pickOrg(rows, ["client"]) != null && pickOrg(rows, ["owner", "trainer"]) == null;
}
