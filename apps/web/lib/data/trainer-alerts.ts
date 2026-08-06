import { loadSessions } from "./sessions";
import { listClientLinks, type ClientLink } from "./clients";
import { createClient } from "../supabase/client";
import type { WorkoutSession } from "@bstrainer/domain";

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

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Algoritmo de consolidação de alertas de exceção para personal trainers:
 * 1. Sem treinar há >3 dias
 * 2. Esforço acima do alvo por 2 sessões consecutivas
 * 3. Programa próximo do término (<= 1 semana restante)
 */
export async function getClientExceptionAlerts(): Promise<{
  alerts: ClientExceptionAlert[];
  isDemo: boolean;
}> {
  const links = await listClientLinks();
  const activeClients = links.filter((l) => l.status === "active" && l.client_id);

  const alerts: ClientExceptionAlert[] = [];

  if (activeClients.length > 0) {
    const supabase = createClient();
    const now = Date.now();

    for (const client of activeClients) {
      const clientId = client.client_id!;
      const clientName = client.name || "Aluno sem nome";

      const sessions = await loadSessions(clientId);
      const sortedSessions = [...sessions].sort(
        (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)
      );

      const lastSession = sortedSessions[0];
      const lastActiveMs = lastSession ? Date.parse(lastSession.startedAt) : 0;
      const lastActiveDate = lastSession
        ? new Date(lastSession.startedAt).toLocaleDateString("pt-BR")
        : "Nunca";

      // 1. Ausência / sem treinar há > 3 dias
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

      // 2. Esforço acima do alvo por 2 sessões consecutivas ou fadiga elevada
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

      // 3. Programa próximo do término
      const { data: planRow } = await supabase
        .from("training_plans")
        .select("id, start_date")
        .eq("client_id", clientId)
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planRow) {
        const { data: mesoRows } = await supabase
          .from("mesocycles")
          .select("weeks")
          .eq("plan_id", planRow.id);

        if (mesoRows && mesoRows.length > 0) {
          const totalWeeks = mesoRows.reduce(
            (acc, m: { weeks: number }) => acc + m.weeks,
            0
          );
          const elapsedWeeks = Math.floor(
            (now - Date.parse(planRow.start_date)) / (7 * DAY_MS)
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

  // Se não houver alertas reais (ou em ambiente com poucos dados), fornece dados simulados para QA desktop
  if (alerts.length === 0) {
    return {
      isDemo: true,
      alerts: [
        {
          id: "sim-1",
          clientId: "demo-client-1",
          clientName: "Lucas Mendes (Simulado)",
          type: "inactive",
          severity: "high",
          title: "Ausência Crítica (>3 dias)",
          description:
            "Aluno sem treinar há 5 dias. O padrão histórico era 4 vezes por semana no período da manhã.",
          lastActiveDate: "01/08/2026",
          actionUrl: "/messages?id=demo-1&name=Lucas%20Mendes",
          actionLabel: "Cobrar pelo Chat",
        },
        {
          id: "sim-2",
          clientId: "demo-client-2",
          clientName: "Carolina Silva (Simular)",
          type: "high_fatigue",
          severity: "medium",
          title: "Fadiga Estourada (Esforço Acima do Alvo)",
          description:
            "Relatou RPE 9.5 e fadiga muscular 5/5 nos últimos dois treinos de membros inferiores (Leg Day A & B).",
          lastActiveDate: "Ontem",
          actionUrl: "/plans/templates",
          actionLabel: "Revisar Ficha & Deload",
        },
        {
          id: "sim-3",
          clientId: "demo-client-3",
          clientName: "Mariana Costa (Simulado)",
          type: "plan_ending",
          severity: "low",
          title: "Programa Próximo do Término",
          description:
            "Concluindo a semana 7 do mesociclo de Hipertrofia de 8 semanas. Pronto para progressão de bloco.",
          lastActiveDate: "Hoje",
          actionUrl: "/plans/new",
          actionLabel: "Planejar Próximo Mesociclo",
        },
      ],
    };
  }

  // Ordenar por gravidade: high -> medium -> low
  const sevWeight = { high: 3, medium: 2, low: 1 };
  alerts.sort((a, b) => sevWeight[b.severity] - sevWeight[a.severity]);

  return { alerts, isDemo: false };
}
