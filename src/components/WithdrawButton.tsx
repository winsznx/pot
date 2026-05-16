"use client";

import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

/**
 * Creator-only withdraw. Reverts on chain if the caller isn't the creator or
 * the pot isn't withdrawable yet — we just surface the wallet's revert reason.
 */
export function WithdrawButton({ potId, disabled }: { potId: string; disabled?: boolean }) {
  const { isConnected } = useAccount();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  const idBn = (() => {
    try {
      return BigInt(potId);
    } catch {
      return 0n;
    }
  })();

  const canSubmit = isConnected && isPotDeployed && !disabled && !mining && !isPending;

  function submit() {
    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "withdraw",
      args: [idBn],
    });
  }

  const label = mining
    ? "MINING…"
    : isPending
      ? "SIGNING…"
      : isSuccess
        ? "WITHDRAWN ✓"
        : !isConnected
          ? "CONNECT TO WITHDRAW"
          : !isPotDeployed
            ? "NO CONTRACT"
            : "WITHDRAW →";

  return (
    <div className="flex md:justify-end items-center gap-2">
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="btn-manifesto py-2 px-4 text-[14px] disabled:opacity-40"
      >
        {label}
      </button>
      {hash && (
        <button
          type="button"
          onClick={() => reset()}
          className="text-[11px] text-ash-gray underline"
          title="Reset transaction state"
        >
          reset
        </button>
      )}
    </div>
  );
}
