"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY = "#ff4d6d";
const GRID = "var(--border)";
const AXIS_TEXT = "var(--foreground-secondary)";

export function SignupsChart({ data }: { data: { date: string; count: number }[] }) {
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
          <Line
            type="monotone"
            dataKey="count"
            name="Signups"
            stroke={PRIMARY}
            strokeWidth={2}
            dot={{ r: 4, fill: PRIMARY, stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: PRIMARY, stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
