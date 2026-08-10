import Link from "next/link";
import React, { type ReactElement } from "react";
import { EmptyState } from "@/components/EmptyState";
import type { ClientExceptionAlert } from "@/lib/data/trainer-alerts";

export type AlertPanelState =
  | { status: "loading"; alerts: ClientExceptionAlert[] }
  | { status: "ready"; alerts: ClientExceptionAlert[] }
  | { status: "error"; alerts: ClientExceptionAlert[]; error: string };

const severityStyles: Record<
  ClientExceptionAlert["severity"],
  { border: string; bg: string; badge: string }
> = {
  high: {
    border: "border-err/50",
    bg: "bg-err/5",
    badge: "bg-err/10 text-err border-err/30",
  },
  medium: {
    border: "border-signal/50",
    bg: "bg-signal/5",
    badge: "bg-signal/15 text-signal border-signal/30",
  },
  low: {
    border: "border-line",
    bg: "bg-surface-2/30",
    badge: "bg-surface-2 text-mute border-line",
  },
};

const alertIcons: Record<ClientExceptionAlert["type"], string> = {
  inactive: "⏰",
  high_fatigue: "🔋",
  plan_ending: "📋",
};

export function ClientAlertsPanel({
  state,
  onRetry,
}: {
  state: AlertPanelState;
  onRetry: () => void;
}): ReactElement {
  const showSkeletons = state.status === "loading" && state.alerts.length === 0;
  const showEmptyState = state.status === "ready" && state.alerts.length === 0;

  return (
    <section className="sticky top-6 space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-lg">
      <header>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">⚡</span>
          <h2 className="font-display text-lg font-extrabold text-text">
            Acompanhamento por Exceção
          </h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-mute">
          Priorize alunos sem treinar há mais de 3 dias, com fadiga alta em duas
          sessões ou programa próximo do término.
        </p>
      </header>

      {state.status === "error" && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-err/30 bg-err/5 px-3 py-2 text-xs font-semibold text-err"
        >
          <span>{state.error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-md border border-err/30 px-2.5 py-1.5 text-xs font-bold transition hover:bg-err/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-err focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {showSkeletons && (
        <div role="status" aria-label="Carregando alertas" className="space-y-3">
          <span className="sr-only">Carregando alertas</span>
          <div aria-hidden="true" className="h-24 rounded-xl skeleton-shimmer" />
          <div aria-hidden="true" className="h-24 rounded-xl skeleton-shimmer" />
          <div aria-hidden="true" className="h-24 rounded-xl skeleton-shimmer" />
        </div>
      )}

      {showEmptyState && (
        <EmptyState
          icon={<span aria-hidden="true">🟢</span>}
          title="Zero exceções no momento!"
          description="Todos os alunos ativos estão mantendo a consistência e dentro das metas programadas no mesociclo."
        />
      )}

      {state.alerts.length > 0 && (
        <div className="space-y-3.5">
          {state.alerts.map((alert) => {
            const style = severityStyles[alert.severity];

            return (
              <article
                key={alert.id}
                className={`space-y-3 rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${style.border} ${style.bg}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}
                    >
                      <span aria-hidden="true">{alertIcons[alert.type]}</span>
                      <span>{alert.title}</span>
                    </span>
                    <h3 className="font-display text-base font-extrabold text-text">
                      {alert.clientName}
                    </h3>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-mute">
                    Atividade: {alert.lastActiveDate ?? "Nunca"}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-mute">
                  {alert.description}
                </p>

                <Link
                  href={alert.actionUrl}
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-line bg-surface-2 text-xs font-bold text-text transition hover:bg-signal hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.99]"
                >
                  <span>{alert.actionLabel} →</span>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <footer className="border-t border-line/70 pt-4 text-center">
        <p className="text-[11px] text-mute">
          🎯 O painel atualiza com os envios do logger mobile dos seus alunos.
        </p>
      </footer>
    </section>
  );
}
