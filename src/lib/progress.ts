/**
 * Pot progress utilities. Target = 0 means an open-ended pot — those are
 * treated as 100% complete since there's nothing left to raise toward.
 */
export function progressPct(raised: bigint, target: bigint): number {
  if (target === 0n) return 100;
  const pct = Number((raised * 10_000n) / target) / 100;
  return Math.max(0, Math.min(100, pct));
}

export function progressLabel(raised: bigint, target: bigint): string {
  if (target === 0n) return "open ended";
  const pct = progressPct(raised, target);
  return `${pct.toFixed(0)}%`;
}

export function isFullyFunded(raised: bigint, target: bigint): boolean {
  if (target === 0n) return false;
  return raised >= target;
}
