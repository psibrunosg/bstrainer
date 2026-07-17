"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlanTemplateSpec } from "@bstrainer/engine";
import { recommendTemplate, templateLibrary } from "@bstrainer/engine";
import { listPlans, type PlanSummary } from "@/lib/data/plans";
import { getMyAthleteProfile } from "@/lib/data/athlete";
import { UseTemplateButton } from "@/components/UseTemplateButton";

const GOAL_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  power: "Potência",
  endurance: "Resistência",
  health: "Saúde",
  fat_loss: "Emagrecimento",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    template: PlanTemplateSpec;
    reasons: string[];
  } | null>(null);

  useEffect(() => {
    listPlans().then((p) => {
      setPlans(p);
      setLoaded(true);
    });
  }, []);

  // Recomendação só faz sentido pra quem ainda não tem plano ativo.
  useEffect(() => {
    if (!loaded || plans.length > 0) return;
    getMyAthleteProfile().then((profile) => {
      if (!profile) return;
      const result = recommendTemplate(profile, templateLibrary);
      if (result) setRecommendation({ template: result.template, reasons: result.reasons });
    });
  }, [loaded, plans.length]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Fichas
      </h1>

      {loaded && plans.length === 0 && recommendation && (
        <div className="space-y-3 rounded-lg border border-signal/30 bg-signal/5 p-4">
          <div>
            <p className="caps-label font-display font-semibold text-signal">
              Recomendado pra você
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              {recommendation.template.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recommendation.reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-mute"
              >
                {reason}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-text">
            {recommendation.template.rationale}
          </p>
          <UseTemplateButton templateId={recommendation.template.id} />
        </div>
      )}

      {loaded && plans.length > 0 && (
        <ul className="space-y-2">
          {plans.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-line bg-surface p-4"
            >
              <div>
                <p className="font-semibold text-text">
                  {GOAL_LABEL[p.goal] ?? p.goal}
                </p>
                <p className="caps-label mt-0.5 text-mute">
                  {p.mesocycleCount} mesociclos ·{" "}
                  {p.status === "active" ? "ativo" : "rascunho"}
                </p>
              </div>
              <span className="tnum text-xs text-mute">{p.start_date}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/plans/templates"
          className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-200 hover:bg-surface-2"
        >
          <h2 className="caps-label font-display font-semibold text-mute">
            Biblioteca de templates
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text">
            {plans.length > 0
              ? "Adicionar outra periodização baseada em literatura."
              : "Comece com uma periodização pronta — linear, hipertrofia, PPL, blocos."}
          </p>
        </Link>

        <Link
          href="/plans/new"
          className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-200 hover:bg-surface-2"
        >
          <h2 className="caps-label font-display font-semibold text-mute">
            Criar ficha manual
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text">
            Monte um treino do zero — exercícios, séries e reps à mão.
          </p>
        </Link>
      </div>
    </div>
  );
}
