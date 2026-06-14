"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";
import { progress, timeLeft } from "@/lib/format";

const WINDOW = 9;

type PotData = {
  creator: `0x${string}`;
  deadline: bigint;
  refundIfMissed: boolean;
  status: number;
  target: bigint;
  raised: bigint;
  metadataHash: `0x${string}`;
};

/**
 * Reads the most recent pots on-chain and surfaces the ones still active.
 * Falls back to a "deploy the contract first" placeholder when POT_ADDRESS
 * isn't set, so the landing page keeps rendering during pre-deployment.
 */
export function LivePotsStrip() {
  const { kind } = useChainKind();

  const { data: nextIdRaw } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "nextPotId",
    query: { enabled: kind === "celo" && isPotDeployed, refetchInterval: 30_000 },
  });

  const nextId = typeof nextIdRaw === "bigint" ? nextIdRaw : 0n;
  const startId = nextId > BigInt(WINDOW) ? nextId - BigInt(WINDOW) : 0n;
  const count = Number(nextId - startId);

  const contracts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        abi: potAbi,
        address: POT_ADDRESS,
        functionName: "getPot" as const,
        args: [startId + BigInt(i)] as const,
      })),
    [count, startId],
  );

  const { data: results, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: kind === "celo" && isPotDeployed && count > 0,
      refetchInterval: 30_000,
    },
  });

  const active = useMemo(() => {
    if (!results) return [];
    return results
      .map((r, idx) => {
        if (r.status !== "success") return null;
        const p = r.result as unknown as PotData;
        if (p.status !== 0) return null; // 0 = Active
        return {
          id: (startId + BigInt(idx)).toString().padStart(4, "0"),
          raised: p.raised,
          target: p.target,
          deadline: p.deadline,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      raised: bigint;
      target: bigint;
      deadline: bigint;
    }>;
  }, [results, startId]);

  if (kind === "stacks") {
    return (
      <div className="surface-card text-center body-sm">
        Live activity on Stacks shows up in the leaderboard — switch back to Celo here to see
        live pots, or open the{" "}
        <Link href="/leaderboard" className="underline">leaderboard</Link> to see Stacks activity.
      </div>
    );
  }

  if (!isPotDeployed) {
    return (
      <div className="surface-card text-center body-sm">
        Pot contract not yet deployed. Live strip will populate once the address is wired.
      </div>
    );
  }

  if (isLoading || count === 0) {
    return (
      <div className="surface-card text-center text-[14px] text-[var(--text-tertiary)] text-mono">
        {count === 0 ? "No pots yet. Be the first to create one." : "Loading active pots…"}
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <div className="surface-card text-center text-[14px] text-[var(--text-tertiary)] text-mono">
        No active pots right now.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {active.slice(0, 6).map((pot) => {
        const target = Number(formatUnits(pot.target, 18));
        const raised = Number(formatUnits(pot.raised, 18));
        const pct = target > 0 ? progress(raised, target) : 100;
        const ddlMs = Number(pot.deadline) * 1000;
        return (
          <Link
            key={pot.id}
            href={`/p/${pot.id}`}
            className="surface-card transition-colors hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <span aria-hidden className="status-dot text-[var(--success)]" />
              <span className="label-caps">
                POT.{pot.id}
              </span>
              <span className="ml-auto text-[13px] text-[var(--text-tertiary)] text-mono">
                {pot.deadline === 0n ? "OPEN-ENDED" : timeLeft(ddlMs)}
              </span>
            </div>
            <div className="progress-track mb-3">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-[var(--text-primary)] text-mono">
                <span className="font-bold">${raised.toFixed(0)}</span>
                {target > 0 && <span className="text-[var(--text-tertiary)]"> / ${target.toFixed(0)}</span>}
              </span>
              <span className="text-[var(--accent)] text-mono">{pct}%</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
