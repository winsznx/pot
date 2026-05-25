"use client";

import { useEffect, useState } from "react";

/**
 * cUSD pegs to USD ~1:1, but the field exists for when we want to show
 * "approximately $X" using a real rate later. For now this is a 1:1 stub
 * that future devs can wire to a price feed without touching consumers.
 */
export function useUsdPrice(): { rate: number; loading: boolean; error: string | null } {
  const [state, setState] = useState({ rate: 1, loading: false, error: null as string | null });

  useEffect(() => {
    // Placeholder for an on-chain or off-chain feed wiring.
    const t = window.setTimeout(() => setState({ rate: 1, loading: false, error: null }), 0);
    return () => window.clearTimeout(t);
  }, []);

  return state;
}
