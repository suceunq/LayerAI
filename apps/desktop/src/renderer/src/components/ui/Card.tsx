import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={`rounded-xl border border-border-subtle bg-surface-1 ${className}`} {...props} />;
}
