import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClientAlertsPanel } from "./ClientAlertsPanel";
import type { ClientExceptionAlert } from "@/lib/data/trainer-alerts";

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

describe("ClientAlertsPanel", () => {
  it("shows an actionable retry on error", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();

    render(
      <ClientAlertsPanel
        state={{
          status: "error",
          alerts: [],
          error: "Falha ao atualizar alertas.",
        }}
        onRetry={retry}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("preserves real alerts while reporting a refresh error", () => {
    render(
      <ClientAlertsPanel
        state={{
          status: "error",
          alerts: [realAlert],
          error: "Falha ao atualizar alertas.",
        }}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(realAlert.clientName)).toBeInTheDocument();
    expect(
      screen.getByText("Falha ao atualizar alertas."),
    ).toBeInTheDocument();
  });

  it("announces loading while alert cards are unavailable", () => {
    render(
      <ClientAlertsPanel state={{ status: "loading", alerts: [] }} onRetry={vi.fn()} />,
    );

    expect(
      screen.getByRole("status", { name: "Carregando alertas" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the empty state after a successful load with no alerts", () => {
    render(
      <ClientAlertsPanel state={{ status: "ready", alerts: [] }} onRetry={vi.fn()} />,
    );

    expect(
      screen.getByText("Zero exceções no momento!"),
    ).toBeInTheDocument();
  });

  it("shows a real alert card after a successful load", () => {
    render(
      <ClientAlertsPanel
        state={{ status: "ready", alerts: [realAlert] }}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(realAlert.clientName)).toBeInTheDocument();
    expect(screen.getByText(realAlert.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /enviar mensagem/i }),
    ).toHaveAttribute("href", realAlert.actionUrl);
  });

  it("does not present simulated or demo alerts", () => {
    render(
      <ClientAlertsPanel
        state={{ status: "ready", alerts: [realAlert] }}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByText(/simulado|demo/i)).not.toBeInTheDocument();
  });
});
