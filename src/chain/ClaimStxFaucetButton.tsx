"use client";

import { useState } from "react";
import { useStacksSession } from "./useStacksSession";

const FAUCET_CONTRACT =
  process.env.NEXT_PUBLIC_STACKS_FAUCET_CONTRACT ??
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.stx-faucet";

const STACKS_ENABLED = process.env.NEXT_PUBLIC_STACKS_ENABLED === "1";

export function ClaimStxFaucetButton({ className = "" }: { className?: string }) {
  const { isConnected } = useStacksSession();
  const [pending, setPending] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    if (!isConnected) return;
    setPending(true);
    setErr(null);
    try {
      if (!STACKS_ENABLED) {
        const [contract, name] = FAUCET_CONTRACT.split(".");
        window.open(
          `https://explorer.hiro.so/txid/${contract}.${name}?chain=mainnet`,
          "_blank",
          "noopener,noreferrer",
        );
        setErr("Open the Hiro explorer to interact directly (SDK pending re-enable)");
        return;
      }
      const mod = await import("@stacks/connect" /* webpackChunkName: "stacks-connect" */);
      const response = await mod.request("stx_callContract", {
        contract: FAUCET_CONTRACT as `${string}.${string}`,
        functionName: "claim",
        functionArgs: [],
        network: "mainnet",
      });
      setTxId((response as { txid?: string }).txid ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={!isConnected || pending}
        className="rounded-full border border-current px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Sign in wallet..." : "Claim STX from faucet"}
      </button>
      {txId && (
        <div className="mt-2 font-mono text-xs opacity-70">tx: {txId.slice(0, 12)}...</div>
      )}
      {err && <div className="mt-2 font-mono text-xs text-rose-600">{err}</div>}
    </div>
  );
}
