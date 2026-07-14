import { createClient } from "@/lib/supabase/client";
import { exerciseName as localName } from "@/lib/workout/exercises";

/**
 * Mapa id->nome do banco (exercícios globais + da org), com fallback pros
 * nomes locais hardcoded do logger. Usado pra rotular gráficos.
 */
export async function loadExerciseNames(): Promise<
  (id: string) => string
> {
  const supabase = createClient();
  const { data } = await supabase.from("exercises").select("id, name");
  const map = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; name: string }[]) {
    map.set(row.id, row.name);
  }
  return (id: string) => map.get(id) ?? localName(id);
}
