import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { PrintOutcomeRecord } from "@layerai/shared-types";

/**
 * A flat JSON-file store, not SQLite: better-sqlite3 requires a native compiler toolchain
 * (Visual Studio Build Tools) that isn't guaranteed to be present on every Windows machine this
 * app installs onto, and outcome-tracking data for a single-user desktop app stays small (at
 * most a few thousand rows) - well within what in-memory JS filtering over a JSON array handles
 * comfortably. The public shape (open/read/write) is what would change if this ever needs to
 * move to a real embedded database.
 */
export class LearningDb {
  private readonly filePath: string;
  private records: PrintOutcomeRecord[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.records = this.load();
  }

  private load(): PrintOutcomeRecord[] {
    if (!existsSync(this.filePath)) return [];
    try {
      return JSON.parse(readFileSync(this.filePath, "utf-8")) as PrintOutcomeRecord[];
    } catch {
      return [];
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), "utf-8");
  }

  insert(record: PrintOutcomeRecord): void {
    this.records.push(record);
    this.persist();
  }

  all(): PrintOutcomeRecord[] {
    return [...this.records].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  filterByPrinterAndFilament(printerId: string, filamentId: string): PrintOutcomeRecord[] {
    return this.records.filter((r) => r.printerId === printerId && r.filamentId === filamentId);
  }
}

export function openLearningDb(dbPath: string): LearningDb {
  return new LearningDb(dbPath);
}
