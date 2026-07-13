import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const GOAL_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  power: "Potência",
  endurance: "Resistência",
  health: "Saúde",
  fat_loss: "Emagrecimento",
};

interface PlanRow {
  id: string;
  goal: string;
  status: string;
  start_date: string;
  mesocycles: { count: number }[];
}

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let plans: PlanRow[] = [];
  if (user) {
    const { data } = await supabase
      .from("training_plans")
      .select("id, goal, status, start_date, mesocycles(count)")
      .in("status", ["active", "draft"])
      .order("start_date", { ascending: false });
    plans = (data as PlanRow[] | null) ?? [];
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Fichas
      </h1>

      {plans.length > 0 && (
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
                  {p.mesocycles?.[0]?.count ?? 0} mesociclos · {p.status === "active" ? "ativo" : "rascunho"}
                </p>
              </div>
              <span className="tnum text-xs text-mute">{p.start_date}</span>
            </li>
          ))}
        </ul>
      )}

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
    </div>
  );
}
