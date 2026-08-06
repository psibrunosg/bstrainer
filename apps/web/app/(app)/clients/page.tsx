"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  inviteClient,
  listClientLinks,
  respondToTrainerRequest,
  type ClientLink,
} from "@/lib/data/clients";
import {
  getClientExceptionAlerts,
  type ClientExceptionAlert,
} from "@/lib/data/trainer-alerts";
import { RequireTrainer } from "@/components/RequireTrainer";

const STATUS_LABEL: Record<string, string> = {
  invited: "Convidado",
  requested: "Solicitação recebida",
  active: "Ativo",
  archived: "Arquivado",
};

const ALERT_SEVERITY_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  high: {
    border: "border-err/50",
    bg: "bg-err/5",
    badge: "bg-err/10 text-err border-err/30",
  },
  medium: {
    border: "border-signal/50",
    bg: "bg-signal/5",
    badge: "bg-signal/15 text-signal border-signal/30",
  },
  low: {
    border: "border-line",
    bg: "bg-surface-2/30",
    badge: "bg-surface-2 text-mute border-line",
  },
};

const ALERT_ICON: Record<string, string> = {
  inactive: "⏰",
  high_fatigue: "🔋",
  plan_ending: "📋",
};

export default function ClientsPage() {
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [alertsData, setAlertsData] = useState<{
    alerts: ClientExceptionAlert[];
    isDemo: boolean;
  }>({ alerts: [], isDemo: false });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const reload = useCallback(() => {
    listClientLinks().then(setLinks);
    setLoadingAlerts(true);
    getClientExceptionAlerts().then((res) => {
      setAlertsData(res);
      setLoadingAlerts(false);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const result = await inviteClient(email);
    setBusy(false);
    if (result.ok) {
      setEmail("");
      setMsg({ ok: true, text: "Convite registrado." });
      reload();
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
    if (result.ok) reload();
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
          <div className="flex items-center gap-2 text-xs font-semibold text-mute bg-surface rounded-lg px-4 py-2.5 border border-line h-fit w-fit">
            <span>👥 {active.length} {active.length === 1 ? "aluno ativo" : "alunos ativos"}</span>
            <span>•</span>
            <span className="text-signal">⚡ {alertsData.alerts.length} alertas</span>
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
            <div className="sticky top-6 space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h2 className="font-display text-lg font-extrabold text-text">
                      Acompanhamento por Exceção
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-mute leading-relaxed">
                    Algoritmo inteligente de priorização: alunos sem treinar há &gt;3 dias, fadiga estourada por 2 sessões ou programa próximo do término.
                  </p>
                </div>
              </div>

              {alertsData.isDemo && (
                <div className="flex items-center justify-between rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-[11px] font-semibold text-signal">
                  <span>ℹ️ Exibindo alertas simulados de QA</span>
                  <span className="uppercase text-[9px] border border-signal/30 px-1.5 py-0.5 rounded">Demo</span>
                </div>
              )}

              {loadingAlerts ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-xl skeleton-shimmer" />
                  <div className="h-24 rounded-xl skeleton-shimmer" />
                  <div className="h-24 rounded-xl skeleton-shimmer" />
                </div>
              ) : alertsData.alerts.length === 0 ? (
                <div className="rounded-xl border border-line bg-ink p-6 text-center space-y-2">
                  <span className="text-3xl block">🟢</span>
                  <p className="font-display font-bold text-sm text-text">
                    Zero exceções no momento!
                  </p>
                  <p className="text-xs text-mute">
                    Todos os alunos ativos estão mantendo a consistência e dentro das metas programadas no mesociclo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {alertsData.alerts.map((alert) => {
                    const style = ALERT_SEVERITY_STYLES[alert.severity] || ALERT_SEVERITY_STYLES.low;
                    const icon = ALERT_ICON[alert.type] || "ℹ️";

                    return (
                      <div
                        key={alert.id}
                        className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${style!.border} ${style!.bg} space-y-3`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${style!.badge}`}>
                              <span>{icon}</span>
                              <span>{alert.title}</span>
                            </span>
                            <h3 className="font-display font-extrabold text-base text-text">
                              {alert.clientName}
                            </h3>
                          </div>
                          <span className="text-[11px] font-medium text-mute shrink-0">
                            Atividade: {alert.lastActiveDate}
                          </span>
                        </div>

                        <p className="text-xs text-mute leading-relaxed">
                          {alert.description}
                        </p>

                        <Link
                          href={alert.actionUrl}
                          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-surface-2 border border-line text-xs font-bold text-text transition hover:bg-signal hover:text-ink active:scale-[0.99]"
                        >
                          <span>{alert.actionLabel} →</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-line/70 pt-4 text-center">
                <span className="text-[11px] text-mute">
                  🎯 O painel atualiza em tempo real com os envios do logger mobile dos seus alunos.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireTrainer>
  );
}
