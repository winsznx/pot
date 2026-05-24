import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  accent: "border-[var(--accent)] bg-[var(--bg-subtle)] text-[var(--accent)]",
};

type Props = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

export function Pill({ children, tone = "neutral", className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-mono ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
