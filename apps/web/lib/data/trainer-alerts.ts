import {
  listActiveClientLinksForAlerts,
  loadCompletedClientSessionsForAlerts,
} from "./trainer-alert-sources";
import { createClient } from "../supabase/client";

export type AlertType = "inactive" | "high_fatigue" | "plan_ending";

export interface ClientExceptionAlert {
  id: string;
  clientId: string;
  clientName: string;
  type: AlertType;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  lastActiveDate: string | null;
  actionUrl: string;
  actionLabel: string;
}

export type AlertLoadResult =
  | { ok: true; alerts: ClientExceptionAlert[] }
  | { ok: false; error: string };

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CONCURRENT_SESSION_LOADS = 4;

interface ActivePlanRow {
  id: string;
  client_id: string;
  start_date: string;
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]!, index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Algoritmo de consolidação de alertas de exceção para personal trainers:
 * 1. Sem treinar há >3 dias
 * 2. Esforço acima do alvo por 2 sessões consecutivas
 * 3. Programa próximo do término (<= 1 semana restante)
 */
export async function getClientExceptionAlerts(): Promise<AlertLoadResult> {
  const clientResult = await listActiveClientLinksForAlerts();
  if (!clientResult.ok) return clientResult;

  const activeClients = clientResult.clients.filter((client) => client.client_id);
  const alerts: ClientExceptionAlert[] = [];

  if (activeClients.length > 0) {
    const supabase = createClient();
    const now = Date.now();
    const clientIds = [
      ...new Set(activeClients.map((client) => client.client_id!)),
    ];
    const [sessionResults, planResult] = await Promise.all([
      mapWithConcurrency(
        activeClients,
        MAX_CONCURRENT_SESSION_LOADS,
        (client) => loadCompletedClientSessionsForAlerts(client.client_id!),
      ),
      supabase
        .from("training_plans")
        .select("id, client_id, start_date")
        .in("client_id", clientIds)
        .eq("status", "active")
        .order("start_date", { ascending: false }),
    ]);

    for (const sessionResult of sessionResults) {
      if (!sessionResult.ok) return sessionResult;
    }

    if (planResult.error) {
      return { ok: false, error: "Falha ao carregar a ficha ativa do aluno." };
    }

    const latestPlanByClient = new Map<string, ActivePlanRow>();
    const sortedPlanRows = [...(planResult.data ?? [])].sort((a, b) => {
      const startDateDifference =
        Date.parse(b.start_date) - Date.parse(a.start_date);
      return startDateDifference || b.id.localeCompare(a.id);
    });
    for (const plan of sortedPlanRows) {
      if (!latestPlanByClient.has(plan.client_id)) {
        latestPlanByClient.set(plan.client_id, plan);
      }
    }

    const planIds = [...latestPlanByClient.values()].map((plan) => plan.id);
    const totalWeeksByPlan = new Map<string, number>();
    if (planIds.length > 0) {
      const { data: mesocycleRows, error: mesocycleError } = await supabase
        .from("mesocycles")
        .select("plan_id, weeks")
        .in("plan_id", planIds);

      if (mesocycleError) {
        return { ok: false, error: "Falha ao carregar o ciclo do aluno." };
      }

      for (const mesocycle of mesocycleRows ?? []) {
        totalWeeksByPlan.set(
          mesocycle.plan_id,
          (totalWeeksByPlan.get(mesocycle.plan_id) ?? 0) + mesocycle.weeks,
        );
      }
    }

    for (const [clientIndex, client] of activeClients.entries()) {
      const clientId = client.client_id!;
      const clientName = client.name || "Aluno sem nome";

      const sessionResult = sessionResults[clientIndex]!;
      if (!sessionResult.ok) return sessionResult;

      const sortedSessions = [...sessionResult.sessions].sort(
        (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
      );
      const lastSession = sortedSessions[0];
      const lastActiveMs = lastSession ? Date.parse(lastSession.startedAt) : 0;
      const lastActiveDate = lastSession
        ? new Date(lastSession.startedAt).toLocaleDateString("pt-BR")
        : "Nunca";

      if (!lastSession || now - lastActiveMs > THREE_DAYS_MS) {
        const daysInactive = lastSession
          ? Math.floor((now - lastActiveMs) / DAY_MS)
          : 0;
        alerts.push({
          id: `inactive-${clientId}`,
          clientId,
          clientName,
          type: "inactive",
          severity: "high",
          title: "Ausência Crítica (>3 dias)",
          description: lastSession
            ? `Aluno sem treinar há ${daysInactive} dias. Último registro em ${lastActiveDate}.`
            : "Aluno ativo ainda não registrou nenhum treino no sistema.",
          lastActiveDate,
          actionUrl: `/messages?id=${clientId}&name=${encodeURIComponent(clientName)}`,
          actionLabel: "Enviar Mensagem no Chat",
        });
      }

      if (sortedSessions.length >= 2) {
        const [s1, s2] = sortedSessions;
        const s1High =
          (s1?.readiness?.soreness && s1.readiness.soreness >= 4) ||
          (s1?.readiness?.energy && s1.readiness.energy <= 2);
        const s2High =
          (s2?.readiness?.soreness && s2.readiness.soreness >= 4) ||
          (s2?.readiness?.energy && s2.readiness.energy <= 2);

        if (s1High && s2High) {
          alerts.push({
            id: `fatigue-${clientId}`,
            clientId,
            clientName,
            type: "high_fatigue",
            severity: "medium",
            title: "Fadiga Estourada (2x consecutivas)",
            description:
              "Esforço percebido e dor muscular persistentemente elevados nas últimas 2 sessões. Considere programar um deload ou reduzir volume.",
            lastActiveDate,
            actionUrl: `/plans/templates?client=${clientId}&name=${encodeURIComponent(clientName)}`,
            actionLabel: "Ajustar Cargas ou Ficha",
          });
        }
      }

      const planRow = latestPlanByClient.get(clientId);
      if (planRow) {
        const totalWeeks = totalWeeksByPlan.get(planRow.id);
        if (totalWeeks != null) {
          const elapsedWeeks = Math.floor(
            (now - Date.parse(planRow.start_date)) / (7 * DAY_MS),
          );
          const weeksRemaining = totalWeeks - elapsedWeeks;

          if (weeksRemaining <= 1) {
            alerts.push({
              id: `ending-${clientId}`,
              clientId,
              clientName,
              type: "plan_ending",
              severity: weeksRemaining <= 0 ? "high" : "low",
              title:
                weeksRemaining <= 0
                  ? "Programa Expirado"
                  : "Programa Próximo do Término (<=1 sem)",
              description:
                weeksRemaining <= 0
                  ? `O mesociclo de ${totalWeeks} semanas terminou. É necessário periodizar o próximo ciclo.`
                  : `Resta menos de 1 semana no mesociclo atual (${elapsedWeeks}/${totalWeeks} sem concluídas).`,
              lastActiveDate,
              actionUrl: `/plans/templates?client=${clientId}&name=${encodeURIComponent(clientName)}`,
              actionLabel: "Criar Novo Plano",
            });
          }
        }
      } else {
        alerts.push({
          id: `noplan-${clientId}`,
          clientId,
          clientName,
          type: "plan_ending",
          severity: "medium",
          title: "Sem Ficha Ativa",
          description: "O aluno não possui um plano de treino ativo vinculado.",
          lastActiveDate,
          actionUrl: `/plans/templates?client=${clientId}&name=${encodeURIComponent(clientName)}`,
          actionLabel: "Atribuir Template de Ficha",
        });
      }
    }
  }

  const severityWeight = { high: 3, medium: 2, low: 1 };
  alerts.sort(
    (a, b) => severityWeight[b.severity] - severityWeight[a.severity],
  );

  return { ok: true, alerts };
}
