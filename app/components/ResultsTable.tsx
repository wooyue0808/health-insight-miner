"use client";

import { useMemo, useState } from "react";

export type ExtractionRow = {
  对话ID: string;
  组内序号: number;
  药品名称: string;
  药品品类: string;
  "症状/需求": string;
  反馈类型: string;
  反馈极性: string;
  原文摘录: string;
};

type ResultsTableProps = {
  results: ExtractionRow[];
};

const POLARITY_STYLES: Record<string, string> = {
  负面: "bg-red-50 text-red-700",
  正面: "bg-emerald-50 text-emerald-700",
  中性: "bg-slate-100 text-slate-600",
  咨询: "bg-sky-50 text-sky-700",
};

export default function ResultsTable({ results }: ResultsTableProps) {
  const [polarityFilter, setPolarityFilter] = useState<"all" | "负面">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const row of results) {
      const category = row.药品品类?.trim();
      if (category) set.add(category);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [results]);

  const filtered = useMemo(() => {
    return results.filter((row) => {
      if (polarityFilter === "负面" && row.反馈极性 !== "负面") return false;
      if (categoryFilter !== "all" && row.药品品类 !== categoryFilter) return false;
      return true;
    });
  }, [results, polarityFilter, categoryFilter]);

  const rowKey = (row: ExtractionRow, index: number) =>
    `${row.对话ID}-${row.组内序号}-${index}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>极性</span>
          <select
            value={polarityFilter}
            onChange={(e) => setPolarityFilter(e.target.value as "all" | "负面")}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">全部</option>
            <option value="负面">只看负面</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>药品品类</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">全部品类</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto text-xs text-slate-500">
          显示 {filtered.length} / {results.length} 条，点击行展开原文
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">对话ID</th>
              <th className="px-3 py-2.5">药品名称</th>
              <th className="px-3 py-2.5">药品品类</th>
              <th className="px-3 py-2.5">症状/需求</th>
              <th className="px-3 py-2.5">反馈类型</th>
              <th className="px-3 py-2.5">极性</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                  暂无符合条件的记录
                </td>
              </tr>
            ) : (
              filtered.map((row, index) => {
                const key = rowKey(row, index);
                const open = expandedKey === key;
                return (
                  <tr key={key} className="align-top">
                    <td colSpan={6} className="p-0">
                      <button
                        type="button"
                        onClick={() => setExpandedKey(open ? null : key)}
                        className="grid w-full grid-cols-6 text-left hover:bg-slate-50"
                      >
                        <span className="px-3 py-2.5 font-mono text-xs text-slate-500">
                          {row.对话ID}
                        </span>
                        <span className="px-3 py-2.5 text-slate-800">{row.药品名称 || "未提及"}</span>
                        <span className="px-3 py-2.5 text-slate-600">{row.药品品类 || "—"}</span>
                        <span className="px-3 py-2.5 text-slate-700">{row["症状/需求"] || "—"}</span>
                        <span className="px-3 py-2.5 text-slate-700">{row.反馈类型 || "—"}</span>
                        <span className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${POLARITY_STYLES[row.反馈极性] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {row.反馈极性 || "—"}
                          </span>
                        </span>
                      </button>
                      {open ? (
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium text-slate-500">原文对话</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                            {row.原文摘录 || "（无原文摘录）"}
                          </p>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
