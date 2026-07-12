const PRINTERS = [
  "Prusa MK4S",
  "Prusa MK4",
  "Prusa MINI+",
  "Prusa XL",
  "Prusa CORE One",
  "Bambu Lab X1C",
  "Bambu Lab P1S",
  "Bambu Lab A1",
  "Creality K2 Plus",
  "Creality K1C",
  "Creality Ender-3 V3",
];

export function CompatStrip(): React.JSX.Element {
  return (
    <section className="border-b border-border-subtle/70 bg-surface-1/40">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <p className="mb-4 text-center text-xs uppercase tracking-wide text-text-muted">Profils intégrés pour</p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {PRINTERS.map((p) => (
            <span key={p} className="font-mono text-sm text-text-secondary">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
