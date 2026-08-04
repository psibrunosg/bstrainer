/**
 * Lista hardcoded de exercícios comuns (MVP do logger).
 * IDs fixos (UUID v4) para que o histórico continue válido quando
 * a tabela de exercícios migrar para o Supabase.
 */
import { publicAssetPath } from "@/lib/public-asset";

export interface ExerciseOption {
  id: string;
  name: string;
  mediaUrl?: string | null;
  primaryMuscles?: string[];
  loadType?: string;
}

const LOCAL_EXERCISES: ExerciseOption[] = [
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000001", name: "Agachamento livre" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000002", name: "Supino reto" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000003", name: "Levantamento terra" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000004", name: "Remada curvada" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000005", name: "Desenvolvimento militar" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000006", name: "Puxada frontal" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000007", name: "Barra fixa" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000008", name: "Leg press" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000009", name: "Stiff" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000010", name: "Rosca direta" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000011", name: "Tríceps corda" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000012", name: "Elevação lateral" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000013", name: "Mesa flexora" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000014", name: "Cadeira extensora" },
  { id: "5b6f3f2a-1c9d-4e8b-9a01-000000000015", name: "Prancha" },
];

function hasaneyldrmMediaUrl(id: string): string | null {
  const externalId = id.match(/^b1d7a80a-0000-4000-8000-(\d{12})$/)?.[1];
  return externalId ? `/exercise-media/bstrainer/${externalId.slice(-4)}.gif` : null;
}

let cache: ExerciseOption[] | null = null;

// ponytail: catalog moved to public/exercises.json to keep it out of the JS
// bundle; fetched once and cached in-memory for the session.
export async function loadCatalogExercises(): Promise<ExerciseOption[]> {
  if (cache) return cache;

  const [jsonRes, dbRes] = await Promise.all([
    fetch(publicAssetPath("/exercises.json")!),
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("exercises")
          .select("id, primary_muscles, load_type");
        return data ?? [];
      } catch {
        return [];
      }
    })(),
  ]);

  const catalog = (await jsonRes.json()) as { id: string; name: string }[];
  const metaMap = new Map<string, { primaryMuscles: string[]; loadType: string }>();
  for (const row of dbRes as { id: string; primary_muscles: string[] | null; load_type: string | null }[]) {
    metaMap.set(row.id, {
      primaryMuscles: row.primary_muscles ?? [],
      loadType: row.load_type ?? "barbell",
    });
  }

  cache = [
    ...LOCAL_EXERCISES,
    ...catalog.map((exercise) => {
      const meta = metaMap.get(exercise.id);
      return {
        ...exercise,
        mediaUrl: hasaneyldrmMediaUrl(exercise.id),
        primaryMuscles: meta?.primaryMuscles,
        loadType: meta?.loadType,
      };
    }),
  ];
  return cache;
}

export function exerciseName(exerciseId: string): string {
  return (
    (cache ?? LOCAL_EXERCISES).find((e) => e.id === exerciseId)?.name ??
    "Exercício removido"
  );
}
