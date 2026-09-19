import { NextRequest, NextResponse } from "next/server";
import { extractBatch, DialogueItem } from "@/lib/llm";

/**
 * POST /api/extract
 * 入参：{ "dialogues": [{ "对话ID": "D001", "对话内容": "..." }, ...] }（≤10条）
 * 出参：{ "results": [...], "failed": [...] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dialogues: DialogueItem[] = body?.dialogues ?? [];

    if (!Array.isArray(dialogues) || dialogues.length === 0) {
      return NextResponse.json({ error: "dialogues 不能为空" }, { status: 400 });
    }
    if (dialogues.length > 10) {
      return NextResponse.json({ error: "单次最多处理10条对话" }, { status: 400 });
    }
    for (const d of dialogues) {
      if (!d || typeof d.对话内容 !== "string" || !d.对话内容.trim()) {
        return NextResponse.json(
          { error: "每条对话必须包含非空的“对话内容”字段" },
          { status: 400 }
        );
      }
      if (typeof d.对话ID !== "string" || !d.对话ID) {
        return NextResponse.json(
          { error: "每条对话必须包含“对话ID”字段" },
          { status: 400 }
        );
      }
    }

    const result = await extractBatch(dialogues);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
