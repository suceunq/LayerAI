import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "./ReportDocument.js";
import type { ReportData } from "./types.js";

export async function generatePdfReport(data: ReportData): Promise<Buffer> {
  return renderToBuffer(<ReportDocument data={data} />);
}
