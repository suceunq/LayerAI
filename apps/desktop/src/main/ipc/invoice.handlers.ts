import { ipcMain, dialog, BrowserWindow } from "electron";
import { writeFile } from "node:fs/promises";
import { generateInvoicePdf } from "@layerai/invoice-generator";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { GenerateInvoiceRequest, GenerateInvoiceResponse } from "../../shared/ipc-types.js";
import { readSettings } from "../settings-store.js";
import { allocateNextInvoiceNumber } from "../invoice-store.js";
import { mainT } from "../localization.js";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "client"
  );
}

export function registerInvoiceHandlers(): void {
  ipcMain.handle(IpcChannels.invoiceGenerate, async (event, request: GenerateInvoiceRequest): Promise<GenerateInvoiceResponse> => {
    const settings = await readSettings();
    const company = settings.company;
    if (!company) {
      return { saved: false, error: mainT("native.invoice.companyRequired") };
    }

    // The save dialog runs before the invoice number is allocated - allocating first (and only
    // persisting the number if the user then cancels the dialog) would burn a number and leave a
    // gap in the legally-required sequential numbering.
    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: mainT("native.invoice.title"),
      filters: [{ name: mainT("native.invoice.filter"), extensions: ["pdf"] }],
      defaultPath: `${mainT("native.filename.invoice")}-${slugify(request.client.name)}.pdf`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    const invoiceNumber = await allocateNextInvoiceNumber(company.invoicePrefix);
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + company.paymentTermsDays);

    const pdf = await generateInvoicePdf({
      language: settings.language ?? "fr",
      invoiceNumber,
      invoiceDate: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      company,
      client: request.client,
      lineItems: request.lineItems,
      notes: request.notes,
    });
    await writeFile(result.filePath, pdf);
    return { saved: true, filePath: result.filePath, invoiceNumber };
  });
}
