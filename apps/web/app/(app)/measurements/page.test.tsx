import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BodyMeasurement } from "@bstrainer/domain";
import MeasurementsPage from "./page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const MeasurementsContent = MeasurementsPage.Content;

const {
  deleteMeasurementMock,
  listMeasurementsMock,
  saveMeasurementMock,
  searchParamsGetMock,
} = vi.hoisted(() => ({
  deleteMeasurementMock: vi.fn(),
  listMeasurementsMock: vi.fn(),
  saveMeasurementMock: vi.fn(),
  searchParamsGetMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsGetMock }),
}));

vi.mock("@/lib/data/measurements", () => ({
  deleteMeasurement: deleteMeasurementMock,
  listMeasurements: listMeasurementsMock,
  saveMeasurement: saveMeasurementMock,
}));

vi.mock("@/components/RequireAthlete", () => ({
  RequireAthlete: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/RequireTrainer", () => ({
  RequireTrainer: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const measurement: BodyMeasurement = {
  id: "measurement-a",
  userId: "client-a",
  measuredAt: "2026-08-09",
  weightKg: 80,
  bodyFatPct: null,
  chestCm: null,
  waistCm: null,
  hipCm: null,
  bicepRightCm: null,
  thighRightCm: null,
  notes: null,
  createdAt: "2026-08-09T12:00:00.000Z",
};

describe("MeasurementsPage", () => {
  beforeEach(() => {
    deleteMeasurementMock.mockReset().mockResolvedValue({ ok: true });
    listMeasurementsMock
      .mockReset()
      .mockResolvedValue({ ok: true, measurements: [] });
    saveMeasurementMock.mockReset().mockResolvedValue({ ok: true });
    searchParamsGetMock.mockReset().mockReturnValue(null);
  });

  it("loads the signed-in athlete's own measurements when client is absent", async () => {
    render(<MeasurementsPage />);

    expect(await screen.findByRole("heading", { name: "Medições" })).toBeInTheDocument();
    expect(listMeasurementsMock).toHaveBeenCalledWith(undefined);
  });

  it("loads the linked client from the URL and names the trainer view", async () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      if (key === "client") return "client-a";
      if (key === "name") return "Ana";
      return null;
    });

    render(<MeasurementsPage />);

    expect(
      await screen.findByRole("heading", { name: "Medições de Ana" }),
    ).toBeInTheDocument();
    expect(listMeasurementsMock).toHaveBeenCalledWith("client-a");
  });

  it("keeps a measurement visible when delete fails", async () => {
    listMeasurementsMock.mockResolvedValue({
      ok: true,
      measurements: [measurement],
    });
    deleteMeasurementMock.mockResolvedValue({
      ok: false,
      error: "Falha ao remover medição.",
    });
    const user = userEvent.setup();

    render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
    await user.click(
      await screen.findByRole("button", { name: /excluir medição/i }),
    );

    expect(screen.getByText("80 kg")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Falha ao remover medição.",
    );
    expect(deleteMeasurementMock).toHaveBeenCalledWith(
      "measurement-a",
      "client-a",
    );
  });

  it("retries a failed initial load", async () => {
    listMeasurementsMock
      .mockResolvedValueOnce({
        ok: false,
        error: "Falha ao carregar medições.",
      })
      .mockResolvedValueOnce({ ok: true, measurements: [] });
    const user = userEvent.setup();

    render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
    await user.click(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    );

    expect(listMeasurementsMock).toHaveBeenLastCalledWith("client-a");
    expect(
      await screen.findByText("Nenhuma medição ainda"),
    ).toBeInTheDocument();
  });

  it("removes a measurement only after deletion is confirmed", async () => {
    listMeasurementsMock.mockResolvedValue({
      ok: true,
      measurements: [measurement],
    });
    let resolveDelete!: (result: { ok: true }) => void;
    deleteMeasurementMock.mockReturnValue(
      new Promise<{ ok: true }>((resolve) => {
        resolveDelete = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
    const deleteButton = await screen.findByRole("button", {
      name: /excluir medição/i,
    });
    await user.click(deleteButton);

    expect(screen.getByText("80 kg")).toBeInTheDocument();
    expect(deleteButton).toBeDisabled();

    await act(async () => resolveDelete({ ok: true }));

    expect(screen.queryByText("80 kg")).not.toBeInTheDocument();
  });

  it("disables save and cancel controls while saving a client measurement", async () => {
    let resolveSave!: (result: { ok: true }) => void;
    saveMeasurementMock.mockReturnValue(
      new Promise<{ ok: true }>((resolve) => {
        resolveSave = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
    await user.click(
      await screen.findByRole("button", { name: /^\+ nova$/i }),
    );
    await user.type(screen.getByRole("textbox", { name: /peso/i }), "81");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeDisabled();

    await act(async () => resolveSave({ ok: true }));
  });

  it("propagates the client target when creating and editing measurements", async () => {
    listMeasurementsMock
      .mockResolvedValueOnce({ ok: true, measurements: [measurement] })
      .mockResolvedValue({ ok: true, measurements: [measurement] });
    const user = userEvent.setup();

    render(<MeasurementsContent clientId="client-a" clientName="Ana" />);
    await user.click(
      await screen.findByRole("button", { name: /^\+ nova$/i }),
    );
    await user.type(screen.getByRole("textbox", { name: /peso/i }), "81");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(saveMeasurementMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ weightKg: 81 }),
      "client-a",
    );
    await waitFor(() =>
      expect(listMeasurementsMock).toHaveBeenLastCalledWith("client-a"),
    );

    const card = screen.getByRole("article");
    await user.click(within(card).getByText("80 kg"));
    const weightInput = screen.getByRole("textbox", { name: /peso/i });
    await user.clear(weightInput);
    await user.type(weightInput, "82");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(saveMeasurementMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "measurement-a", weightKg: 82 }),
      "client-a",
    );
  });
});
