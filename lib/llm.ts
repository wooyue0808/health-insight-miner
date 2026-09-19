import OpenAI from "openai";
import { PROMPT_TEMPLATE } from "./prompt";

/** 提取结果单条记录（与 PRD 字段一致） */
export interface ExtractionRecord {
  对话ID: string;
  组内序号: number;
  药品名称: string;
  药品品类: string;
  "症状/需求": string;
  反馈类型: string;
  反馈极性: string;
  原文摘录: string;
}

export interface DialogueItem {
  对话ID: string;
  对话内容: string;
}

export interface ExtractResult {
  results: ExtractionRecord[];
  failed: { 对话ID: string; 对话内容: string; error: string }[];
}

function getClient(): OpenAI {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 LLM_API_KEY，请在 .env.local 或环境变量中配置");
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || "https://api.deepseek.com",
  });
}

/** 容错解析：支持纯JSON、```json 代码块包裹、前后多余文字 */
export function parseJSON(text: string | null | undefined): ExtractionRecord[] | null {
  if (!text) return null;
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t
      .split("\n")
      .filter((ln) => !ln.trim().startsWith("```"))
      .join("\n")
      .trim();
  }
  try {
    const parsed = JSON.parse(t);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const start = t.indexOf("[");
    const end = t.lastIndexOf("]");
    if (start !== -1 && end > start) {
      try {
        const parsed = JSON.parse(t.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** 调用 LLM 提取一条对话（重试1次，返回结构化记录数组或 null） */
export async function extractOne(d: DialogueItem): Promise<ExtractionRecord[]> {
  const client = getClient();
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await client.chat.completions.create({
        model: process.env.LLM_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: PROMPT_TEMPLATE },
          { role: "user", content: `对话ID：${d.对话ID}\n对话内容：\n${d.对话内容}` },
        ],
        temperature: 0,
        max_tokens: 1000,
      });
      const raw = resp.choices[0]?.message?.content ?? null;
      const parsed = parseJSON(raw);
      if (parsed) return parsed;
      lastErr = new Error("JSON解析失败");
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** 批量提取（每批最多10条；单条失败不影响整体） */
export async function extractBatch(dialogues: DialogueItem[]): Promise<ExtractResult> {
  if (dialogues.length > 10) {
    throw new Error("单次最多处理10条对话");
  }
  const results: ExtractionRecord[] = [];
  const failed: ExtractResult["failed"] = [];

  for (const d of dialogues) {
    try {
      const parsed = await extractOne(d);
      results.push(...parsed);
    } catch (e) {
      failed.push({ 对话ID: d.对话ID, 对话内容: d.对话内容, error: String(e) });
    }
  }
  return { results, failed };
}
