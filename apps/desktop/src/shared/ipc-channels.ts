export const IpcChannels = {
  importOpenDialog: "import:open-dialog",
  importReadDropped: "import:read-dropped",
  analysisRun: "analysis:run",
  configGenerate: "config:generate",
  profileDbGetPrinters: "profiledb:get-printers",
  profileDbGetFilaments: "profiledb:get-filaments",
  exportThreeMf: "export:threemf",
  exportPdfReport: "export:pdf-report",
  exportIni: "export:ini",
  learningRecordOutcome: "learning:record-outcome",
  customProfilesList: "custom-profiles:list",
  customProfilesSave: "custom-profiles:save",
  customProfilesDelete: "custom-profiles:delete",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
