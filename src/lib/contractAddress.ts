/**
 * Centralised access to deployed addresses. Wraps the env-var reads so we
 * raise a recognisable error in dev when a worker isn't built with the
 * right `NEXT_PUBLIC_*` set.
 */
import type { Address } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

function read(name: string): Address {
  const v = (process.env as Record<string, string | undefined>)[name];
  if (!v) return ZERO;
  if (!/^0x[a-fA-F0-9]{40}$/.test(v)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[pot] ${name} is set but not a valid hex address: ${v}`);
    }
    return ZERO;
  }
  return v as Address;
}

export function getPotAddress(): Address {
  return read("NEXT_PUBLIC_POT_ADDRESS");
}

export function getPotBadgesAddress(): Address {
  return read("NEXT_PUBLIC_POT_BADGES_ADDRESS");
}

export function getCusdAddress(): Address {
  return read("NEXT_PUBLIC_CUSD_ADDRESS");
}

export function isDeployed(address: Address): boolean {
  return address !== ZERO;
}
