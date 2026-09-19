"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExtractionRow } from "./ResultsTable";

type ChartsProps = {
  results: ExtractionRow[];
};

const PIE_COLORS = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#5b21b6",
  "#3f6212",
  "#0e7490",
  "#9a3412",
];

function topNegativeByDrug(results: ExtractionRow[]) {
  const counts = new Map<string, number>();
  for (const row of results) {
    if (row.反馈极性 !== "负面") continue;
    const name = row.药品名称?.trim() || "未提及";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function feedbackTypeShare(results: ExtractionRow[]) {
  const counts = new Map<string, number>();
  for (const row of results) {
    const type = row.反馈类型?.trim() || "其他";
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const total = results.length || 1;
  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      share: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export default function Charts({ results }: ChartsProps) {
  const barData = useMemo(() => topNegativeByDrug(results), [results]);
  const pieData = useMemo(() => feedbackTypeShare(results), [results]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">药品负面反馈 Top 10</h3>
        <p className="mt-1 text-xs text-slate-500">X 轴药品名称，Y 轴负面反馈条数</p>
        <div className="mt-3 h-72">
          {barData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              暂无负面反馈数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={56}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip
                  formatter={(value) => [`${value} 条`, "负面反馈"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">反馈类型占比</h3>
        <p className="mt-1 text-xs text-slate-500">按反馈类型统计条数占比</p>
        <div className="mt-3 h-72">
          {pieData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              暂无反馈类型数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => {
                    const share = (item?.payload as { share?: number } | undefined)?.share;
                    return [`${value} 条（${share ?? 0}%）`, String(name)];
                  }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
