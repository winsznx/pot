"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  useReadContracts,
} from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";
import { progress, timeLeft } from "@/lib/format";

const LOOKBACK_BLOCKS = 200_000n;

type PotData = {
  creator: `0x${string}`;
  deadline: bigint;
  refundIfMissed: boolean;
  status: number;
  target: bigint;
  raised: bigint;
  metadataHash: `0x${string}`;
};

type Row = {
  id: bigint;
  data: PotData;
};

const STATUS = ["Active", "Withdrawn", "Refunded", "Cancelled"] as const;

/**
 * Surface the connected user's own pots by indexing PotCreated events filtered
 * by creator == address. Then batch-read each pot's current state for status,
 * raised, etc. so the table reflects live numbers, not just event payloads.
 */
export function OwnPots() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const [ids, setIds] = useState<bigint[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !isPotDeployed || !address) {
      setIds(null);
      return;
    }
    let cancelled = false;
    setErr(null);

    (async () => {
      try {
        const client = getPublicClient(config, { chainId });
        if (!client) return;
        const head = await client.getBlockNumber();
        const from = head > LOOKBACK_BLOCKS ? head - LOOKBACK_BLOCKS : 0n;

        const eventAbi = potAbi.find(
          (i) => i.type === "event" && i.name === "PotCreated",
        ) as Extract<(typeof potAbi)[number], { type: "event"; name: "PotCreated" }>;

        const logs = await client.getLogs({
          address: POT_ADDRESS,
          event: eventAbi,
          args: { creator: address },
          fromBlock: from,
          toBlock: head,
        });
        if (cancelled) return;
        setIds(
          logs
            .map((l) => l.args.potId as bigint | undefined)
            .filter((x): x is bigint => typeof x === "bigint"),
        );
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, chainId, config]);

  const contracts = useMemo(
    () =>
      (ids ?? []).map((id) => ({
        abi: potAbi,
        address: POT_ADDRESS,
        functionName: "getPot" as const,
        args: [id] as const,
      })),
    [ids],
  );

  const { data: results } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0, refetchInterval: 30_000 },
  });

  const rows: Row[] = useMemo(() => {
    if (!ids || !results) return [];
    return ids
      .map((id, idx) => {
        const r = results[idx];
        if (!r || r.status !== "success") return null;
        return { id, data: r.result as unknown as PotData };
      })
      .filter(Boolean) as Row[];
  }, [ids, results]);

  if (!isPotDeployed) {
    return <Placeholder text="Pot contract not deployed yet. Your pots will surface here once it goes live." />;
  }
  if (!isConnected) {
    return <Placeholder text="Connect a wallet to load the pots you've created." />;
  }
  if (err) {
    return <Placeholder text={`Could not load: ${err}`} tone="warn" />;
  }
  if (ids === null) {
    return <Placeholder text="Scanning recent blocks for your pots…" tone="loading" />;
  }
  if (rows.length === 0) {
    return <Placeholder text="You haven't created any pots yet. Hit Create new pot →" />;
  }

  return (
    <ul className="divide-y divide-dark-carbon border border-dark-carbon rounded-lg overflow-hidden">
      {rows.map(({ id, data }) => {
        const idStr = id.toString().padStart(4, "0");
        const target = Number(formatUnits(data.target, 18));
        const raised = Number(formatUnits(data.raised, 18));
        const pct = target > 0 ? progress(raised, target) : 100;
        const ddlMs = Number(data.deadline) * 1000;
        const statusLabel = STATUS[data.status] ?? "Unknown";
        return (
          <li key={idStr} className="bg-midnight-void px-6 py-5">
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href={`/p/${idStr}`}
                className="text-[16px] text-polar-white font-bold hover:text-amber-glow"
              >
                POT.{idStr}
              </Link>
              <span className="text-[13px] text-mono uppercase tracking-[0.06em] text-ash-gray">
                {statusLabel}
              </span>
              <span className="text-[13px] text-mono text-ash-gray ml-auto">
                {data.deadline === 0n ? "OPEN-ENDED" : timeLeft(ddlMs)}
              </span>
            </div>
            <div className="mt-3 progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px] text-mono">
              <span className="text-polar-white">
                <span className="font-bold">${raised.toFixed(0)}</span>
                {target > 0 && <span className="text-ash-gray"> / ${target.toFixed(0)}</span>}
              </span>
              <span className="text-amber-glow">{pct}%</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Placeholder({ text, tone = "muted" }: { text: string; tone?: "muted" | "warn" | "loading" }) {
  const color =
    tone === "warn" ? "text-amber-glow" : tone === "loading" ? "text-ash-gray" : "text-ash-gray";
  return <div className={`surface-card text-center text-[14px] ${color} text-mono`}>{text}</div>;
}
