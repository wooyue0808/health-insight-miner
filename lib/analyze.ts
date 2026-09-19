import type { DialogueItem, ExtractResult, ExtractionRecord } from "./llm";

const BATCH_SIZE = 10;

export type AnalysisProgress = {
  processed: number;
  total: number;
};

export type RunAnalysisOptions = {
  onProgress?: (progress: AnalysisProgress) => void;
};

/** 每 10 条一组，串行调用 POST /api/extract，累加 results / failed。 */
export async function runAnalysis(
  dialogues: DialogueItem[],
  options?: RunAnalysisOptions,
): Promise<ExtractResult> {
  const results: ExtractionRecord[] = [];
  const failed: ExtractResult["failed"] = [];
  const total = dialogues.length;

  options?.onProgress?.({ processed: 0, total });

  for (let i = 0; i < dialogues.length; i += BATCH_SIZE) {
    const batch = dialogues.slice(i, i + BATCH_SIZE);
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dialogues: batch }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "分析请求失败");
    }

    if (Array.isArray(data.results)) {
      results.push(...data.results);
    }
    if (Array.isArray(data.failed)) {
      failed.push(...data.failed);
    }

    options?.onProgress?.({
      processed: Math.min(i + batch.length, total),
      total,
    });
  }

  return { results, failed };
}
