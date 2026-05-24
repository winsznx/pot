import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

/**
 * Translucent surface for headers/overlays. Combines a soft border, modest
 * backdrop-blur, and an internal highlight ring so the card reads on both
 * subtle (off-white) and busy backgrounds.
 */
export function GlassCard({ children, className = "", as: As = "div" }: Props) {
  return (
    <As
      className={`relative rounded-2xl border border-[var(--border-subtle)] bg-white/65 p-5 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] backdrop-blur ${className}`}
    >
      {children}
    </As>
  );
}
