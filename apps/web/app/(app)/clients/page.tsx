"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  inviteClient,
  listClientLinks,
  respondToTrainerRequest,
  type ClientLink,
} from "@/lib/data/clients";
import {
  getClientExceptionAlerts,
  type AlertLoadResult,
} from "@/lib/data/trainer-alerts";
import {
  ClientAlertsPanel,
  type AlertPanelState,
} from "@/components/ClientAlertsPanel";
import { RequireTrainer } from "@/components/RequireTrainer";

export default function ClientsPage() {
  const [links, setLinks] = useState<ClientLink[]>([]);
  const latestAlertRequest = useRef(0);
  const [alertState, setAlertState] = useState<AlertPanelState>({
    status: "loading",
    alerts: [],
  });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reloadLinks = useCallback(() => {
    listClientLinks().then(setLinks);
  }, []);

  const reloadAlerts = useCallback(async () => {
    const requestId = ++latestAlertRequest.current;
    setAlertState((previous) => ({
      status: "loading",
      alerts: previous.alerts,
    }));

    try {
      const result: AlertLoadResult = await getClientExceptionAlerts();
      if (requestId !== latestAlertRequest.current) return;
      setAlertState((previous) =>
        result.ok
          ? { status: "ready", alerts: result.alerts }
          : {
              status: "error",
              alerts: previous.alerts,
              error: result.error,
            },
      );
    } catch {
      if (requestId !== latestAlertRequest.current) return;
      setAlertState((previous) => ({
        status: "error",
        alerts: previous.alerts,
        error: "Falha ao atualizar alertas.",
      }));
    }
  }, []);

  useEffect(() => {
    reloadLinks();
  }, [reloadLinks]);

  useEffect(() => {
    void reloadAlerts();
  }, [reloadAlerts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const result = await inviteClient(email);
    setBusy(false);
    if (result.ok) {
      setEmail("");
      setMsg({ ok: true, text: "Convite registrado." });
      reloadLinks();
      void reloadAlerts();
    } else {
      setMsg({ ok: false, text: result.error ?? "Falha ao convidar." });
    }
  }

  async function respond(linkId: string, accept: boolean) {
    setBusy(true);
    setMsg(null);
    const result = await respondToTrainerRequest(linkId, accept);
    setBusy(false);
    setMsg({
      ok: result.ok,
      text: result.ok
        ? accept
          ? "Aluno vinculado."
          : "Solicitação recusada."
        : result.error ?? "Falha ao responder.",
    });
    if (result.ok) {
      reloadLinks();
      void reloadAlerts();
    }
  }

  const active = links.filter((l) => l.status === "active");
  const pending = links.filter((l) => l.status === "invited");
  const requests = links.filter((l) => l.status === "requested");

  return (
    <RequireTrainer>
      {/* Workspace de Treinador em Tela Larga (Sem limitação max-w-lg) */}
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6 lg:p-8 text-text">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="caps-label font-display font-bold text-signal">
              Workspace Profissional
            </span>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
              Painel de Alunos
            </h1>
            <p className="mt-1 text-sm text-mute max-w-2xl">
              Acompanhamento inteligente em tempo real e gestão por exceções para priorizar o atendimento de quem mais precisa de intervenção hoje.
            </p>
          </div>
          <div className="flex h-fit w-fit items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-mute">
            <span>👥 {active.length} {active.length === 1 ? "aluno ativo" : "alunos ativos"}</span>
            <span>•</span>
            <span className="text-signal">
              ⚡ {alertState.alerts.length} {alertState.alerts.length === 1 ? "alerta" : "alertas"}
            </span>
            <button
              type="button"
              onClick={() => void reloadAlerts()}
              disabled={alertState.status === "loading"}
              className="ml-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-bold text-text transition hover:border-signal hover:text-signal disabled:cursor-wait disabled:opacity-50"
            >
              Atualizar alertas
            </button>
          </div>
        </div>

        {/* Grid Principal Desktop Wide */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Coluna da Esquerda / Principal: Gestão de Alunos (7 ou 8 colunas) */}
          <div className="space-y-8 lg:col-span-7 xl:col-span-8">
            {/* Seção de Convite de Aluno */}
            <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <h2 className="font-display text-lg font-bold text-text mb-1">
                Adicionando Novo Aluno
              </h2>
              <p className="text-xs text-mute mb-4">
                Convide diretamente por e-mail. Quando o aluno efetuar login, a conexão profissional será habilitada instantaneamente.
              </p>
              
              <form onSubmit={submit} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email.do.aluno@gmail.com"
                    className="h-12 flex-1 rounded-lg border border-line bg-ink px-4 text-sm outline-none placeholder:text-mute focus:border-signal"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-12 rounded-lg bg-signal px-6 text-sm font-bold text-ink transition active:scale-[0.98] hover:bg-signal-press disabled:opacity-50 shadow-sm"
                  >
                    {busy ? "Enviando…" : "+ Enviar Convite"}
                  </button>
                </div>
                {msg && (
                  <p className={`text-xs font-semibold ${msg.ok ? "text-ok" : "text-err"}`}>
                    {msg.text}
                  </p>
                )}
              </form>
            </div>

            {/* Listas de Alunos */}
            {links.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface p-12 text-center space-y-3">
                <span className="text-4xl block">🏋️‍♂️</span>
                <h3 className="font-display text-lg font-bold text-text">
                  Nenhum aluno cadastrado no seu painel
                </h3>
                <p className="text-sm text-mute max-w-md mx-auto">
                  Envie um convite acima com o e-mail que seu aluno utilizará no app para começar a periodizar fichas e monitorar o progresso em tela larga.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Solicitações de Acompanhamento */}
                {requests.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="caps-label font-display text-xs font-bold uppercase tracking-wider text-signal">
                      🚨 Pedidos de Acompanhamento Pendentes · {requests.length}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {requests.map((l) => (
                        <div
                          key={l.id}
                          className="rounded-xl border border-signal/40 bg-signal/5 p-4 flex flex-col justify-between"
                        >
                          <div>
                            <p className="font-display font-bold text-text text-lg">
                              {l.name ?? "Novo Aluno"}
                            </p>
                            <p className="text-xs text-mute mt-0.5">
                              {l.invite_email || "Solicitação enviada via código de personal"}
                            </p>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => respond(l.id, true)}
                              className="h-9 flex-1 rounded-lg bg-signal px-4 text-xs font-bold text-ink transition active:scale-95 hover:bg-signal-press disabled:opacity-50"
                            >
                              ✓ Aceitar Vínculo
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => respond(l.id, false)}
                              className="h-9 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-mute transition hover:text-err disabled:opacity-50"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Alunos Ativos no Workspace */}
                {active.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="caps-label font-display text-xs font-bold uppercase tracking-wider text-mute">
                        Alunos Ativos sob Orientação · {active.length}
                      </h2>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                      <ul className="divide-y divide-line/70">
                        {active.map((l) => (
                          <li
                            key={l.id}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-surface-2/40"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display font-bold text-signal border border-line">
                                {(l.name ?? "A")[0]!.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-display font-bold text-text text-base">
                                  {l.name ?? "Aluno sem nome"}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok">
                                  <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
                                  Vínculo Ativo
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {l.client_id && (
                                <>
                                  <Link
                                    href={`/plans/templates?client=${l.client_id}&name=${encodeURIComponent(l.name ?? "Aluno")}`}
                                    className="inline-flex h-8 items-center rounded-md border border-line bg-ink px-3 text-xs font-semibold text-text transition hover:border-signal hover:text-signal"
                                  >
                                    📋 Templates
                                  </Link>
                                  <Link
                                    href={`/plans/new?client=${l.client_id}&name=${encodeURIComponent(l.name ?? "Aluno")}`}
                                    className="inline-flex h-8 items-center rounded-md border border-line bg-ink px-3 text-xs font-semibold text-text transition hover:border-signal hover:text-signal"
                                  >
                                    ✏️ Ficha Manual
                                  </Link>
                                  <Link
                                    href={`/dashboard?client=${l.client_id}&name=${encodeURIComponent(l.name ?? "Aluno")}`}
                                    className="inline-flex h-8 items-center rounded-md border border-line bg-ink px-3 text-xs font-semibold text-text transition hover:border-signal hover:text-signal"
                                  >
                                    📈 Progresso
                                  </Link>
                                  <Link
                                    href={`/messages?id=${l.client_id}&name=${encodeURIComponent(l.name ?? "Aluno")}`}
                                    className="inline-flex h-8 items-center rounded-md bg-signal/15 border border-signal/30 px-3 text-xs font-bold text-signal transition hover:bg-signal hover:text-ink"
                                  >
                                    💬 Chat
                                  </Link>
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {/* Convites Pendentes */}
                {pending.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="caps-label font-display text-xs font-bold uppercase tracking-wider text-mute">
                      Convites Pendentes · {pending.length}
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                      <ul className="divide-y divide-line/50">
                        {pending.map((l) => (
                          <li
                            key={l.id}
                            className="flex items-center justify-between px-4 py-3 text-sm text-mute"
                          >
                            <span className="font-medium text-text">✉️ {l.invite_email}</span>
                            <span className="rounded-full border border-line bg-ink px-2.5 py-0.5 text-xs font-semibold text-mute">
                              Aguardando cadastro
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Coluna da Direita / Sidebar: Painel de Acompanhamento por Exceção (5 ou 4 colunas) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <ClientAlertsPanel state={alertState} onRetry={reloadAlerts} />
          </div>
        </div>
      </div>
    </RequireTrainer>
  );
}
