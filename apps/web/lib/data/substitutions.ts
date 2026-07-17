import { createClient } from "@/lib/supabase/client";
import type { ExerciseOption } from "./plans";

/**
 * Substituições cadastradas em exercise_substitutions são direcionais na tabela,
 * mas tratamos como bidirecional na busca (A→B também oferece B ao ver A).
 */
export async function getSubstitutes(exerciseId: string): Promise<ExerciseOption[]> {
  const supabase = createClient();

  const { data: rows, error: subErr } = await supabase
    .from("exercise_substitutions")
    .select("exercise_id, substitute_id")
    .or(`exercise_id.eq.${exerciseId},substitute_id.eq.${exerciseId}`);
  if (subErr || !rows || rows.length === 0) return [];

  const otherIds = [
    ...new Set(
      rows.map((r) =>
        r.exercise_id === exerciseId ? r.substitute_id : r.exercise_id,
      ),
    ),
  ];
  if (otherIds.length === 0) return [];

  const { data: exercises, error: exErr } = await supabase
    .from("exercises")
    .select("id, name, media_url")
    .in("id", otherIds);
  if (exErr || !exercises) return [];

  return exercises.map((e) => ({
    id: e.id,
    name: e.name,
    mediaUrl: e.media_url,
  }));
}
