"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LoadType } from "@bstrainer/domain";
import { usePlanFromTemplate } from "@/lib/data/plans";

const EQUIPMENT: { key: LoadType; label: string }[] = [
  { key: "barbell", label: "Barra" },
  { key: "dumbbell", label: "Halteres" },
  { key: "machine", label: "Máquinas" },
  { key: "cable", label: "Cabos" },
  { key: "bodyweight", label: "Peso do corpo" },
  { key: "kettlebell", label: "Kettlebell" },
  { key: "band", label: "Elástico" },
];

const FULL_GYM: LoadType[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
];

export function UseTemplateButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<LoadType>>(new Set(FULL_GYM));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(key: LoadType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await usePlanFromTemplate(templateId, [...selected]);
      if (result.ok) {
        router.push("/plans");
      } else {
        setError(result.error ?? "Falha ao criar plano.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
      >
        Usar este template
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
      <div>
        <h3 className="font-display text-lg font-semibold">Seu equipamento</h3>
        <p className="mt-1 text-sm text-mute">
          Marcaremos exercícios conforme o que você tem disponível.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT.map((e) => {
          const on = selected.has(e.key);
          return (
            <button
              key={e.key}
              type="button"
              onClick={() => toggle(e.key)}
              className={`h-10 rounded-full border px-4 text-sm font-medium transition ${
                on
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-line bg-ink text-mute"
              }`}
            >
              {e.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-err">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={pending || selected.size === 0}
          className="h-12 flex-1 rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
        >
          {pending ? "Criando plano…" : "Criar plano"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-12 rounded-lg border border-line px-4 text-sm text-mute transition active:bg-surface-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
