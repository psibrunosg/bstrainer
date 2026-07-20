import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate, templateLibrary } from "@bstrainer/engine";
import { UseTemplateButton } from "@/components/UseTemplateButton";

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

const ACTIVITY_LABEL: Record<string, string> = {
  running: "Corrida",
  cycling: "Ciclismo",
  swimming: "Natação",
  rowing: "Remo",
  walking: "Caminhada",
  elliptical: "Elíptico",
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
        <Link
          href="/plans/templates"
          className="text-sm text-mute transition-colors duration-200 hover:text-text"
        >
          ← Templates
        </Link>
        <h1 className="mt-2 font-display text-[28px] font-extrabold uppercase tracking-tight">
          {template.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {template.rationale}
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="caps-label font-display font-semibold text-mute">
          Regra de progressão
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text">
          {template.progressionRule}
        </p>
      </div>

      {template.mesocycles.map((meso, i) => (
        <section key={i} className="space-y-3">
          <h2 className="caps-label font-display font-semibold text-mute">
            Mesociclo {i + 1} · {meso.weeks} semanas ·{" "}
            {EMPHASIS_LABEL[meso.emphasis] ?? meso.emphasis}
          </h2>
          {meso.workouts.map((w) => (
            <div
              key={w.name}
              className="rounded-lg border border-line bg-surface p-4"
            >
              <h3 className="font-semibold text-text">{w.name}</h3>
              <ul className="mt-2">
                {w.blocks.map((block, j) => (
                  <li
                    key={j}
                    className="flex justify-between border-b border-line py-1.5 text-sm last:border-b-0"
                  >
                    {block.kind === "exercise" && (
                      <>
                        <span className="text-text">{block.suggestedVariant}</span>
                        <span className="tnum text-mute">
                          {block.setScheme.setCount}×{block.setScheme.repsMin}
                          {block.setScheme.repsMax !== block.setScheme.repsMin &&
                            `–${block.setScheme.repsMax}`}
                        </span>
                      </>
                    )}
                    {block.kind === "activity" && (
                      <>
                        <span className="text-text">
                          {ACTIVITY_LABEL[block.activityType] ?? block.activityType}
                        </span>
                        <span className="tnum text-mute">
                          {block.durationMinutes ? `${block.durationMinutes} min` : ""}
                          {block.distanceKm ? ` ${block.distanceKm}km` : ""}
                        </span>
                      </>
                    )}
                    {block.kind === "circuit" && (
                      <>
                        <span className="text-text">Circuito</span>
                        <span className="tnum text-mute">
                          {block.rounds}× {block.workSeconds}s/{block.restSeconds}s
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <UseTemplateButton templateId={template.id} />
    </div>
  );
}
