"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { useStacksSession } from "@/chain/useStacksSession";
import {
  connectStacks,
  disconnectStacks,
  isStacksWalletAvailable,
} from "@/chain/stacksSession";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [stxAvail, setStxAvail] = useState<boolean | null>(null);
  const [stxBusy, setStxBusy] = useState(false);
  const [stxInstallOpen, setStxInstallOpen] = useState(false);
  // Subscribe to the reactive useStacksSession hook instead of a one-shot
  // read so the button reflects wallet-side disconnects (cross-tab + same-
  // tab) without staying stuck on the stale principal.
  const { address: stxAddr } = useStacksSession();

  useEffect(() => {
    if (kind !== "stacks") return;
    isStacksWalletAvailable().then(setStxAvail);
  }, [kind]);

  const isStacksConnected = useMemo(() => kind === "stacks" && !!stxAddr, [kind, stxAddr]);

  if (kind === "stacks") {
    if (isStacksConnected && stxAddr) {
      return (
        <button
          type="button"
          onClick={async () => {
            await disconnectStacks();
          }}
          className="btn-chat"
          title="Click to disconnect"
        >
          <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
          <span className="text-mono">{shortAddr(stxAddr)}</span>
        </button>
      );
    }

    if (stxAvail === false) {
      return (
        <div className="relative">
          <button
            type="button"
            className="btn-chat"
            onClick={() => setStxInstallOpen((v) => !v)}
          >
            INSTALL STACKS WALLET
          </button>
          {stxInstallOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 surface-raised space-y-2 p-3 text-sm">
              <p className="body-sm text-mono">
                Pot needs Leather or Xverse to sign Stacks transactions.
              </p>
              <a
                href="https://leather.io/install-extension"
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2"
              >
                Install Leather ↗
              </a>
              <a
                href="https://www.xverse.app/download"
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2"
              >
                Install Xverse ↗
              </a>
              <button
                type="button"
                onClick={async () => {
                  const next = await isStacksWalletAvailable();
                  setStxAvail(next);
                  if (next) setStxInstallOpen(false);
                }}
                className="block w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              >
                I just installed one — retry
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled={stxBusy}
        className="btn-chat disabled:opacity-50"
        onClick={async () => {
          setStxBusy(true);
          try {
            await connectStacks();
          } finally {
            setStxBusy(false);
          }
        }}
      >
        {stxBusy ? "OPENING WALLET…" : "CONNECT STACKS"}
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
