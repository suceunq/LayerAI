import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "./InvoiceDocument.js";
import type { InvoiceData } from "./types.js";

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
