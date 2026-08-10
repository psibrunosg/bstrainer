import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutSession } from "@bstrainer/domain";
import { getClientExceptionAlerts } from "./trainer-alerts";
import * as alertSources from "./trainer-alert-sources";
import * as supabaseMod from "../supabase/client";

vi.mock("./trainer-alert-sources");
vi.mock("../supabase/client");

const listActiveClientsMock = vi.mocked(
  alertSources.listActiveClientLinksForAlerts,
);
const loadSessionsMock = vi.mocked(
  alertSources.loadCompletedClientSessionsForAlerts,
);

const ana = {
  id: "link-ana",
  status: "active",
  client_id: "client-ana",
  name: "Ana Souza",
  invite_email: "ana@example.com",
};

const NOW = new Date("2026-08-10T12:00:00.000Z");

function session(
  startedAt: string,
  readiness: WorkoutSession["readiness"] = null,
): WorkoutSession {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    clientId: ana.client_id!,
    workoutTemplateId: null,
    startedAt,
    finishedAt: startedAt,
    status: "completed",
    sessionRpe: null,
    readiness,
    notes: null,
    blocks: [],
  };
}

function setPlanQueries(
  planResult: { data: { id: string; start_date: string } | null; error?: unknown } = {
    data: null,
  },
  mesocycleResult: { data: { weeks: number }[] | null; error?: unknown } = {
    data: [],
  },
) {
  const planQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(planResult),
  };
  const mesocycleQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(mesocycleResult),
  };
  vi.mocked(supabaseMod.createClient).mockReturnValue({
    from: vi.fn((table: string) =>
      table === "training_plans" ? planQuery : mesocycleQuery,
    ),
  } as never);
}

function sourceFixtureWithNoExceptions() {
  listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
  loadSessionsMock.mockResolvedValue({
    ok: true,
    sessions: [session("2026-08-09T12:00:00.000Z")],
  });
  setPlanQueries(
    { data: { id: "plan-ana", start_date: "2026-08-03T00:00:00.000Z" } },
    { data: [{ weeks: 8 }] },
  );
}

describe("getClientExceptionAlerts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("propagates an active-client source failure", async () => {
    listActiveClientsMock.mockResolvedValue({
      ok: false,
      error: "Falha ao carregar alunos.",
    });

    await expect(getClientExceptionAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar alunos.",
    });
  });

  it("returns an empty successful result with no active clients", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [] });

    await expect(getClientExceptionAlerts()).resolves.toEqual({
      ok: true,
      alerts: [],
    });
  });

  it("never returns simulated identifiers", async () => {
    sourceFixtureWithNoExceptions();

    const result = await getClientExceptionAlerts();

    expect(result).toEqual({ ok: true, alerts: [] });
    expect(JSON.stringify(result)).not.toContain("sim-");
  });

  it("propagates a session-source failure", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({
      ok: false,
      error: "Falha ao carregar sessões do aluno.",
    });

    await expect(getClientExceptionAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar sessões do aluno.",
    });
  });

  it("propagates an active-plan query failure", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({ ok: true, sessions: [] });
    setPlanQueries({ data: null, error: { message: "offline" } });

    await expect(getClientExceptionAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar a ficha ativa do aluno.",
    });
  });

  it("propagates a mesocycle query failure", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({ ok: true, sessions: [] });
    setPlanQueries(
      { data: { id: "plan-ana", start_date: "2026-08-03T00:00:00.000Z" } },
      { data: null, error: { message: "offline" } },
    );

    await expect(getClientExceptionAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar o ciclo do aluno.",
    });
  });

  it("detects critical inactivity for an active client", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({ ok: true, sessions: [] });
    setPlanQueries();

    const result = await getClientExceptionAlerts();

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.alerts).toContainEqual(
      expect.objectContaining({
        id: "inactive-client-ana",
        type: "inactive",
        severity: "high",
      }),
    );
  });

  it("detects high fatigue in the two most recent sessions", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({
      ok: true,
      sessions: [
        session("2026-08-08T12:00:00.000Z", {
          sleep: 3,
          soreness: 4,
          energy: 3,
        }),
        session("2026-08-09T12:00:00.000Z", {
          sleep: 3,
          soreness: 3,
          energy: 2,
        }),
      ],
    });
    setPlanQueries();

    const result = await getClientExceptionAlerts();

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.alerts).toContainEqual(
      expect.objectContaining({
        id: "fatigue-client-ana",
        type: "high_fatigue",
        severity: "medium",
      }),
    );
  });

  it("detects an ending plan", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({
      ok: true,
      sessions: [session("2026-08-09T12:00:00.000Z")],
    });
    setPlanQueries(
      { data: { id: "plan-ana", start_date: "2026-07-05T00:00:00.000Z" } },
      { data: [{ weeks: 6 }] },
    );

    const result = await getClientExceptionAlerts();

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.alerts).toContainEqual(
      expect.objectContaining({
        id: "ending-client-ana",
        type: "plan_ending",
        severity: "low",
      }),
    );
  });

  it("orders alerts from high to low severity", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({
      ok: true,
      sessions: [
        session("2026-08-06T12:00:00.000Z", {
          sleep: 3,
          soreness: 4,
          energy: 3,
        }),
        session("2026-08-05T12:00:00.000Z", {
          sleep: 3,
          soreness: 3,
          energy: 2,
        }),
      ],
    });
    setPlanQueries();

    const result = await getClientExceptionAlerts();

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.alerts.map((alert) => alert.severity)).toEqual([
      "high",
      "medium",
      "medium",
    ]);
  });
});
