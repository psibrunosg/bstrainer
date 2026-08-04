import { createClient } from "@/lib/supabase/client";
import { exerciseName as localName, loadCatalogExercises } from "@/lib/workout/exercises";

export interface RemoteExerciseInfo {
  name: string;
  mediaUrl: string | null;
}

let remoteCache: Map<string, RemoteExerciseInfo> | null = null;

/**
 * Mapa id->{name,mediaUrl} do banco (exercícios globais + da org). Fonte de
 * verdade pra exercícios prescritos via template/plano — esses referenciam
 * o catálogo "custom" seedado direto no Supabase, que nunca existiu no
 * catálogo estático hardcoded do logger (lib/workout/exercises.ts).
 */
export async function loadRemoteExerciseCatalog(): Promise<Map<string, RemoteExerciseInfo>> {
  if (remoteCache) return remoteCache;
  const supabase = createClient();
  const { data } = await supabase.from("exercises").select("id, name, media_url");
  const map = new Map<string, RemoteExerciseInfo>();
  for (const row of (data ?? []) as { id: string; name: string; media_url: string | null }[]) {
    map.set(row.id, { name: row.name, mediaUrl: row.media_url });
  }
  remoteCache = map;
  return map;
}

/**
 * Mapa id->nome do banco (exercícios globais + da org), com fallback pros
 * nomes locais hardcoded do logger. Usado pra rotular gráficos.
 */
export async function loadExerciseNames(): Promise<
  (id: string) => string
> {
  await loadCatalogExercises();
  const map = await loadRemoteExerciseCatalog();
  return (id: string) => map.get(id)?.name ?? localName(id);
}
