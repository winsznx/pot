"use client";

import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

/**
 * Contributor-side refund. Shown on a failed pot (deadline passed without
 * target hit, refundIfMissed = true). Anyone who contributed can call this.
 */
export function RefundButton({ potId, eligible }: { potId: string; eligible: boolean }) {
  // Hooks-first: run every hook on both chain branches so the order stays
  // stable across a chain toggle.
  const { kind } = useChainKind();
  const { isConnected } = useAccount();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  if (kind === "stacks") {
    return <CeloOnlyNotice feature={`Refunds for POT.${potId}`} />;
  }

  const idBn = (() => {
    try {
      return BigInt(potId);
    } catch {
      return 0n;
    }
  })();

  const canSubmit = isConnected && isPotDeployed && eligible && !mining && !isPending;

  function submit() {
    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "refund",
      args: [idBn],
    });
  }

  if (!eligible) return null;

  const label = mining
    ? "MINING…"
    : isPending
      ? "WAITING FOR WALLET…"
      : isSuccess
        ? "REFUNDED ✓"
        : !isConnected
          ? "CONNECT TO REFUND"
          : !isPotDeployed
            ? "NO CONTRACT"
            : "PULL REFUND →";

  return (
    <div className="surface-card border-amber-glow/40 space-y-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-amber-glow" />
        <span className="text-[13px] uppercase text-amber-glow tracking-[0.06em] text-mono">
          REFUNDS OPEN
        </span>
      </div>
      <p className="text-[14px] text-ash-gray leading-[1.43]">
        This pot missed its target before the deadline. Pull your contribution back below.
      </p>
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="btn-manifesto w-full justify-center disabled:opacity-40"
      >
        {label}
      </button>
      {hash && (
        <button
          type="button"
          onClick={() => reset()}
          className="text-[11px] text-ash-gray underline"
        >
          reset
        </button>
      )}
    </div>
  );
}
