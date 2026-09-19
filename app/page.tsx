"use client";

import { useRef, useState } from "react";
import Charts from "./components/Charts";
import ResultsTable, { type ExtractionRow } from "./components/ResultsTable";

type Dialogue = {
  对话ID: string;
  对话内容: string;
};

type Progress = {
  processed: number;
  total: number;
};

function padId(index: number) {
  return `D${String(index).padStart(3, "0")}`;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  row.push(cell.replace(/\r$/, ""));
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

function parseCsv(text: string): Dialogue[] {
  const rows = parseCsvRows(text.trim());
  if (rows.length === 0) return [];

  const header = rows[0].map((c) => c.trim());
  const idIdx = header.findIndex((h) => /对话ID|^id$/i.test(h));
  const contentIdx = header.findIndex((h) => /对话内容|content|text/i.test(h));
  const hasHeader = idIdx >= 0 || contentIdx >= 0;

  const idCol = hasHeader ? (idIdx >= 0 ? idIdx : -1) : rows[0].length > 1 ? 0 : -1;
  const contentCol = hasHeader
    ? contentIdx >= 0
      ? contentIdx
      : header.length > 1
        ? 1
        : 0
    : rows[0].length > 1
      ? 1
      : 0;

  const start = hasHeader ? 1 : 0;
  const dialogues: Dialogue[] = [];

  for (let i = start; i < rows.length; i++) {
    const raw = rows[i];
    const content = (raw[contentCol] ?? "").trim();
    if (!content) continue;
    const givenId = idCol >= 0 ? (raw[idCol] ?? "").trim() : "";
    dialogues.push({
      对话ID: givenId || padId(dialogues.length + 1),
      对话内容: content,
    });
  }

  return dialogues;
}

function parsePlainText(text: string): Dialogue[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((content, index) => ({
      对话ID: padId(index + 1),
      对话内容: content,
    }));
}

const SAMPLE_RESULTS: ExtractionRow[] = [
  {
    对话ID: "D001",
    组内序号: 1,
    药品名称: "布洛芬",
    药品品类: "解热镇痛药",
    "症状/需求": "吃完胃疼",
    反馈类型: "药效/副作用反馈",
    反馈极性: "负面",
    原文摘录: "用户：吃完布洛芬胃疼，还能继续吃吗？",
  },
  {
    对话ID: "D002",
    组内序号: 1,
    药品名称: "感冒灵",
    药品品类: "感冒用药",
    "症状/需求": "想买退烧药",
    反馈类型: "用药指导缺失",
    反馈极性: "咨询",
    原文摘录: "用户：想买退烧药，感冒灵一天吃几次？",
  },
  {
    对话ID: "D003",
    组内序号: 1,
    药品名称: "蒙脱石散",
    药品品类: "胃肠道用药",
    "症状/需求": "拉肚子",
    反馈类型: "物流时效",
    反馈极性: "负面",
    原文摘录: "用户：蒙脱石散两天了还没到，拉肚子很严重。",
  },
  {
    对话ID: "D004",
    组内序号: 1,
    药品名称: "维生素C",
    药品品类: "维生素/保健品",
    "症状/需求": "增强抵抗力",
    反馈类型: "价格促销",
    反馈极性: "正面",
    原文摘录: "用户：这款维生素C活动价很划算，效果也不错。",
  },
  {
    对话ID: "D005",
    组内序号: 1,
    药品名称: "布洛芬",
    药品品类: "解热镇痛药",
    "症状/需求": "退烧",
    反馈类型: "药效/副作用反馈",
    反馈极性: "负面",
    原文摘录: "用户：布洛芬吃了还是反复发烧。",
  },
  {
    对话ID: "D006",
    组内序号: 1,
    药品名称: "褪黑素",
    药品品类: "助眠类",
    "症状/需求": "失眠",
    反馈类型: "商品信息准确性",
    反馈极性: "中性",
    原文摘录: "用户：包装上写的规格和详情页不一样。",
  },
  {
    对话ID: "D007",
    组内序号: 1,
    药品名称: "阿莫西林",
    药品品类: "其他",
    "症状/需求": "喉咙痛",
    反馈类型: "用药指导缺失",
    反馈极性: "咨询",
    原文摘录: "用户：阿莫西林饭前吃还是饭后吃？",
  },
  {
    对话ID: "D008",
    组内序号: 1,
    药品名称: "感冒灵",
    药品品类: "感冒用药",
    "症状/需求": "鼻塞",
    反馈类型: "药效/副作用反馈",
    反馈极性: "负面",
    原文摘录: "用户：感冒灵喝完嗜睡，开车不敢用。",
  },
];

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [results, setResults] = useState<ExtractionRow[]>(SAMPLE_RESULTS);
  const [progress, setProgress] = useState<Progress>({ processed: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const applyDialogues = (next: Dialogue[]) => {
    setDialogues(next);
    setResults([]);
    setProgress({ processed: 0, total: next.length });
    setError("");
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setFileName("");
    applyDialogues(parsePlainText(value));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("请上传 CSV 文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setText(content);
      setFileName(file.name);
      applyDialogues(parseCsv(content));
    };
    reader.onerror = () => setError("文件读取失败，请重试");
    reader.readAsText(file, "UTF-8");
  };

  const handleAnalyze = async () => {
    const items = dialogues.length > 0 ? dialogues : parsePlainText(text);
    if (items.length === 0) {
      setError("请先上传 CSV 或粘贴对话文本");
      return;
    }

    setDialogues(items);
    setLoading(true);
    setError("");
    setResults([]);
    setProgress({ processed: 0, total: items.length });

    const collected: ExtractionRow[] = [];
    const batchSize = 10;

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dialogues: batch }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "分析请求失败");
        }
        if (Array.isArray(data.results)) {
          collected.push(...(data.results as ExtractionRow[]));
        }
        setResults([...collected]);
        setProgress({
          processed: Math.min(i + batch.length, items.length),
          total: items.length,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const percent =
    progress.total === 0 ? 0 : Math.round((progress.processed / progress.total) * 100);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-xs font-medium tracking-wide text-teal-700">HEALTH INSIGHT MINER</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            医药电商客服对话健康需求挖掘器
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            上传或粘贴客服对话，批量抽取药品、症状与反馈信息。
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">输入对话</h2>
              <p className="mt-1 text-sm text-slate-500">
                支持 CSV 上传（FileReader）或粘贴纯文本，空行分隔将自动编号。
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              已载入 {dialogues.length} 条
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              上传 CSV 文件
            </button>
            {fileName ? (
              <span className="text-sm text-slate-500">{fileName}</span>
            ) : (
              <span className="text-sm text-slate-400">未选择文件</span>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={"客服：您好，请问有什么可以帮您？\n用户：吃完药胃疼\n\n用户：想买退烧药，有什么推荐？"}
            rows={10}
            className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-700 px-5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "分析中…" : "开始分析"}
            </button>

            {(loading || progress.total > 0) && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    已处理 {progress.processed} / {progress.total}
                  </span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </section>

        <section id="results" className="min-h-48 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">分析结果</h2>
          {results.length === 0 ? (
            <div className="mt-4 min-h-32 rounded-lg border border-dashed border-slate-200 bg-slate-50" />
          ) : (
            <div className="mt-4 space-y-6">
              <Charts results={results} />
              <ResultsTable results={results} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
