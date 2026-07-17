import type { AthleteProfile } from "@bstrainer/domain";
import { createClient } from "@/lib/supabase/client";

interface AthleteProfileRow {
  profile_id: string;
  sex: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  level: string;
  goal: string;
  training_location: string;
  days_per_week: number;
  equipment: string[];
  created_at: string;
  updated_at: string;
}

function toAthleteProfile(row: AthleteProfileRow): AthleteProfile {
  return {
    profileId: row.profile_id,
    sex: row.sex as AthleteProfile["sex"],
    birthDate: row.birth_date,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    level: row.level as AthleteProfile["level"],
    goal: row.goal as AthleteProfile["goal"],
    trainingLocation: row.training_location as AthleteProfile["trainingLocation"],
    daysPerWeek: row.days_per_week,
    equipment: row.equipment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** null = usuário ainda não passou pelo wizard de onboarding. */
export async function getMyAthleteProfile(): Promise<AthleteProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("athlete_profiles")
    .select(
      "profile_id, sex, birth_date, weight_kg, height_cm, level, goal, training_location, days_per_week, equipment, created_at, updated_at",
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  return data ? toAthleteProfile(data) : null;
}

export interface SaveAthleteProfileResult {
  ok: boolean;
  error?: string;
}

export async function saveAthleteProfile(
  input: Omit<AthleteProfile, "profileId" | "createdAt" | "updatedAt">,
): Promise<SaveAthleteProfileResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase.from("athlete_profiles").upsert({
    profile_id: user.id,
    sex: input.sex,
    birth_date: input.birthDate,
    weight_kg: input.weightKg,
    height_cm: input.heightCm,
    level: input.level,
    goal: input.goal,
    training_location: input.trainingLocation,
    days_per_week: input.daysPerWeek,
    equipment: input.equipment,
  });
  if (error) return { ok: false, error: "Falha ao salvar perfil." };

  return { ok: true };
}
