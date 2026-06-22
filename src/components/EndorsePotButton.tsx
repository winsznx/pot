"use client";

import { useEffect } from "react";
import { erc20Abi, formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  POT_STX_DEPLOYER,
  POT_STX_ENDORSE_FN,
  POT_STX_PINBOARD_CONTRACT,
} from "@/chain/stacksContracts";
import { potAbi } from "@/lib/abi/pot";
import { CUSD_ADDRESS, POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

/**
 * Paid signal-boost on a pot. The contract splits the configured endorseCost
 * 80/20 between the creator and the treasury — so the act of endorsing is also
 * a small tip back to the creator. Single endorsement per wallet per pot
 * (`hasEndorsed` mapping), so the button hides itself once you've already
 * endorsed this pot.
 */
export function EndorsePotButton({ potId, ended }: { potId: string; ended: boolean }) {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const stx = useStacksWrite();

  const potIdBn = (() => {
    try {
      return BigInt(potId);
    } catch {
      return 0n;
    }
  })();

  const { data: cost } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "endorseCost",
    query: { enabled: kind === "celo" && isPotDeployed, refetchInterval: 60_000 },
  });

  const { data: alreadyEndorsed } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "hasEndorsed",
    args: address ? [potIdBn, address] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isPotDeployed && !!address,
      refetchInterval: 30_000,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, POT_ADDRESS] : undefined,
    query: { enabled: kind === "celo" && isConnected && isPotDeployed && !!address },
  });

  const costBn = (cost as bigint | undefined) ?? 0n;
  const needsApprove = !allowance || (allowance as bigint) < costBn;
  const costStr = costBn > 0n ? Number(formatUnits(costBn, 18)).toFixed(2) : "—";

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // Refetch allowance the moment any receipt confirms — without this, after
  // approve the cached value stays stale and the next click sends another
  // approve instead of running endorsePot.
  useEffect(() => {
    if (confirmed && hash) {
      void refetchAllowance();
    }
  }, [confirmed, hash, refetchAllowance]);

  if (alreadyEndorsed) {
    return (
      <div className="surface-card text-center">
        <p className="text-[13px] text-mono text-neon-green">
          ✓ You&apos;ve endorsed this pot. Thanks for boosting it.
        </p>
      </div>
    );
  }

  async function submit() {
    if (ended) return;

    if (kind === "celo") {
      if (!isConnected) return;
      if (needsApprove) {
        writeContract({
          abi: erc20Abi,
          address: CUSD_ADDRESS,
          functionName: "approve",
          args: [POT_ADDRESS, costBn],
        });
        return;
      }
      writeContract({
        abi: potAbi,
        address: POT_ADDRESS,
        functionName: "endorsePot",
        args: [potIdBn],
      });
      return;
    }

    let s = readStacksSession();
    if (!s.isConnected) {
      s = await connectStacks();
      if (!s.isConnected) return;
    }
    await stx.call({
      contractAddress: POT_STX_DEPLOYER,
      contractName: POT_STX_PINBOARD_CONTRACT,
      functionName: POT_STX_ENDORSE_FN,
      args: [{ type: "uint", value: potIdBn }],
    });
  }

  const labelCelo = (() => {
    if (ended) return "POT HAS ENDED";
    if (mining) return needsApprove ? "APPROVING…" : "MINING…";
    if (isPending) return "WAITING FOR WALLET…";
    if (!isConnected) return "CONNECT WALLET TO ENDORSE";
    if (!isPotDeployed) return "CONTRACT NOT DEPLOYED";
    return needsApprove ? `APPROVE $${costStr} cUSD` : `ENDORSE $${costStr} →`;
  })();

  const labelStacks = stx.pending
    ? "WAITING FOR STACKS WALLET…"
    : stx.txid
      ? "ENDORSED ON STACKS ✓"
      : "ENDORSE ON STACKS →";

  const label = kind === "celo" ? labelCelo : labelStacks;
  const disabled =
    ended ||
    (kind === "celo" ? !isConnected || !isPotDeployed || mining || isPending : stx.pending);

  return (
    <div className="surface-card space-y-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-amber-glow" />
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          ENDORSE POT.{potId}
        </span>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="btn-manifesto w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <p className="text-[13px] text-ash-gray leading-[1.43]">
        Endorsement splits 80% to the creator, 20% to the treasury. One per wallet per pot.
      </p>
      {hash && (
        <div className="flex items-center justify-between text-[12px] text-mono text-ash-gray">
          <a
            href={`https://celoscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-amber-glow underline hover:text-polar-white"
          >
            view tx ↗ ({hash.slice(0, 10)}…)
          </a>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
      {stx.txid && (
        <a
          href={`https://explorer.hiro.so/txid/${stx.txid}?chain=mainnet`}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-amber-glow underline hover:text-polar-white"
        >
          view stacks tx ↗
        </a>
      )}
      {stx.error && (
        <p className="text-[12px]" style={{ color: "var(--danger)" }}>
          {stx.error.split("\n")[0]}
        </p>
      )}
      {confirmed && (
        <p className="text-[13px] text-neon-green leading-[1.43]">
          Endorsement confirmed. Creator just got ${(Number(costStr) * 0.8).toFixed(3)}.
        </p>
      )}
    </div>
  );
}
