import { useAppStore } from "../state/useAppStore.js";

export function AdvancedTable(): React.JSX.Element {
  const config = useAppStore((s) => s.config);
  const updateConfigValue = useAppStore((s) => s.updateConfigValue);

  if (!config) return <></>;

  const entries = Object.entries(config).sort(([a], [b]) => a.localeCompare(b));

  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="text-text-muted">
          <th className="py-1.5 font-normal">Paramètre</th>
          <th className="py-1.5 font-normal">Valeur</th>
          <th className="py-1.5 font-normal">Confiance</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, entry]) => (
          <tr key={key} className="border-t border-border-subtle">
            <td className="py-1.5 pr-2 font-mono text-text-secondary">{key}</td>
            <td className="py-1.5 pr-2">
              {typeof entry.value === "boolean" ? (
                <input
                  type="checkbox"
                  checked={entry.value}
                  onChange={(e) => updateConfigValue(key, e.target.checked)}
                  className="accent-prusa-orange"
                />
              ) : (
                <input
                  value={String(entry.value)}
                  onChange={(e) => {
                    const numeric = Number(e.target.value);
                    updateConfigValue(key, Number.isNaN(numeric) || e.target.value.trim() === "" ? e.target.value : numeric);
                  }}
                  className="w-24 rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-text-primary outline-none focus:border-prusa-orange"
                />
              )}
            </td>
            <td className="py-1.5 tabular-nums text-text-muted">{Math.round(entry.confidence * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
