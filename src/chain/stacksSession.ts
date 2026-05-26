"use client";

/**
 * Stacks session shim. We deliberately don't pull @stacks/connect statically
 * into the bundle — the SDK is 1MB+ and pushes the worker over its 1MB gzipped
 * limit. Set `NEXT_PUBLIC_STACKS_ENABLED=1` at build time to wire in the real
 * dynamic import via the lazy loader.
 */

export type StacksSessionState = {
  isConnected: boolean;
  address: string | null;
};

const STORAGE_KEY = "blockstack-session";

export function readStacksSession(): StacksSessionState {
  if (typeof window === "undefined") return { isConnected: false, address: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { isConnected: false, address: null };
    const data: { addresses?: { stx?: { address?: string }[] } } = JSON.parse(raw);
    const stx = data.addresses?.stx?.[0]?.address;
    if (stx) return { isConnected: true, address: stx };
  } catch {
    /* ignore */
  }
  return { isConnected: false, address: null };
}

export async function connectStacks(): Promise<void> {
  // Lazy CDN-loaded path keeps the worker bundle slim. Falls back to opening
  // the Hiro web wallet so users can still sign in until @stacks ships
  // re-enabled.
  const enabled = process.env.NEXT_PUBLIC_STACKS_ENABLED === "1";
  if (!enabled) {
    if (typeof window !== "undefined") {
      window.open("https://wallet.hiro.so/", "_blank", "noopener,noreferrer");
    }
    return;
  }
  const mod = await import("@stacks/connect" /* webpackChunkName: "stacks-connect" */);
  await mod.connect();
}

export async function disconnectStacks(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
