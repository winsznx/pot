"use client";

import { useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { potAbi } from "@/lib/abi/pot";
import { CUSD_ADDRESS, POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

const PRESETS = [5, 10, 25, 50, 100];

/**
 * Two-step contribute: ERC20 approve (skipped when allowance already covers) → Pot.contribute.
 * Surfaces the in-flight transaction hash so the user can confirm on Celoscan if they want.
 */
export function ContributeBox({ potId, ended }: { potId: string; ended: boolean }) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<number | "">(10);
  const [anon, setAnon] = useState(false);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"idle" | "approving" | "contributing">("idle");

  const wei = typeof amount === "number" && amount > 0 ? parseUnits(amount.toString(), 18) : 0n;
  const potIdBn = (() => {
    try {
      return BigInt(potId);
    } catch {
      return 0n;
    }
  })();

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, POT_ADDRESS] : undefined,
    query: { enabled: isConnected && isPotDeployed && !!address },
  });

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash: txHash });

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
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            value={amount === "" ? "" : amount}
            onChange={(e) => {
              const v = e.target.value;
              setAmount(v === "" ? "" : Math.max(0, Number(v)));
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
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

      <div>
        <span className="field-label">Display name (optional)</span>
        <input
          className="field-input"
          placeholder="ife.eth"
          value={name}
          disabled={anon}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="mt-3 flex items-center gap-2 text-[13px] text-ash-gray text-mono cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            className="accent-amber-glow"
          />
          CONTRIBUTE ANONYMOUSLY
        </label>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-manifesto w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>

      {txHash && (
        <div className="flex items-center justify-between text-[12px] text-ash-gray text-mono">
          <span>
            tx: <span className="text-polar-white">{txHash.slice(0, 10)}…</span>
          </span>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
      {confirmed && (
        <p className="text-[13px] text-neon-green leading-[1.43]">
          Contribution confirmed. Refresh to see your name on the wall.
        </p>
      )}

      <p className="text-[13px] text-ash-gray leading-[1.43]">
        Sub-cent gas on Celo. Contributions are pull-refundable if the pot misses its target with
        refunds enabled.
      </p>
    </form>
  );
}
