import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { useTranslation } from "../i18n/useTranslation.js";

interface LineItemForm {
  description: string;
  quantity: number;
  unitPriceHt: number;
}

function suggestedUnitPrice(
  comparison: { aiFilamentG: number } | null,
  quantity: number,
  costSettings: { filamentPricePerKg: number | null }
): number {
  if (!comparison || costSettings.filamentPricePerKg == null) return 0;
  const materialCost = ((comparison.aiFilamentG * quantity) / 1000) * costSettings.filamentPricePerKg;
  return Math.round((materialCost / Math.max(1, quantity)) * 100) / 100;
}

export function InvoiceDialog(): React.JSX.Element | null {
  const open = useAppStore((s) => s.invoiceDialogOpen);
  const toggleOpen = useAppStore((s) => s.toggleInvoiceDialog);
  const companySettings = useAppStore((s) => s.companySettings);
  const toggleSettingsDialog = useAppStore((s) => s.toggleSettingsDialog);
  const generateInvoice = useAppStore((s) => s.generateInvoice);
  const invoiceGenerating = useAppStore((s) => s.invoiceGenerating);
  const invoiceError = useAppStore((s) => s.invoiceError);
  const showToolNotice = useAppStore((s) => s.showToolNotice);
  const importedFile = useAppStore((s) => s.importedFile);
  const quantity = useAppStore((s) => s.quantity);
  const comparison = useAppStore((s) => s.comparison);
  const costSettings = useAppStore((s) => s.costSettings);
  const { t } = useTranslation();

  const [client, setClient] = useState({ name: "", addressLine1: "", addressLine2: "", postalCode: "", city: "" });
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const description = importedFile?.fileName.replace(/\.[^.]+$/, "") ?? t("invoice.defaultDescription");
    setLineItems([{ description, quantity, unitPriceHt: suggestedUnitPrice(comparison, quantity, costSettings) }]);
    setClient({ name: "", addressLine1: "", addressLine2: "", postalCode: "", city: "" });
    setNotes("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const updateLineItem = (index: number, patch: Partial<LineItemForm>): void => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addLineItem = (): void => setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPriceHt: 0 }]);
  const removeLineItem = (index: number): void => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const totalHt = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceHt, 0);
  const canGenerate = !!companySettings && client.name.trim() !== "" && lineItems.length > 0 && !invoiceGenerating;

  const handleGenerate = async (): Promise<void> => {
    const result = await generateInvoice({
      client,
      lineItems: lineItems.filter((item) => item.description.trim() !== ""),
      notes: notes.trim() || undefined,
    });
    if (result.saved && result.invoiceNumber) {
      showToolNotice(t("invoice.saved", { number: result.invoiceNumber }));
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[600px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">{t("invoice.title")}</h2>
          <button onClick={toggleOpen} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!companySettings ? (
            <div className="rounded-lg border border-border-subtle bg-surface-1 p-4 text-sm text-text-secondary">
              <p className="mb-2">{t("invoice.noCompanyHint")}</p>
              <button
                onClick={() => {
                  toggleOpen();
                  toggleSettingsDialog();
                }}
                className="text-xs text-accent hover:text-accent-glow"
              >
                {t("cost.openSettings")} →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("invoice.clientTitle")}</p>
                <div className="flex flex-col gap-2">
                  <input
                    value={client.name}
                    onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))}
                    placeholder={t("invoice.clientName")}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                  <input
                    value={client.addressLine1}
                    onChange={(e) => setClient((c) => ({ ...c, addressLine1: e.target.value }))}
                    placeholder={t("settings.company.addressLine1")}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                  <input
                    value={client.addressLine2}
                    onChange={(e) => setClient((c) => ({ ...c, addressLine2: e.target.value }))}
                    placeholder={t("settings.company.addressLine2")}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                  <div className="flex gap-2">
                    <input
                      value={client.postalCode}
                      onChange={(e) => setClient((c) => ({ ...c, postalCode: e.target.value }))}
                      placeholder={t("settings.company.postalCode")}
                      className="w-28 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                    <input
                      value={client.city}
                      onChange={(e) => setClient((c) => ({ ...c, city: e.target.value }))}
                      placeholder={t("settings.company.city")}
                      className="flex-1 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("invoice.lineItemsTitle")}</p>
                <div className="flex flex-col gap-2">
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateLineItem(i, { description: e.target.value })}
                        placeholder={t("invoice.lineDescription")}
                        className="flex-1 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(i, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-16 rounded-lg border border-border-subtle bg-surface-2 px-2 py-2 text-center text-sm text-text-primary outline-none focus:border-accent"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPriceHt}
                        onChange={(e) => updateLineItem(i, { unitPriceHt: Number(e.target.value) })}
                        className="w-24 rounded-lg border border-border-subtle bg-surface-2 px-2 py-2 text-right text-sm text-text-primary outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => removeLineItem(i)}
                        disabled={lineItems.length <= 1}
                        className="text-text-muted hover:text-confidence-low disabled:opacity-30"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addLineItem} className="mt-2 text-xs text-accent hover:text-accent-glow">
                  + {t("invoice.addLine")}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-sm">
                <span className="text-text-secondary">{t("invoice.totalHt")}</span>
                <span className="font-semibold text-text-primary">
                  {totalHt.toFixed(2)} {costSettings.currency}
                </span>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("invoice.notes")}</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>

              {invoiceError && <p className="text-sm text-confidence-low">{invoiceError}</p>}
            </div>
          )}
        </div>

        {companySettings && (
          <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
            <Button variant="secondary" onClick={toggleOpen}>
              {t("settings.cancel")}
            </Button>
            <Button onClick={() => void handleGenerate()} disabled={!canGenerate}>
              {invoiceGenerating ? t("invoice.generating") : t("invoice.generate")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
