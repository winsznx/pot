"use client";

import { useEffect, useState } from "react";
import { erc20Abi, isAddress, parseUnits } from "viem";
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

const PRESETS = [10, 25, 50, 100];

/**
 * Donor matching. The contract enforces that the named `backer` has actually
 * contributed to this pot — so we probe `getContribution(potId, backer)`
 * before letting the caller sign. If the backer hasn't contributed, the
 * eligibility line surfaces that directly instead of letting wallet pop a
 * doomed approval.
 */
export function MatchContributionPanel({ potId, ended }: { potId: string; ended: boolean }) {
  // Hooks-first: run every hook on both chain branches so the order stays
  // stable across chain toggle. The Stacks gate is rendered AFTER.
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [backer, setBacker] = useState("");
  const [amount, setAmount] = useState<number>(25);

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
  const validBacker = isAddress(backer);
  const isSelf =
    validBacker && address ? backer.toLowerCase() === address.toLowerCase() : false;

  const { data: backerContribution } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "getContribution",
    args: validBacker ? [potIdBn, backer as `0x${string}`] : undefined,
    query: { enabled: kind === "celo" && isPotDeployed && validBacker, refetchInterval: 30_000 },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, POT_ADDRESS] : undefined,
    query: { enabled: kind === "celo" && isConnected && isPotDeployed && !!address },
  });

  const needsApprove = !allowance || (allowance as bigint) < wei;
  const backerHasContributed = (backerContribution as bigint | undefined) ?? 0n;
  const eligibleBacker = validBacker && backerHasContributed > 0n && !isSelf;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // Refetch allowance after any receipt confirms so the post-approve click
  // runs matchContribution instead of sending a second approve.
  useEffect(() => {
    if (confirmed && hash) {
      void refetchAllowance();
    }
  }, [confirmed, hash, refetchAllowance]);

  if (kind === "stacks") {
    return <CeloOnlyNotice feature={`Donor matching on POT.${potId}`} />;
  }

  function submit() {
    if (!isConnected || ended || amount <= 0 || !eligibleBacker) return;
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
      functionName: "matchContribution",
      args: [potIdBn, backer as `0x${string}`, wei],
    });
  }

  const reason = (() => {
    if (ended) return "Pot has ended — can't match.";
    if (!isConnected) return "Connect a wallet to match.";
    if (!isPotDeployed) return "Pot contract not deployed yet.";
    if (!backer.trim()) return "Paste the backer address you want to match.";
    if (!validBacker) return "That doesn't look like a valid address.";
    if (isSelf) return "You can't match yourself — use Contribute.";
    if (backerHasContributed === 0n) return "That wallet hasn't contributed to this pot yet.";
    return null;
  })();

  const cta = (() => {
    if (mining) return needsApprove ? "APPROVING…" : "MATCHING…";
    if (isPending) return "WAITING FOR WALLET…";
    if (needsApprove) return `APPROVE $${amount} cUSD`;
    return `MATCH $${amount} →`;
  })();

  return (
    <div className="surface-card space-y-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          MATCH A BACKER
        </span>
      </div>

      <div>
        <span className="field-label">Backer address</span>
        <input
          className="field-input input-mono"
          placeholder="0x… wallet that already contributed"
          value={backer}
          onChange={(e) => setBacker(e.target.value.trim())}
        />
      </div>

      <div>
        <span className="field-label">Match amount (cUSD)</span>
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

      {reason ? (
        <p className="text-[13px] text-ash-gray text-mono leading-[1.43]">{reason}</p>
      ) : (
        <p className="text-[13px] text-neon-green leading-[1.43]">
          Matching {backer.slice(0, 6)}…{backer.slice(-4)} — they put in $
          {(Number(backerHasContributed) / 1e18).toFixed(2)} already.
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!!reason || mining || isPending || amount <= 0}
        className="btn-manifesto w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {cta}
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
          Match confirmed. ${amount} added to the pot, attributed to you as the matcher.
        </p>
      )}
    </div>
  );
}
