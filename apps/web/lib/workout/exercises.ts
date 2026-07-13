/**
 * Lista hardcoded de exercícios comuns (MVP do logger).
 * IDs fixos (UUID v4) para que o histórico continue válido quando
 * a tabela de exercícios migrar para o Supabase.
 */
export interface ExerciseOption {
  id: string;
  name: string;
}

export const EXERCISES: ExerciseOption[] = [
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

export function exerciseName(exerciseId: string): string {
  return (
    EXERCISES.find((e) => e.id === exerciseId)?.name ?? "Exercício removido"
  );
}
