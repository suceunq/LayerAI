import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  return (
    <select
      className={`rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange ${className}`}
      {...props}
    />
  );
}
