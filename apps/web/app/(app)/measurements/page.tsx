"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RequireAthlete } from "@/components/RequireAthlete";
import {
  listMeasurements,
  saveMeasurement,
  deleteMeasurement,
  type MeasurementResult,
} from "@/lib/data/measurements";
import type { BodyMeasurement } from "@bstrainer/domain";

const CHART_SIGNAL = "#FF4D00";
const CHART_LINE = "#2E2924";
const CHART_MUTE = "#8A817A";
const CHART_SURFACE = "#171412";

const FIELD_DEFS = [
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "bodyFatPct", label: "Gordura", unit: "%" },
  { key: "chestCm", label: "Peito", unit: "cm" },
  { key: "waistCm", label: "Cintura", unit: "cm" },
  { key: "hipCm", label: "Quadril", unit: "cm" },
  { key: "bicepRightCm", label: "Biceps", unit: "cm" },
  { key: "thighRightCm", label: "Coxa", unit: "cm" },
] as const;

type FieldKey = (typeof FIELD_DEFS)[number]["key"];

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtNum(n: number | null): string {
  if (n == null) return "–";
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

export default function MeasurementsPage() {
  return (
    <RequireAthlete>
      <MeasurementsContent />
    </RequireAthlete>
  );
}

function MeasurementsContent() {
  const [entries, setEntries] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formDate, setFormDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formNotes, setFormNotes] = useState("");
  const [chartField, setChartField] = useState<FieldKey>("weightKg");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    listMeasurements().then((m) => {
      setEntries(m);
      setLoading(false);
    });
  }, []);

  function openAdd() {
    setEditingId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormValues({});
    setFormNotes("");
    setError(null);
    setAdding(true);
  }

  function openEdit(e: BodyMeasurement) {
    setEditingId(e.id);
    setFormDate(e.measuredAt);
    setFormValues({
      weightKg: e.weightKg != null ? String(e.weightKg) : "",
      bodyFatPct: e.bodyFatPct != null ? String(e.bodyFatPct) : "",
      chestCm: e.chestCm != null ? String(e.chestCm) : "",
      waistCm: e.waistCm != null ? String(e.waistCm) : "",
      hipCm: e.hipCm != null ? String(e.hipCm) : "",
      bicepRightCm: e.bicepRightCm != null ? String(e.bicepRightCm) : "",
      thighRightCm: e.thighRightCm != null ? String(e.thighRightCm) : "",
    });
    setFormNotes(e.notes ?? "");
    setError(null);
    setAdding(true);
  }

  async function handleSubmit() {
    const parse = (v: string): number | null => {
      const n = parseFloat(v.replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };

    const input: Omit<BodyMeasurement, "id" | "userId" | "createdAt"> & {
      id?: string;
    } = {
      measuredAt: formDate,
      weightKg: parse(formValues.weightKg ?? ""),
      bodyFatPct: parse(formValues.bodyFatPct ?? ""),
      chestCm: parse(formValues.chestCm ?? ""),
      waistCm: parse(formValues.waistCm ?? ""),
      hipCm: parse(formValues.hipCm ?? ""),
      bicepRightCm: parse(formValues.bicepRightCm ?? ""),
      thighRightCm: parse(formValues.thighRightCm ?? ""),
      notes: formNotes.trim() || null,
    };

    if (
      input.weightKg == null &&
      input.bodyFatPct == null &&
      input.chestCm == null &&
      input.waistCm == null &&
      input.hipCm == null &&
      input.bicepRightCm == null &&
      input.thighRightCm == null
    ) {
      setError("Preencha pelo menos um campo.");
      return;
    }

    if (editingId) input.id = editingId;

    setPending(true);
    setError(null);
    const result: MeasurementResult = await saveMeasurement(input);
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Falha ao salvar.");
      return;
    }

    setAdding(false);
    const updated = await listMeasurements();
    setEntries(updated);
  }

  async function handleDelete(id: string) {
    await deleteMeasurement(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const chartData = useMemo(() => {
    const field = chartField;
    return entries
      .filter((e) => (e as Record<string, unknown>)[field] != null)
      .slice()
      .reverse()
      .map((e) => ({
        date: e.measuredAt.slice(5),
        value: (e as Record<string, unknown>)[field] as number,
      }));
  }, [entries, chartField]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-52 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Medições
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="text-sm font-semibold text-signal"
        >
          + Nova
        </button>
      </div>

      {chartData.length >= 2 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="caps-label font-display font-semibold text-mute">
              Gráfico
            </h2>
            <select
              value={chartField}
              onChange={(e) => setChartField(e.target.value as FieldKey)}
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-text outline-none focus:border-signal"
            >
              {FIELD_DEFS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="h-52 rounded-lg border border-line bg-surface p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_LINE} />
                <XAxis dataKey="date" stroke={CHART_MUTE} fontSize={11} />
                <YAxis stroke={CHART_MUTE} fontSize={11} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: CHART_SURFACE,
                    border: `1px solid ${CHART_LINE}`,
                    borderRadius: 8,
                    color: "#F5F2EE",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_SIGNAL}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_SIGNAL, stroke: CHART_SIGNAL }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="caps-label font-display font-semibold text-mute">
          Registros
        </h2>
        {entries.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-mute">
            Nenhuma medição registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <article
                key={e.id}
                className="cursor-pointer rounded-lg border border-line bg-surface p-4 transition hover:border-signal/30"
                onClick={() => openEdit(e)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {fmtDate(e.measuredAt)}
                  </span>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDelete(e.id);
                    }}
                    className="text-xs text-mute transition active:text-err"
                    aria-label="Remover"
                  >
                    &#x2715;
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-mute">
                  {e.weightKg != null && <span>{fmtNum(e.weightKg)} kg</span>}
                  {e.bodyFatPct != null && (
                    <span>{fmtNum(e.bodyFatPct)} %</span>
                  )}
                  {e.chestCm != null && <span>P {fmtNum(e.chestCm)}</span>}
                  {e.waistCm != null && <span>C {fmtNum(e.waistCm)}</span>}
                  {e.hipCm != null && <span>Q {fmtNum(e.hipCm)}</span>}
                  {e.bicepRightCm != null && (
                    <span>B {fmtNum(e.bicepRightCm)}</span>
                  )}
                  {e.thighRightCm != null && (
                    <span>Cx {fmtNum(e.thighRightCm)}</span>
                  )}
                </div>
                {e.notes && (
                  <p className="mt-1 text-xs text-mute italic">{e.notes}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-3 rounded-t-2xl border-t border-line bg-surface p-4 pb-6">
            <div className="flex items-center justify-between">
              <p className="caps-label font-display font-semibold text-mute">
                {editingId ? "Editar medição" : "Nova medição"}
              </p>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-xs text-mute"
              >
                Fechar
              </button>
            </div>

            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="h-11 w-full rounded border border-line bg-ink px-3 text-sm outline-none focus:border-signal"
            />

            <div className="grid grid-cols-2 gap-2">
              {FIELD_DEFS.map((f) => (
                <label key={f.key} className="space-y-0.5">
                  <span className="text-[11px] text-mute">
                    {f.label} ({f.unit})
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={"–"}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                    className="h-10 w-full rounded border border-line bg-ink px-2 text-sm outline-none placeholder:text-mute focus:border-signal"
                  />
                </label>
              ))}
            </div>

            <input
              type="text"
              placeholder="Notas (opcional)"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="h-11 w-full rounded border border-line bg-ink px-3 text-sm outline-none placeholder:text-mute focus:border-signal"
            />

            {error && <p className="text-sm text-err">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-11 w-full rounded-lg text-sm text-mute transition active:bg-surface-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
