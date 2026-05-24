import { formatUnits, parseUnits } from "viem";

const DECIMALS = 18;

export function formatCusdAmount(wei: bigint, opts: { maxDecimals?: number } = {}): string {
  const { maxDecimals = 2 } = opts;
  const raw = formatUnits(wei, DECIMALS);
  const num = Number(raw);
  if (!Number.isFinite(num)) return raw;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function parseCusdAmount(input: string): bigint {
  const trimmed = input.replace(/,/g, "").trim();
  if (trimmed === "" || trimmed === "." || trimmed === "-") return 0n;
  try {
    return parseUnits(trimmed, DECIMALS);
  } catch {
    return 0n;
  }
}

export function shortCusd(wei: bigint): string {
  const value = Number(formatUnits(wei, DECIMALS));
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(value < 1 ? 3 : 2);
}
