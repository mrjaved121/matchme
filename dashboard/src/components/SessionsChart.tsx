"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SESSIONS_COLOR = "#ff4d6d";
const MATCHES_COLOR = "#22c55e";
const GRID = "var(--border)";
const AXIS_TEXT = "var(--foreground-secondary)";

export function SessionsChart({
  data,
}: {
  data: { date: string; sessions: number; matches: number }[];
}) {
  return (
    <div className="mt-4 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: GRID, strokeWidth: 1 }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground-secondary)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: AXIS_TEXT }} />
          <Line
            type="monotone"
            dataKey="sessions"
            name="Dates started"
            stroke={SESSIONS_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: SESSIONS_COLOR, stroke: "var(--surface)", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="matches"
            name="Matches made"
            stroke={MATCHES_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: MATCHES_COLOR, stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
