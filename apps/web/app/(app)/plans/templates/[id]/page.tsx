import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate, templateLibrary } from "@bstrainer/engine";

export function generateStaticParams() {
  return templateLibrary.map((t) => ({ id: t.id }));
}

const EMPHASIS_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  power: "Potência",
  deload: "Deload",
  intro: "Introdução",
};

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <div>
        <Link href="/plans/templates" className="text-sm text-zinc-500">
          ← Templates
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{template.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">{template.rationale}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold text-zinc-300">
          Regra de progressão
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{template.progressionRule}</p>
      </div>

      {template.mesocycles.map((meso, i) => (
        <section key={i} className="space-y-3">
          <h2 className="font-semibold">
            Mesociclo {i + 1} · {meso.weeks} semanas ·{" "}
            {EMPHASIS_LABEL[meso.emphasis] ?? meso.emphasis}
          </h2>
          {meso.workouts.map((w) => (
            <div
              key={w.name}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <h3 className="font-medium">{w.name}</h3>
              <ul className="mt-2 space-y-1.5">
                {w.exercises.map((ex, j) => (
                  <li key={j} className="flex justify-between text-sm">
                    <span className="text-zinc-300">
                      {ex.suggestedVariant}
                    </span>
                    <span className="text-zinc-500">
                      {ex.setScheme.setCount}×{ex.setScheme.repsMin}
                      {ex.setScheme.repsMax !== ex.setScheme.repsMin &&
                        `–${ex.setScheme.repsMax}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-zinc-100 px-4 py-3 font-medium text-zinc-900 opacity-50"
        title="Disponível quando o banco estiver conectado"
      >
        Usar este template (em breve)
      </button>
    </div>
  );
}
