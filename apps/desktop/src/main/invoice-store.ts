import { app } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

interface InvoiceCounterFile {
  lastSequence: number;
}

function filePath(): string {
  return join(app.getPath("userData"), "invoice-counter.json");
}

async function readCounter(): Promise<InvoiceCounterFile> {
  try {
    const raw = await readFile(filePath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<InvoiceCounterFile>;
    return { lastSequence: typeof parsed.lastSequence === "number" ? parsed.lastSequence : 0 };
  } catch {
    return { lastSequence: 0 };
  }
}

async function writeCounter(counter: InvoiceCounterFile): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(filePath(), JSON.stringify(counter, null, 2), "utf-8");
}

/**
 * Allocates the next invoice number and persists it immediately. French law requires invoice
 * numbers to be sequential with no gaps, so callers must only invoke this once a save location
 * has actually been confirmed (not on dialog cancel) - otherwise a canceled invoice would burn a
 * number and create a hole in the sequence.
 */
export async function allocateNextInvoiceNumber(prefix: string): Promise<string> {
  const counter = await readCounter();
  const nextSequence = counter.lastSequence + 1;
  await writeCounter({ lastSequence: nextSequence });
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}
