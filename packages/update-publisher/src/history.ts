import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { PublishHistoryEntry } from "./types.js";

export async function readHistory(historyFilePath: string): Promise<PublishHistoryEntry[]> {
  try {
    const raw = await readFile(historyFilePath, "utf-8");
    const parsed = JSON.parse(raw) as PublishHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendHistoryEntry(historyFilePath: string, entry: PublishHistoryEntry): Promise<void> {
  const history = await readHistory(historyFilePath);
  history.unshift(entry);
  await mkdir(dirname(historyFilePath), { recursive: true });
  await writeFile(historyFilePath, JSON.stringify(history, null, 2), "utf-8");
}
