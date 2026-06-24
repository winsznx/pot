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

const PRESETS = [5, 10, 25, 50, 100];

/**
 * Two-step contribute: ERC20 approve (skipped when allowance already covers) → Pot.contribute.
 * Surfaces the in-flight transaction hash so the user can confirm on Celoscan if they want.
 */
export function ContributeBox({ potId, ended }: { potId: string; ended: boolean }) {
  // Hooks-first: every wagmi hook MUST run on both chain branches so the
  // hook order stays stable when the user flips Celo↔Stacks. The Stacks
  // gate is rendered AFTER the hooks below.
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<number | "">(10);
  const [phase, setPhase] = useState<"idle" | "approving" | "contributing">("idle");

  // Wrap parseUnits in try/catch: Number.toString() on tiny decimals emits
  // scientific notation ("1e-16"), and viem's parseUnits regex rejects that
  // with a synchronous throw at render time which used to crash the whole
  // panel into an error boundary.
  const wei = (() => {
    if (typeof amount !== "number" || amount <= 0) return 0n;
    try {
      return parseUnits(amount.toString(), 18);
    } catch {
      return 0n;
    }
  })();
  const potIdBn = (() => {
    try {
      return BigInt(potId);
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

  const { writeContract, data: txHash, isPending, reset, error: writeError } =
    useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Refetch the cached allowance the moment the approve receipt confirms so
  // the next click runs Pot.contribute instead of sending another approve.
  // Reset phase back to idle once the contribute receipt confirms so the
  // resting button label stops claiming "MINING…" if mining flickers.
  useEffect(() => {
    if (confirmed && phase === "approving") {
      void refetchAllowance();
      setPhase("contributing");
    } else if (confirmed && phase === "contributing") {
      setPhase("idle");
    }
  }, [confirmed, phase, refetchAllowance]);

  // Drop phase on wallet rejection so the CTA returns to "CONTRIBUTE $X →"
  // instead of clinging to "APPROVING…".
  useEffect(() => {
    if (writeError) setPhase("idle");
  }, [writeError]);

  if (kind === "stacks") {
    return (
      <div className="surface-card space-y-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
          <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
            CONTRIBUTE TO POT.{potId}
          </span>
        </div>
        <CeloOnlyNotice feature="Contributions" />
      </div>
    );
  }

  const needsApprove = !allowance || (allowance as bigint) < wei;
  const canSubmit =
    !ended &&
    isConnected &&
    isPotDeployed &&
    wei > 0n &&
    !mining &&
    !isPending;

  function submit() {
    if (!isConnected || wei === 0n) return;
    if (needsApprove) {
      setPhase("approving");
      writeContract({
        abi: erc20Abi,
        address: CUSD_ADDRESS,
        functionName: "approve",
        args: [POT_ADDRESS, wei],
      });
      return;
    }
    setPhase("contributing");
    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "contribute",
      args: [potIdBn, wei],
    });
  }

  const buttonLabel = (() => {
    if (ended) return "POT HAS ENDED";
    if (mining) return phase === "approving" ? "APPROVING…" : "MINING…";
    if (isPending) return "WAITING FOR WALLET…";
    if (!isConnected) return "CONNECT WALLET TO CONTRIBUTE";
    if (!isPotDeployed) return "CONTRACT NOT DEPLOYED";
    if (needsApprove) return `APPROVE $${amount || 0} cUSD`;
    return `CONTRIBUTE $${amount || 0} →`;
  })();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="surface-card space-y-5"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          CONTRIBUTE TO POT.{potId}
        </span>
      </div>

      <div>
        <span className="field-label">Amount (cUSD)</span>
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray text-mono">
            $
          </span>
          <input
            className="field-input pl-8 input-mono"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={amount === "" ? "" : amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return setAmount("");
              // Reject scientific notation (1e10), negatives, NaN. Without this
              // type="number" let users sign a billion-dollar contribute by
              // typing "1e10" into the field.
              if (!/^\d*\.?\d*$/.test(v)) return;
              const n = Number(v);
              if (!Number.isFinite(n) || n < 0) return;
              setAmount(n);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={amount === p}
              className={`px-4 py-2 rounded-lg text-[13px] text-mono border transition-colors ${
                amount === p
                  ? "border-amber-glow text-amber-glow"
                  : "border-dark-carbon text-ash-gray hover:text-polar-white"
              }`}
              onClick={() => setAmount(p)}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        aria-busy={mining || isPending}
        className="btn-manifesto w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>

      {txHash && (
        <div className="flex items-center justify-between text-[12px] text-ash-gray text-mono">
          <a
            href={`https://celoscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-amber-glow underline hover:text-polar-white"
          >
            view tx ↗ ({txHash.slice(0, 10)}…)
          </a>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
      {writeError && (
        <p className="text-[12px]" style={{ color: "var(--danger)" }}>
          {writeError.message.split("\n")[0]}
        </p>
      )}
      {confirmed && (
        <p className="text-[13px] text-neon-green leading-[1.43]">
          Contribution confirmed. Refresh to see your wallet on the contributor wall.
        </p>
      )}

      <p className="text-[13px] text-ash-gray leading-[1.43]">
        Sub-cent gas on Celo. Contributions are pull-refundable if the pot misses its target with
        refunds enabled.
      </p>
    </form>
  );
}
