"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, disconnectStacks, readStacksSession } from "@/chain/stacksSession";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [stxAddr, setStxAddr] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "stacks") return;
    const t = window.setTimeout(() => {
      const snap = readStacksSession();
      setStxAddr(snap.address);
    }, 0);
    return () => window.clearTimeout(t);
  }, [kind]);

  const isStacksConnected = useMemo(() => kind === "stacks" && !!stxAddr, [kind, stxAddr]);

  if (kind === "stacks") {
    if (isStacksConnected && stxAddr) {
      return (
        <button
          type="button"
          onClick={() => {
            disconnectStacks();
            setStxAddr(null);
          }}
          className="btn-chat"
          title="Click to disconnect"
        >
          <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
          <span className="text-mono">{shortAddr(stxAddr)}</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        className="btn-chat"
        onClick={async () => {
          try {
            await connectStacks();
          } finally {
            const snap = readStacksSession();
            setStxAddr(snap.address);
          }
        }}
      >
        CONNECT STACKS
        <span aria-hidden>→</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="btn-chat"
        title="Click to disconnect"
      >
        <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
        <span className="text-mono">{shortAddr(address)}</span>
      </button>
    );
  }

  const visible = connectors.filter((c) => c.id !== "metaMaskSDK");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-chat">
        CONNECT WALLET
        <span aria-hidden>→</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(false)} className="btn-chat">
        CHOOSE WALLET
      </button>
      <div className="absolute right-0 top-full mt-2 w-64 surface-card p-3 z-50 space-y-2">
        {visible.length === 0 && (
          <p className="text-[13px] text-ash-gray">
            No wallet found. Install MiniPay, Valora, or MetaMask to continue.
          </p>
        )}
        {visible.map((c) => (
          <button
            key={c.uid}
            type="button"
            onClick={() => {
              connect({ connector: c });
              setOpen(false);
            }}
            disabled={isPending}
            className="w-full text-left px-3 py-2 rounded-lg bg-deep-space hover:bg-midnight-void border border-dark-carbon hover:border-amber-glow/60 transition-colors text-[14px] text-polar-white disabled:opacity-50"
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
