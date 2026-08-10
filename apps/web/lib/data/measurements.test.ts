import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteMeasurement,
  listMeasurements,
  saveMeasurement,
  type MeasurementInput,
} from "./measurements";
import * as clientsMod from "./clients";
import * as supabaseMod from "../supabase/client";

vi.mock("./clients");
vi.mock("../supabase/client");

const currentUser = { id: "trainer-a" };
const measurementRow = {
  id: "measurement-a",
  user_id: "trainer-a",
  measured_at: "2026-08-10",
  weight_kg: 80,
  body_fat_pct: null,
  chest_cm: null,
  waist_cm: 90,
  hip_cm: null,
  bicep_right_cm: null,
  thigh_right_cm: null,
  notes: null,
  created_at: "2026-08-10T12:00:00.000Z",
};

const validInput: MeasurementInput = {
  measuredAt: "2026-08-10",
  weightKg: 80,
  bodyFatPct: null,
  chestCm: null,
  waistCm: 90,
  hipCm: null,
  bicepRightCm: null,
  thighRightCm: null,
  notes: null,
};

const fromMock = vi.fn();
const selectMock = vi.fn();
const orderMock = vi.fn();
const upsertMock = vi.fn();
const deleteMock = vi.fn();
const eqMock = vi.fn();
const hasActiveClientLinkMock = vi.mocked(clientsMod.hasActiveClientLink);

function selectResult(result: { data: unknown; error: unknown }) {
  orderMock.mockResolvedValue(result);
}

function makeSupabase(user: { id: string } | null = currentUser) {
  const measurements = {
    select: selectMock.mockReturnThis(),
    order: orderMock,
    upsert: upsertMock,
    delete: deleteMock,
    eq: eqMock.mockReturnThis(),
  };

  fromMock.mockReturnValue(measurements);
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: fromMock,
  };
}

describe("measurements data", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    selectResult({ data: [measurementRow], error: null });
    upsertMock.mockResolvedValue({ error: null });
    deleteMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnThis();
    hasActiveClientLinkMock.mockResolvedValue(false);
    vi.mocked(supabaseMod.createClient).mockReturnValue(makeSupabase() as never);
  });

  it("rejects an unlinked client before querying measurements", async () => {
    hasActiveClientLinkMock.mockResolvedValue(false);

    const result = await listMeasurements("client-b");

    expect(result).toEqual({ ok: false, error: "Aluno sem vínculo ativo com você." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not turn a select error into an empty list", async () => {
    selectResult({ data: null, error: { message: "offline" } });

    await expect(listMeasurements()).resolves.toEqual({
      ok: false,
      error: "Falha ao carregar medições.",
    });
  });

  it("writes a linked client's id instead of the trainer id", async () => {
    hasActiveClientLinkMock.mockResolvedValue(true);

    await saveMeasurement(validInput, "client-a");

    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: "client-a" }));
  });

  it("lists the authenticated user's measurements", async () => {
    await expect(listMeasurements()).resolves.toEqual({
      ok: true,
      measurements: [
        {
          id: "measurement-a",
          userId: "trainer-a",
          measuredAt: "2026-08-10",
          weightKg: 80,
          bodyFatPct: null,
          chestCm: null,
          waistCm: 90,
          hipCm: null,
          bicepRightCm: null,
          thighRightCm: null,
          notes: null,
          createdAt: "2026-08-10T12:00:00.000Z",
        },
      ],
    });
  });

  it("saves a measurement for the authenticated user", async () => {
    await expect(saveMeasurement(validInput)).resolves.toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: "trainer-a" }));
  });

  it("lists an active linked client's measurements", async () => {
    hasActiveClientLinkMock.mockResolvedValue(true);

    await expect(listMeasurements("client-a")).resolves.toMatchObject({ ok: true });
    expect(eqMock).toHaveBeenCalledWith("user_id", "client-a");
  });

  it("deletes a measurement for an active linked client", async () => {
    hasActiveClientLinkMock.mockResolvedValue(true);

    await expect(deleteMeasurement("measurement-a", "client-a")).resolves.toEqual({ ok: true });
    expect(eqMock).toHaveBeenCalledWith("id", "measurement-a");
    expect(eqMock).toHaveBeenCalledWith("user_id", "client-a");
  });

  it("returns an expired-session error without querying", async () => {
    vi.mocked(supabaseMod.createClient).mockReturnValue(makeSupabase(null) as never);

    await expect(listMeasurements()).resolves.toEqual({ ok: false, error: "Sessão expirada." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns an explicit error when deletion fails", async () => {
    const failingDeleteQuery = { eq: vi.fn() };
    failingDeleteQuery.eq
      .mockReturnValueOnce(failingDeleteQuery)
      .mockResolvedValueOnce({ error: { message: "offline" } });
    deleteMock.mockReturnValue(failingDeleteQuery);

    await expect(deleteMeasurement("measurement-a")).resolves.toEqual({
      ok: false,
      error: "Falha ao remover medição.",
    });
  });
});
