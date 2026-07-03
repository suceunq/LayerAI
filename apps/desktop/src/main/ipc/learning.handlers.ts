import { ipcMain, app } from "electron";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openLearningDb, insertOutcome, computeGeometrySignature, type LearningDb } from "@layerai/learning-store";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { RecordOutcomeRequest } from "../../shared/ipc-types.js";

let db: LearningDb | null = null;

function getDb(): LearningDb {
  if (!db) db = openLearningDb(join(app.getPath("userData"), "learning-store.json"));
  return db;
}

export function registerLearningHandlers(): void {
  ipcMain.handle(IpcChannels.learningRecordOutcome, async (_event, request: RecordOutcomeRequest): Promise<void> => {
    insertOutcome(getDb(), {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      geometrySignature: computeGeometrySignature(request.analysis),
      printerId: request.printerId,
      filamentId: request.filamentId,
      intentTags: request.intentTags,
      configUsed: request.configUsed,
      outcome: request.outcome,
      notes: request.notes,
    });
  });
}

export { getDb as getLearningDb };
