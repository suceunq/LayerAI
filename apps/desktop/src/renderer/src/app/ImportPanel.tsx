import { useState, type DragEvent } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { Select } from "../components/ui/Select.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { RecentProjectsList } from "./RecentProjectsList.js";
import { filamentGroupForVendor, filamentGroupOfId } from "../lib/vendor-filament.js";

const ACCEPTED_EXTENSIONS = [".stl", ".obj", ".3mf"];

export function ImportPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const printers = useAppStore((s) => s.printers);
  const filaments = useAppStore((s) => s.filaments);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);
  const selectedFilamentId = useAppStore((s) => s.selectedFilamentId);
  const setPrinter = useAppStore((s) => s.setPrinter);
  const setFilament = useAppStore((s) => s.setFilament);
  const importFromDialog = useAppStore((s) => s.importFromDialog);
  const importDroppedPath = useAppStore((s) => s.importDroppedPath);
  const error = useAppStore((s) => s.error);

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const path = (file as File & { path?: string }).path;
    const hasSupportedExtension = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!path || !hasSupportedExtension) return;
    void importDroppedPath(path);
  };

  const printersByVendor = new Map<string, typeof printers>();
  for (const p of printers) {
    if (!printersByVendor.has(p.vendor)) printersByVendor.set(p.vendor, []);
    printersByVendor.get(p.vendor)!.push(p);
  }
  const vendors = Array.from(printersByVendor.keys());

  const selectedVendor = printers.find((p) => p.id === selectedPrinterId)?.vendor;
  const printersOfSelectedVendor = selectedVendor ? (printersByVendor.get(selectedVendor) ?? []) : [];
  const selectedFilamentGroup = filamentGroupForVendor(selectedVendor);
  const compatibleFilaments = filaments.filter((f) => filamentGroupOfId(f.id) === selectedFilamentGroup);

  const handleBrandChange = (vendor: string): void => {
    const firstOfVendor = printersByVendor.get(vendor)?.[0];
    if (firstOfVendor) setPrinter(firstOfVendor.id);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold text-text-primary">{t("import.title")}</h2>
        <p className="max-w-md text-sm text-text-secondary">{t("import.subtitle")}</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-colors ${
          isDragOver ? "border-accent bg-surface-1" : "border-border-subtle bg-surface-1/50"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-3xl text-accent">↑</div>
        <p className="text-sm text-text-secondary">{t("import.dropHint")}</p>
        <Button onClick={() => void importFromDialog()}>{t("import.browse")}</Button>
      </div>

      {error && <p role="alert" className="max-w-md text-center text-sm text-confidence-low">{error}</p>}

      <RecentProjectsList />

      <div className="flex w-full flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">{t("import.brand")}</span>
            <Select value={selectedVendor ?? ""} onChange={(e) => handleBrandChange(e.target.value)} className="w-full">
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">{t("import.printer")}</span>
            <Select value={selectedPrinterId} onChange={(e) => setPrinter(e.target.value)} className="w-full">
              {printersOfSelectedVendor.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">{t("import.filament")}</span>
          <Select value={selectedFilamentId} onChange={(e) => setFilament(e.target.value)} className="w-full">
            {compatibleFilaments.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </div>
  );
}
