import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientsPage from "./page";
import type {
  AlertLoadResult,
  ClientExceptionAlert,
} from "@/lib/data/trainer-alerts";

const { getAlertsMock, listClientLinksMock } = vi.hoisted(() => ({
  getAlertsMock: vi.fn(),
  listClientLinksMock: vi.fn(),
}));

vi.mock("@/lib/data/clients", () => ({
  inviteClient: vi.fn(),
  listClientLinks: listClientLinksMock,
  respondToTrainerRequest: vi.fn(),
}));

vi.mock("@/lib/data/trainer-alerts", () => ({
  getClientExceptionAlerts: getAlertsMock,
}));

vi.mock("@/components/RequireTrainer", () => ({
  RequireTrainer: ({ children }: { children: React.ReactNode }) => children,
}));

const realAlert: ClientExceptionAlert = {
  id: "inactive-ana",
  clientId: "ana",
  clientName: "Ana Souza",
  type: "inactive",
  title: "Ausência Crítica (>3 dias)",
  description: "Ana não registra um treino há quatro dias.",
  severity: "high",
  lastActiveDate: "06/08/2026",
  actionUrl: "/messages?id=ana",
  actionLabel: "Enviar mensagem",
};

describe("ClientsPage", () => {
  beforeEach(() => {
    getAlertsMock.mockReset();
    listClientLinksMock.mockReset().mockResolvedValue([]);
  });

  it("keeps previous alerts and their count when refresh fails", async () => {
    getAlertsMock
      .mockResolvedValueOnce({ ok: true, alerts: [realAlert] })
      .mockResolvedValueOnce({
        ok: false,
        error: "Falha ao atualizar alertas.",
      });
    const user = userEvent.setup();

    render(<ClientsPage />);

    expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Atualizar alertas" }),
    );

    expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Falha ao atualizar alertas.",
    );
    expect(screen.getByText(/1 alerta$/)).toBeInTheDocument();
    expect(screen.queryByText(/simulado|demo/i)).not.toBeInTheDocument();
  });

  it("leaves the loading state when the alert request rejects", async () => {
    getAlertsMock.mockRejectedValueOnce(new Error("network unavailable"));

    render(<ClientsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao atualizar alertas.",
    );
    expect(
      screen.queryByRole("status", { name: "Carregando alertas" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Alertas indisponíveis$/)).toBeInTheDocument();
    expect(screen.queryByText(/0 alertas$/)).not.toBeInTheDocument();
  });

  it("shows zero alerts only after a successful empty load", async () => {
    let resolveAlerts!: (result: AlertLoadResult) => void;
    getAlertsMock.mockReturnValueOnce(
      new Promise<AlertLoadResult>((resolve) => {
        resolveAlerts = resolve;
      }),
    );

    render(<ClientsPage />);

    expect(screen.queryByText(/0 alertas$/)).not.toBeInTheDocument();
    await act(async () => {
      resolveAlerts({ ok: true, alerts: [] });
    });
    expect(screen.getByText(/0 alertas$/)).toBeInTheDocument();
  });

  it("keeps previous alerts and count when refresh rejects", async () => {
    getAlertsMock
      .mockResolvedValueOnce({ ok: true, alerts: [realAlert] })
      .mockRejectedValueOnce(new Error("network unavailable"));
    const user = userEvent.setup();

    render(<ClientsPage />);

    expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Atualizar alertas" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao atualizar alertas.",
    );
    expect(screen.getByText(realAlert.clientName)).toBeInTheDocument();
    expect(screen.getByText(/1 alerta$/)).toBeInTheDocument();
  });

  it("retries from the alert panel action", async () => {
    getAlertsMock
      .mockResolvedValueOnce({
        ok: false,
        error: "Falha ao atualizar alertas.",
      })
      .mockResolvedValueOnce({ ok: true, alerts: [realAlert] });
    const user = userEvent.setup();

    render(<ClientsPage />);

    await user.click(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    );
    expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/1 alerta$/)).toBeInTheDocument();
  });

  it("renders alerts while client links are still loading", async () => {
    listClientLinksMock.mockReturnValueOnce(new Promise(() => {}));
    getAlertsMock.mockResolvedValueOnce({ ok: true, alerts: [realAlert] });

    render(<ClientsPage />);

    expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Carregando alertas" }),
    ).not.toBeInTheDocument();
  });

  it("ignores an older alert response that finishes last", async () => {
    let resolveFirst!: (result: AlertLoadResult) => void;
    let resolveSecond!: (result: AlertLoadResult) => void;
    const firstRequest = new Promise<AlertLoadResult>((resolve) => {
      resolveFirst = resolve;
    });
    const secondRequest = new Promise<AlertLoadResult>((resolve) => {
      resolveSecond = resolve;
    });
    getAlertsMock
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest);

    render(
      <React.StrictMode>
        <ClientsPage />
      </React.StrictMode>,
    );
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolveSecond({ ok: true, alerts: [realAlert] });
    });
    expect(await screen.findByText(realAlert.clientName)).toBeInTheDocument();

    await act(async () => {
      resolveFirst({ ok: false, error: "Erro antigo." });
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(realAlert.clientName)).toBeInTheDocument();
  });
});
