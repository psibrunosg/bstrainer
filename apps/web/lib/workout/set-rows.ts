import type { PerformedSet, PrescribedSet } from "@bstrainer/domain";
import type { LastPerformance } from "./history-lookup";

export interface SetDraft {
  reps: number;
  load: string;
  rpe: string;
}

export type SetRowState = "confirmed" | "active" | "preview";

export interface SetRow {
  index: number;
  state: SetRowState;
  target?: PrescribedSet;
  anterior?: LastPerformance;
  confirmedSet?: PerformedSet;
  draft?: SetDraft;
}

/**
 * Monta a lista de linhas da tabela de séries a partir do estado bruto:
 * índices < confirmedSets.length são `confirmed` (dado real), o próximo
 * índice é sempre `active` (editável, único ponto de confirmação), e
 * qualquer índice além disso é `preview` (só leitura, meta futura).
 */
export function buildSetRows(params: {
  confirmedSets: PerformedSet[];
  rowCount: number;
  targetAt: (index: number) => PrescribedSet | undefined;
  anteriorAt: (index: number) => LastPerformance | undefined;
  draftAt: (index: number) => SetDraft;
}): SetRow[] {
  const { confirmedSets, rowCount, targetAt, anteriorAt, draftAt } = params;
  const total = Math.max(rowCount, confirmedSets.length + 1);
  const rows: SetRow[] = [];

  for (let index = 0; index < total; index++) {
    if (index < confirmedSets.length) {
      rows.push({
        index,
        state: "confirmed",
        confirmedSet: confirmedSets[index],
        target: targetAt(index),
        anterior: anteriorAt(index),
      });
    } else if (index === confirmedSets.length) {
      rows.push({
        index,
        state: "active",
        draft: draftAt(index),
        target: targetAt(index),
        anterior: anteriorAt(index),
      });
    } else {
      rows.push({
        index,
        state: "preview",
        target: targetAt(index),
        anterior: anteriorAt(index),
      });
    }
  }

  return rows;
}
