interface ConfidenceBadgeProps {
  percent: number;
}

export function ConfidenceBadge({ percent }: ConfidenceBadgeProps): React.JSX.Element {
  const colorClass = percent >= 75 ? "text-confidence-high" : percent >= 50 ? "text-confidence-medium" : "text-confidence-low";
  return <span className={`text-xs font-semibold tabular-nums ${colorClass}`}>{percent}%</span>;
}
