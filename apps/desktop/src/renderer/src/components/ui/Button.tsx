import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-surface-0 hover:bg-accent-glow disabled:bg-surface-3 disabled:text-text-muted",
  secondary: "bg-surface-2 text-text-primary border border-border-subtle hover:bg-surface-3",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-1",
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps): React.JSX.Element {
  return (
    <button
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
