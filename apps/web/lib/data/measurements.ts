import type { BodyMeasurement } from "@bstrainer/domain";
import { createClient } from "@/lib/supabase/client";

interface DbMeasurement {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  bicep_right_cm: number | null;
  thigh_right_cm: number | null;
  notes: string | null;
  created_at: string;
}

const SELECT_COLS =
  "id, user_id, measured_at, weight_kg, body_fat_pct, chest_cm, waist_cm, hip_cm, bicep_right_cm, thigh_right_cm, notes, created_at";

function toDomain(r: DbMeasurement): BodyMeasurement {
  return {
    id: r.id,
    userId: r.user_id,
    measuredAt: r.measured_at,
    weightKg: r.weight_kg,
    bodyFatPct: r.body_fat_pct,
    chestCm: r.chest_cm,
    waistCm: r.waist_cm,
    hipCm: r.hip_cm,
    bicepRightCm: r.bicep_right_cm,
    thighRightCm: r.thigh_right_cm,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export async function listMeasurements(): Promise<BodyMeasurement[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("body_measurements")
    .select(SELECT_COLS)
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false });

  return ((data ?? []) as unknown as DbMeasurement[]).map(toDomain);
}

export interface MeasurementResult {
  ok: boolean;
  error?: string;
}

export async function saveMeasurement(
  input: Omit<BodyMeasurement, "id" | "userId" | "createdAt"> & { id?: string },
): Promise<MeasurementResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase.from("body_measurements").upsert({
    ...(input.id ? { id: input.id } : {}),
    user_id: user.id,
    measured_at: input.measuredAt,
    weight_kg: input.weightKg,
    body_fat_pct: input.bodyFatPct,
    chest_cm: input.chestCm,
    waist_cm: input.waistCm,
    hip_cm: input.hipCm,
    bicep_right_cm: input.bicepRightCm,
    thigh_right_cm: input.thighRightCm,
    notes: input.notes,
  });

  if (error) return { ok: false, error: "Falha ao salvar medição." };
  return { ok: true };
}

export async function deleteMeasurement(id: string): Promise<MeasurementResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: "Falha ao remover medição." };
  return { ok: true };
}
