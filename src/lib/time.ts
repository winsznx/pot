/**
 * Relative time helpers. SSR-safe: never read Date.now() inline from a
 * component without a useEffect — pass `nowMs` in or run on the client.
 */
const MIN = 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export function relativeFromNow(targetSec: number | bigint, nowSec: number): string {
  const target = typeof targetSec === "bigint" ? Number(targetSec) : targetSec;
  const diff = target - nowSec;
  if (diff === 0) return "now";
  const abs = Math.abs(diff);
  const future = diff > 0;
  const value =
    abs >= WEEK
      ? `${Math.round(abs / WEEK)}w`
      : abs >= DAY
        ? `${Math.round(abs / DAY)}d`
        : abs >= HOUR
          ? `${Math.round(abs / HOUR)}h`
          : abs >= MIN
            ? `${Math.round(abs / MIN)}m`
            : `${abs}s`;
  return future ? `in ${value}` : `${value} ago`;
}

export function timeLeftCompact(deadlineSec: number | bigint, nowSec: number): string {
  const deadline = typeof deadlineSec === "bigint" ? Number(deadlineSec) : deadlineSec;
  const diff = deadline - nowSec;
  if (diff <= 0) return "ended";
  if (diff < HOUR) return `${Math.ceil(diff / MIN)}m left`;
  if (diff < DAY) return `${Math.ceil(diff / HOUR)}h left`;
  return `${Math.ceil(diff / DAY)}d left`;
}
