export interface ProfileDbMeta {
  sourceVendor: string;
  sourceFile: string;
  sourceConfigVersion: string;
  sourceFileSha256_16: string;
  ingestedAt: string;
  license: string;
  attribution: string;
  printerCount: number;
  filamentCount: number;
}

export interface PrinterLayerHeightRange {
  printerId: string;
  minLayerHeightMm: number;
  maxLayerHeightMm: number;
  standardLayerHeightsMm: number[];
}
