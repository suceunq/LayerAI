interface ProgressBarProps {
  label: string;
  indeterminate?: boolean;
}

export function ProgressBar({ label, indeterminate = true }: ProgressBarProps): React.JSX.Element {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3" role="progressbar" aria-label={label} aria-valuetext={label}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full w-1/3 rounded-full bg-accent ${indeterminate ? "animate-[progress_1.2s_ease-in-out_infinite]" : ""}`} />
      </div>
      <p aria-hidden="true" className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}
