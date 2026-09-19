export type DialogueCsvRow = {
  "对话 ID": string;
  对话内容: string;
};

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
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  row.push(cell.replace(/\r$/, ""));
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizeHeader(name: string) {
  return name.replace(/^\uFEFF/, "").trim();
}

function padTicketId(index: number) {
  return `T${String(index).padStart(3, "0")}`;
}

/** 解析 CSV 文本为 { 对话 ID, 对话内容 }[]。支持逗号分隔与引号包裹。 */
export function parseCsv(text: string): DialogueCsvRow[] {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, "").trim());
  if (rows.length === 0) return [];

  const header = rows[0].map(normalizeHeader);
  const idCol = header.findIndex((h) => h === "对话 ID" || h === "对话ID");
  const contentCol = header.findIndex((h) => h === "对话内容");

  if (idCol < 0 || contentCol < 0) {
    throw new Error('CSV 表头必须包含 "对话 ID" 和 "对话内容"');
  }

  const result: DialogueCsvRow[] = [];
  let generated = 0;

  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i];
    const content = (raw[contentCol] ?? "").trim();
    if (!content) continue;

    const givenId = (raw[idCol] ?? "").trim();
    const id = givenId || padTicketId(++generated);

    result.push({
      "对话 ID": id,
      对话内容: content,
    });
  }

  return result;
}
