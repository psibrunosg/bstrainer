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
const selectMock = vi.fn();
const eqMock = vi.fn();
const orderMock = vi.fn();

function queryResult(result: { data: unknown; error: unknown }) {
  orderMock.mockResolvedValue(result);
}

function makeSupabase() {
  const query = {
    select: selectMock.mockReturnThis(),
    eq: eqMock.mockReturnThis(),
    order: orderMock,
  };
  fromMock.mockReturnValue(query);
  return { from: fromMock };
}

describe("trainer alert sources", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    eqMock.mockReturnThis();
    queryResult({ data: [], error: null });
    vi.mocked(supabaseMod.createClient).mockReturnValue(makeSupabase() as never);
  });

  it("distinguishes an empty link list from a query failure", async () => {
    queryResult({ data: null, error: { message: "offline" } });

    await expect(listActiveClientLinksForAlerts()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar alunos.",
    });
    expect(eqMock).toHaveBeenCalledWith("status", "active");
  });

  it("never falls back to IndexedDB for another athlete", async () => {
    queryResult({ data: [], error: null });

    await expect(loadCompletedClientSessionsForAlerts("client-a")).resolves.toEqual({
      ok: true,
      sessions: [],
    });
    expect(eqMock).toHaveBeenCalledWith("client_id", "client-a");
    expect(eqMock).toHaveBeenCalledWith("status", "completed");
    expect(storageMod.loadSessionHistory).not.toHaveBeenCalled();
  });

  it("distinguishes a session query failure from an empty history", async () => {
    queryResult({ data: null, error: { message: "offline" } });

    await expect(loadCompletedClientSessionsForAlerts("client-a")).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar sessões do aluno.",
    });
  });
});
