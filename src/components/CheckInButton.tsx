"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

const COOLDOWN_SEC = 20 * 60 * 60; // matches Pot.CHECK_IN_COOLDOWN

/**
 * Pot's daily check-in retention loop.
 *
 * Reads the connected wallet's `lastCheckIn` + `streak` so we can show the
 * actual run + cooldown timer next to the call-to-action. Disables itself
 * when the cooldown isn't satisfied — the contract reverts anyway, but
 * it's nicer to gate it client-side too.
 */
export function CheckInButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [nowSec, setNowSec] = useState(0);

  useEffect(() => {
    const initial = window.setTimeout(() => setNowSec(Math.floor(Date.now() / 1000)), 0);
    const id = window.setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, []);

  const { data: last, refetch: refetchLast } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "lastCheckIn",
    args: address ? [address] : undefined,
    query: { enabled: kind === "celo" && isConnected && isPotDeployed && !!address, refetchInterval: 60_000 },
  });

  const { data: streak } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "streak",
    args: address ? [address] : undefined,
    query: { enabled: kind === "celo" && isConnected && isPotDeployed && !!address, refetchInterval: 60_000 },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // Cancel the pending refetch timer if the component unmounts before the 6s
  // window passes — otherwise setState fires post-unmount.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
  }, []);

  const lastTs = typeof last === "bigint" ? Number(last) : 0;
  const secondsLeft = lastTs === 0 ? 0 : Math.max(0, lastTs + COOLDOWN_SEC - nowSec);
  const onCooldown = secondsLeft > 0;
  const runVal = streak !== undefined ? Number(streak) : 0;

  const canSubmit = isConnected && isPotDeployed && !onCooldown && !mining && !isPending;

  function submit() {
    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "checkIn",
      args: [],
    });
    // Optimistically refetch so the cooldown updates fast on confirm.
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => {
      refetchLast().catch(() => undefined);
    }, 6_000);
  }

  const label = mining
    ? "MINING…"
    : isPending
      ? "SIGNING…"
      : isSuccess
        ? "CHECKED IN ✓"
        : onCooldown
          ? formatCooldown(secondsLeft)
          : !isConnected
            ? "CONNECT TO CHECK IN"
            : !isPotDeployed
              ? "NO CONTRACT"
              : "CHECK IN →";

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Daily check-in streak" />;
  }

  return (
    <div className="surface-card flex items-center justify-between gap-4">
      <div>
        <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-1">
          DAILY STREAK
        </div>
        <div className="text-[23px] font-bold text-polar-white leading-[1.11]">
          {runVal} day{runVal === 1 ? "" : "s"}
        </div>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        aria-busy={mining || isPending}
        className="btn-manifesto disabled:opacity-40"
      >
        {label}
      </button>
      {hash && (
        <button
          type="button"
          onClick={() => reset()}
          className="text-[11px] text-ash-gray underline ml-2"
        >
          reset
        </button>
      )}
    </div>
  );
}

function formatCooldown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `WAIT ${h}H ${m}M`;
  return `WAIT ${m}M`;
}
