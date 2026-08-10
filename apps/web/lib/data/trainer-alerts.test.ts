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
const fromMock = vi.fn();
const planInMock = vi.fn();
const planEqMock = vi.fn();
const planOrderMock = vi.fn();
const mesocycleInMock = vi.fn();

const ana = {
  id: "link-ana",
  status: "active",
  client_id: "client-ana",
  name: "Ana Souza",
  invite_email: "ana@example.com",
};

const bia = {
  id: "link-bia",
  status: "active",
  client_id: "client-bia",
  name: "Bia Lima",
  invite_email: "bia@example.com",
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
  planResult: {
    data: { id: string; client_id: string; start_date: string }[] | null;
    error?: unknown;
  } = { data: [] },
  mesocycleResult: {
    data: { plan_id: string; weeks: number }[] | null;
    error?: unknown;
  } = {
    data: [],
  },
) {
  const planQuery = {
    select: vi.fn().mockReturnThis(),
    in: planInMock.mockReturnThis(),
    eq: planEqMock.mockReturnThis(),
    order: planOrderMock.mockReturnThis(),
    then: (
      onFulfilled: (value: typeof planResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(planResult).then(onFulfilled, onRejected),
  };
  const mesocycleQuery = {
    select: vi.fn().mockReturnThis(),
    in: mesocycleInMock.mockReturnThis(),
    then: (
      onFulfilled: (value: typeof mesocycleResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(mesocycleResult).then(onFulfilled, onRejected),
  };
  fromMock.mockImplementation((table: string) =>
    table === "training_plans" ? planQuery : mesocycleQuery,
  );
  vi.mocked(supabaseMod.createClient).mockReturnValue({
    from: fromMock,
  } as never);
}

function sourceFixtureWithNoExceptions() {
  listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
  loadSessionsMock.mockResolvedValue({
    ok: true,
    sessions: [session("2026-08-09T12:00:00.000Z")],
  });
  setPlanQueries(
    {
      data: [
        {
          id: "plan-ana",
          client_id: "client-ana",
          start_date: "2026-08-03T00:00:00.000Z",
        },
      ],
    },
    { data: [{ plan_id: "plan-ana", weeks: 8 }] },
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
    setPlanQueries();
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
      {
        data: [
          {
            id: "plan-ana",
            client_id: "client-ana",
            start_date: "2026-08-03T00:00:00.000Z",
          },
        ],
      },
      { data: null, error: { message: "offline" } },
    );

    await expect(getClientExceptionAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar o ciclo do aluno.",
    });
  });

  it("loads active plans and selected-plan mesocycles in two batch queries", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana, bia] });
    loadSessionsMock.mockResolvedValue({
      ok: true,
      sessions: [session("2026-08-09T12:00:00.000Z")],
    });
    setPlanQueries(
      {
        data: [
          {
            id: "plan-ana",
            client_id: "client-ana",
            start_date: "2026-08-03T00:00:00.000Z",
          },
          {
            id: "plan-bia",
            client_id: "client-bia",
            start_date: "2026-08-02T00:00:00.000Z",
          },
        ],
      },
      {
        data: [
          { plan_id: "plan-ana", weeks: 8 },
          { plan_id: "plan-bia", weeks: 10 },
        ],
      },
    );

    await expect(getClientExceptionAlerts()).resolves.toMatchObject({ ok: true });
    expect(planInMock).toHaveBeenCalledTimes(1);
    expect(planInMock).toHaveBeenCalledWith("client_id", [
      "client-ana",
      "client-bia",
    ]);
    expect(mesocycleInMock).toHaveBeenCalledTimes(1);
    expect(mesocycleInMock).toHaveBeenCalledWith("plan_id", [
      "plan-ana",
      "plan-bia",
    ]);
    expect(fromMock.mock.calls.map(([table]) => table)).toEqual([
      "training_plans",
      "mesocycles",
    ]);
  });

  it("chooses the newest active plan even when batch rows are unordered", async () => {
    listActiveClientsMock.mockResolvedValue({ ok: true, clients: [ana] });
    loadSessionsMock.mockResolvedValue({
      ok: true,
      sessions: [session("2026-08-09T12:00:00.000Z")],
    });
    setPlanQueries(
      {
        data: [
          {
            id: "plan-old",
            client_id: "client-ana",
            start_date: "2026-06-01T00:00:00.000Z",
          },
          {
            id: "plan-new",
            client_id: "client-ana",
            start_date: "2026-08-01T00:00:00.000Z",
          },
        ],
      },
      {
        data: [
          { plan_id: "plan-old", weeks: 4 },
          { plan_id: "plan-new", weeks: 8 },
        ],
      },
    );

    const result = await getClientExceptionAlerts();

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.alerts.some((alert) => alert.type === "plan_ending")).toBe(false);
  });

  it("overlaps session loads with an explicit maximum concurrency of four", async () => {
    const clients = Array.from({ length: 6 }, (_, index) => ({
      ...ana,
      id: `link-${index}`,
      client_id: `client-${index}`,
      name: `Aluno ${index}`,
    }));
    let activeLoads = 0;
    let maxActiveLoads = 0;
    listActiveClientsMock.mockResolvedValue({ ok: true, clients });
    loadSessionsMock.mockImplementation(async () => {
      activeLoads += 1;
      maxActiveLoads = Math.max(maxActiveLoads, activeLoads);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeLoads -= 1;
      return { ok: true, sessions: [] };
    });
    setPlanQueries();

    const resultPromise = getClientExceptionAlerts();
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toMatchObject({ ok: true });

    expect(maxActiveLoads).toBe(4);
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
      {
        data: [
          {
            id: "plan-ana",
            client_id: "client-ana",
            start_date: "2026-07-05T00:00:00.000Z",
          },
        ],
      },
      { data: [{ plan_id: "plan-ana", weeks: 6 }] },
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
