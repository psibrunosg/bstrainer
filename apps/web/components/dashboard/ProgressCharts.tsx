"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_SIGNAL = "#FF4D00";
const CHART_LINE = "#2E2924";
const CHART_MUTE = "#8A817A";
const CHART_SURFACE = "#171412";

interface E1rmPoint {
  date: string;
  e1rm: number;
}

interface TonnagePoint {
  week: string;
  tonnage: number;
}

export function ProgressCharts({
  e1rmSeries,
  tonnageSeries,
  activeExercise,
  exerciseIds,
  nameOf,
  onSelectExercise,
}: {
  e1rmSeries: Map<string, E1rmPoint[]>;
  tonnageSeries: TonnagePoint[];
  activeExercise: string | null;
  exerciseIds: string[];
  nameOf: (id: string) => string;
  onSelectExercise: (id: string) => void;
}) {
  return (
    <>
      {activeExercise && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="caps-label font-display font-semibold text-mute">
              e1RM (kg)
            </h2>
            <select
              value={activeExercise}
              onChange={(e) => onSelectExercise(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-text outline-none focus:border-signal"
            >
              {exerciseIds.map((id) => (
                <option key={id} value={id}>
                  {nameOf(id)}
                </option>
              ))}
            </select>
          </div>
          <div className="h-52 rounded-lg border border-line bg-surface p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={e1rmSeries.get(activeExercise) ?? []}>
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
                  dataKey="e1rm"
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
          Tonelagem semanal (kg)
        </h2>
        <div className="h-52 rounded-lg border border-line bg-surface p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tonnageSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_LINE} />
              <XAxis dataKey="week" stroke={CHART_MUTE} fontSize={11} />
              <YAxis stroke={CHART_MUTE} fontSize={11} />
              <Tooltip
                cursor={{ fill: "rgba(255,77,0,0.08)" }}
                contentStyle={{
                  background: CHART_SURFACE,
                  border: `1px solid ${CHART_LINE}`,
                  borderRadius: 8,
                  color: "#F5F2EE",
                }}
              />
              <Bar dataKey="tonnage" fill={CHART_SIGNAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
