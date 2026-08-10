import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listActiveClientLinksForAlerts,
  loadCompletedClientSessionsForAlerts,
} from "./trainer-alert-sources";
import * as supabaseMod from "../supabase/client";
import * as storageMod from "@/lib/workout/storage";

vi.mock("../supabase/client");
vi.mock("@/lib/workout/storage");

const fromMock = vi.fn();
const linkSelectMock = vi.fn();
const linkEqMock = vi.fn();
const linkOrderMock = vi.fn();
const sessionSelectMock = vi.fn();
const sessionEqMock = vi.fn();
const sessionOrderMock = vi.fn();
const sessionLimitMock = vi.fn();
const currentUser = { id: "trainer-a" };

function linkQueryResult(result: { data: unknown; error: unknown }) {
  linkOrderMock.mockResolvedValue(result);
}

function sessionQueryResult(result: { data: unknown; error: unknown }) {
  sessionLimitMock.mockResolvedValue(result);
}

function makeSupabase(user: { id: string } | null = currentUser) {
  const linkQuery = {
    select: linkSelectMock.mockReturnThis(),
    eq: linkEqMock.mockReturnThis(),
    order: linkOrderMock,
  };
  const sessionQuery = {
    select: sessionSelectMock.mockReturnThis(),
    eq: sessionEqMock.mockReturnThis(),
    order: sessionOrderMock.mockReturnThis(),
    limit: sessionLimitMock,
  };
  fromMock.mockImplementation((table: string) =>
    table === "client_links" ? linkQuery : sessionQuery,
  );
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: fromMock,
  };
}

describe("trainer alert sources", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    linkQueryResult({ data: [], error: null });
    sessionQueryResult({ data: [], error: null });
    vi.mocked(supabaseMod.createClient).mockReturnValue(makeSupabase() as never);
  });

  it("distinguishes an empty link list from a query failure", async () => {
    linkQueryResult({ data: null, error: { message: "offline" } });

    await expect(listActiveClientLinksForAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar alunos.",
    });
    expect(linkEqMock).toHaveBeenCalledWith("status", "active");
    expect(linkEqMock).toHaveBeenCalledWith("trainer_id", "trainer-a");
  });

  it("returns an explicit error when the trainer session has expired", async () => {
    vi.mocked(supabaseMod.createClient).mockReturnValue(makeSupabase(null) as never);

    await expect(listActiveClientLinksForAlerts()).resolves.toEqual({
      ok: false,
      error: "Sessão expirada.",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("never falls back to IndexedDB for another athlete", async () => {
    sessionQueryResult({ data: [], error: null });

    await expect(loadCompletedClientSessionsForAlerts("client-a")).resolves.toEqual({
      ok: true,
      sessions: [],
    });
    expect(sessionEqMock).toHaveBeenCalledWith("client_id", "client-a");
    expect(sessionEqMock).toHaveBeenCalledWith("status", "completed");
    expect(storageMod.loadSessionHistory).not.toHaveBeenCalled();
  });

  it("loads only the two newest scalar readiness summaries", async () => {
    sessionQueryResult({
      data: [
        {
          started_at: "2026-08-09T12:00:00.000Z",
          readiness_soreness: 4,
          readiness_energy: null,
        },
      ],
      error: null,
    });

    await expect(loadCompletedClientSessionsForAlerts("client-a")).resolves.toEqual({
      ok: true,
      sessions: [
        {
          startedAt: "2026-08-09T12:00:00.000Z",
          readiness: { soreness: 4, energy: null },
        },
      ],
    });
    expect(sessionSelectMock).toHaveBeenCalledWith(
      "started_at, readiness_soreness, readiness_energy",
    );
    expect(sessionOrderMock).toHaveBeenCalledWith("started_at", {
      ascending: false,
    });
    expect(sessionLimitMock).toHaveBeenCalledWith(2);
  });

  it("distinguishes a session query failure from an empty history", async () => {
    sessionQueryResult({ data: null, error: { message: "offline" } });

    await expect(loadCompletedClientSessionsForAlerts("client-a")).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar sessões do aluno.",
    });
  });
});
