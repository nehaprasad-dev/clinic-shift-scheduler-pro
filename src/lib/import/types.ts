export type ImportItemKind = "accepted" | "rejected" | "merged";

export type ImportItem = {
  kind: ImportItemKind;
  rowNumber: number;
  rawRow: string;
  issue: string;
  action: string;
};

export type ImportResult = {
  acceptedCount: number;
  rejectedCount: number;
  mergedCount: number;
  items: ImportItem[];
};

export function emptyImportResult(): ImportResult {
  return { acceptedCount: 0, rejectedCount: 0, mergedCount: 0, items: [] };
}

export function summarize(result: ImportResult): ImportResult {
  return {
    acceptedCount: result.items.filter((i) => i.kind === "accepted").length,
    rejectedCount: result.items.filter((i) => i.kind === "rejected").length,
    mergedCount: result.items.filter((i) => i.kind === "merged").length,
    items: result.items,
  };
}

export function rawRowFromRecord(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([k, v]) => `${k}=${v}`)
    .join(" | ");
}
