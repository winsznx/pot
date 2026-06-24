"use client";

import { useEffect, useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { potAbi } from "@/lib/abi/pot";
import { CUSD_ADDRESS, POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

const PRESETS = [1, 5, 10, 25];

/**
 * Direct cUSD tip to a pot's creator. Doesn't touch the escrow path — funds
 * forward straight from the tipper to the creator. Useful when a backer wants
 * to show appreciation outside of the campaign math (or when the pot is
 * already withdrawn but still surfaced).
 */
export function TipCreatorButton({ potId }: { potId: string }) {
  // Hooks-first: every hook must run on both chain branches so the order
  // stays stable across chain toggle. The Stacks gate is rendered AFTER.
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<number>(5);

  const potIdBn = (() => {
    try {
      return BigInt(potId);
    } catch {
      return 0n;
    }
  })();

  const wei = (() => {
    if (!(amount > 0)) return 0n;
    try {
      return parseUnits(amount.toString(), 18);
    } catch {
      return 0n;
    }
  })();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, POT_ADDRESS] : undefined,
    query: { enabled: kind === "celo" && isConnected && isPotDeployed && !!address },
  });

  const needsApprove = !allowance || (allowance as bigint) < wei;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // Refetch allowance after any receipt confirms so the post-approve click
  // runs tipCreator instead of sending a second approve.
  useEffect(() => {
    if (confirmed && hash) {
      void refetchAllowance();
    }
  }, [confirmed, hash, refetchAllowance]);

  if (kind === "stacks") {
    return <CeloOnlyNotice feature={`Direct tips on POT.${potId}`} />;
  }

  function submit() {
    if (!isConnected || amount <= 0) return;
    if (needsApprove) {
      writeContract({
        abi: erc20Abi,
        address: CUSD_ADDRESS,
        functionName: "approve",
        args: [POT_ADDRESS, wei],
      });
      return;
    }
    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "tipCreator",
      args: [potIdBn, wei],
    });
  }

  const label = (() => {
    if (mining) return needsApprove ? "APPROVING…" : "TIPPING…";
    if (isPending) return "WAITING FOR WALLET…";
    if (!isConnected) return "CONNECT WALLET TO TIP";
    if (!isPotDeployed) return "CONTRACT NOT DEPLOYED";
    return needsApprove ? `APPROVE $${amount} cUSD` : `TIP $${amount} →`;
  })();

  const disabled = !isConnected || !isPotDeployed || mining || isPending;

  return (
    <div className="surface-card space-y-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-amber-glow" />
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          TIP THE CREATOR
        </span>
      </div>

      <div>
        <span className="field-label">Amount (cUSD)</span>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              aria-pressed={amount === p}
              className={`px-3 py-1.5 min-h-[44px] rounded-lg text-[13px] text-mono border transition-colors ${
                amount === p
                  ? "border-amber-glow text-amber-glow"
                  : "border-dark-carbon text-ash-gray hover:text-polar-white"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray text-mono">
            $
          </span>
          <input
            className="field-input pl-8 input-mono"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return setAmount(0);
              if (!/^\d*\.?\d*$/.test(v)) return;
              const n = Number(v);
              if (!Number.isFinite(n) || n < 0) return;
              setAmount(n);
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={disabled || amount <= 0}
        className="btn-manifesto w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {label}
      </button>

      {hash && (
        <div className="flex items-center justify-between text-[12px] text-mono text-ash-gray">
          <span>
            tx: <span className="text-polar-white">{hash.slice(0, 10)}…</span>
          </span>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
      {confirmed && (
        <p className="text-[13px] text-neon-green leading-[1.43]">
          Tip sent. 100% to the creator — no escrow, no fee.
        </p>
      )}

      <p className="text-[13px] text-ash-gray leading-[1.43]">
        Tips don&apos;t count toward the pot&apos;s target — they pay the creator directly.
      </p>
    </div>
  );
}
