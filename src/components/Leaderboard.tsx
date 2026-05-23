"use client";

import { useMemo } from "react";
import { useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";
import { shortAddr } from "@/lib/format";
import { fetchActorAggregates, formatCusd, type ActorEvent } from "@/lib/leaderboard";

const ACTOR_EVENTS: ActorEvent[] = [
  { name: "PotCreated", actorArg: "creator" },
  { name: "Contributed", actorArg: "backer", valueArg: "amount" },
  { name: "Matched", actorArg: "matcher", valueArg: "amount" },
  { name: "Withdrawn", actorArg: "creator" },
  { name: "Refunded", actorArg: "backer" },
  { name: "Endorsed", actorArg: "endorser", valueArg: "cost" },
  { name: "Pinned", actorArg: "pinner", valueArg: "cost" },
  { name: "Tipped", actorArg: "tipper", valueArg: "amount" },
  { name: "Voted", actorArg: "voter" },
  { name: "Flagged", actorArg: "flagger" },
  { name: "Tagged", actorArg: "tagger" },
  { name: "CheckedIn", actorArg: "user" },
  { name: "Referred", actorArg: "user" },
];

const PAGE_SIZE = 25;

export function Leaderboard() {
  const chainId = useChainId();
  const config = useConfig();

  const query = useQuery({
    queryKey: ["pot-leaderboard", chainId, POT_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId });
      if (!client) return [];
      return fetchActorAggregates({
        client,
        address: POT_ADDRESS,
        abi: potAbi,
        events: ACTOR_EVENTS,
      });
    },
    enabled: isPotDeployed,
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const rows = query.data ?? [];
  const top = useMemo(() => rows.slice(0, PAGE_SIZE), [rows]);

  const totalActions = useMemo(
    () => rows.reduce((s, r) => s + r.actions, 0),
    [rows],
  );
  const totalContributed = useMemo(
    () => rows.reduce((s, r) => s + r.valueWei, 0n),
    [rows],
  );

  if (!isPotDeployed) {
    return (
      <div className="border border-dark-carbon rounded-2xl p-12 text-center">
        <p className="text-ash-gray text-mono">Pot contract not deployed on this network.</p>
      </div>
    );
  }

  return (
    <div>
      <StatStrip
        uau={rows.length}
        actions={totalActions}
        contributed={totalContributed}
        loading={query.isLoading}
      />

      <div className="mt-10 border border-dark-carbon rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_120px_160px_120px] items-center gap-4 px-6 py-4 border-b border-dark-carbon bg-deep-space">
          <div className="text-[11px] uppercase tracking-[0.08em] text-ash-gray text-mono">Rank</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ash-gray text-mono">Address</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ash-gray text-mono text-right">Actions</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ash-gray text-mono text-right">cUSD moved</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ash-gray text-mono text-right">Last block</div>
        </div>

        {query.isLoading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[14px] text-ash-gray text-mono">Indexing on-chain events…</p>
          </div>
        ) : top.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[14px] text-ash-gray text-mono">No on-chain activity yet.</p>
          </div>
        ) : (
          <ul>
            {top.map((row, idx) => (
              <li
                key={row.address}
                className="grid grid-cols-[60px_1fr_120px_160px_120px] items-center gap-4 px-6 py-4 border-b border-dark-carbon last:border-b-0 hover:bg-deep-space transition-colors"
              >
                <RankCell rank={idx + 1} />
                <AddressCell address={row.address} breakdown={row.eventBreakdown} />
                <div className="text-right font-bold text-[16px] tabular-nums">{row.actions}</div>
                <div className="text-right text-[14px] text-ash-gray text-mono tabular-nums">
                  {formatCusd(row.valueWei)}
                </div>
                <div className="text-right text-[13px] text-ash-gray text-mono tabular-nums">
                  #{row.lastBlock.toString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > PAGE_SIZE && (
        <p className="mt-4 text-[13px] text-ash-gray text-mono text-center">
          Showing top {PAGE_SIZE} of {rows.length} unique addresses · ranked by total on-chain actions
        </p>
      )}

      {query.dataUpdatedAt > 0 && (
        <p className="mt-2 text-[12px] text-ash-gray text-mono text-center">
          Indexed at {new Date(query.dataUpdatedAt).toLocaleTimeString()} · refreshes every 90s
        </p>
      )}
    </div>
  );
}

function StatStrip({ uau, actions, contributed, loading }: {
  uau: number;
  actions: number;
  contributed: bigint;
  loading: boolean;
}) {
  const stats = [
    { label: "UNIQUE ACTORS", value: loading ? "…" : uau.toString() },
    { label: "TOTAL ACTIONS", value: loading ? "…" : actions.toString() },
    { label: "cUSD MOVED", value: loading ? "…" : formatCusd(contributed) },
    { label: "NETWORK", value: "CELO" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-dark-carbon border border-dark-carbon rounded-2xl overflow-hidden">
      {stats.map((s) => (
        <div key={s.label} className="bg-midnight-void px-6 py-6">
          <div className="text-[11px] uppercase tracking-[0.08em] text-ash-gray text-mono">{s.label}</div>
          <div className="mt-2 text-[28px] md:text-[34px] font-bold leading-[1.07] tabular-nums">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function RankCell({ rank }: { rank: number }) {
  const medal = rank === 1 ? "text-amber-glow" : rank <= 3 ? "text-polar-white" : "text-ash-gray";
  return (
    <div className={`text-[15px] font-bold text-mono tabular-nums ${medal}`}>
      {rank.toString().padStart(2, "0")}
    </div>
  );
}

function AddressCell({ address, breakdown }: { address: string; breakdown: Record<string, number> }) {
  const top3 = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div className="min-w-0">
      <a
        href={`https://celoscan.io/address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="text-[15px] font-bold text-polar-white text-mono hover:text-amber-glow transition-colors block truncate"
      >
        {shortAddr(address)}
      </a>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        {top3.map(([name, count]) => (
          <span
            key={name}
            className="text-[10px] uppercase tracking-[0.04em] text-ash-gray text-mono px-1.5 py-0.5 border border-dark-carbon rounded"
          >
            {name} <span className="text-polar-white">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
