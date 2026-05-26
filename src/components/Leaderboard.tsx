"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "wagmi/actions";
import { celo } from "wagmi/chains";
import { useConfig } from "wagmi";
import { potAbi } from "@/lib/abi/pot";
import { fetchActorAggregates, formatCusd, type ActorEvent } from "@/lib/leaderboard";
import { shortAddr } from "@/lib/format";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";
import {
  fetchStacksAggregates,
  shortStxAddress,
  type StacksAggregateEntry,
} from "@/lib/stacksLeaderboard";

type ChainTab = "celo" | "stacks";

const STACKS_CONTRACTS = [
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.pot",
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.pot-pinboard",
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.pot-badges",
] as const;

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

type Row = {
  address: string;
  actions: number;
  valueLabel: string;
  lastBlock: string;
  eventBreakdown: Record<string, number>;
};

export function Leaderboard() {
  const config = useConfig();
  const [chain, setChain] = useState<ChainTab>("celo");

  const celoQuery = useQuery({
    queryKey: ["pot-leaderboard-celo", celo.id, POT_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: celo.id });
      if (!client) return [];
      return fetchActorAggregates({
        client,
        address: POT_ADDRESS,
        abi: potAbi,
        events: ACTOR_EVENTS,
      });
    },
    enabled: chain === "celo" && isPotDeployed,
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const stacksQuery = useQuery<StacksAggregateEntry[]>({
    queryKey: ["pot-leaderboard-stacks"],
    queryFn: () => fetchStacksAggregates({ contractIds: [...STACKS_CONTRACTS], perContractLimit: 50 }),
    enabled: chain === "stacks",
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const rows: Row[] = useMemo(() => {
    if (chain === "celo") {
      return (celoQuery.data ?? []).map((r) => ({
        address: r.address,
        actions: r.actions,
        valueLabel: `${formatCusd(r.valueWei)} cUSD`,
        lastBlock: `#${r.lastBlock.toString()}`,
        eventBreakdown: r.eventBreakdown,
      }));
    }
    return (stacksQuery.data ?? []).map((r) => ({
      address: r.address,
      actions: r.actions,
      valueLabel: `${(Number(r.microStxMoved) / 1_000_000).toFixed(4)} STX fees`,
      lastBlock: `#${r.lastBlock}`,
      eventBreakdown: r.eventBreakdown,
    }));
  }, [chain, celoQuery.data, stacksQuery.data]);

  const top = useMemo(() => rows.slice(0, PAGE_SIZE), [rows]);
  const totalActions = useMemo(() => rows.reduce((sum, row) => sum + row.actions, 0), [rows]);
  const totalContributed = useMemo(() => {
    if (chain === "celo") {
      return (celoQuery.data ?? []).reduce((s, r) => s + r.valueWei, 0n);
    }
    return (stacksQuery.data ?? []).reduce((s, r) => s + r.microStxMoved, 0n);
  }, [chain, celoQuery.data, stacksQuery.data]);
  const isLoading = chain === "celo" ? celoQuery.isLoading : stacksQuery.isLoading;
  const dataUpdatedAt = chain === "celo" ? celoQuery.dataUpdatedAt : stacksQuery.dataUpdatedAt;

  if (chain === "celo" && !isPotDeployed) {
    return (
      <div className="surface-card p-12 text-center">
        <p className="body-sm text-mono">Pot contract not deployed on this network.</p>
      </div>
    );
  }

  return (
    <div>
      <ChainToggle chain={chain} onChange={setChain} />

      <div className="mt-6">
        <StatStrip
          uau={rows.length}
          actions={totalActions}
          contributed={totalContributed}
          chain={chain}
          loading={isLoading}
        />
      </div>

      <div className="mt-8 table-shell">
        <div className="hidden grid-cols-[70px_1fr_120px_160px_130px] items-center gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-6 py-4 md:grid">
          <div className="label-caps">Rank</div>
          <div className="label-caps">Address</div>
          <div className="label-caps justify-end text-right">Actions</div>
          <div className="label-caps justify-end text-right">
            {chain === "celo" ? "cUSD moved" : "STX fees"}
          </div>
          <div className="label-caps justify-end text-right">Last block</div>
        </div>

        {isLoading ? (
          <div className="space-y-3 px-6 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 skeleton" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="body-sm text-mono">No on-chain activity yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {top.map((row, idx) => (
              <li
                key={row.address}
                className="grid gap-3 px-5 py-5 transition-colors hover:bg-[var(--bg-subtle)] md:grid-cols-[70px_1fr_120px_160px_130px] md:items-center md:gap-4 md:px-6"
              >
                <RankCell rank={idx + 1} />
                <AddressCell
                  address={row.address}
                  breakdown={row.eventBreakdown}
                  chain={chain}
                />
                <Metric label="Actions" value={row.actions.toString()} strong />
                <Metric label={chain === "celo" ? "cUSD" : "STX fees"} value={row.valueLabel} />
                <Metric label="Last block" value={row.lastBlock} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-2 text-[13px] text-[var(--text-tertiary)] sm:flex-row sm:items-center">
        <p className="text-mono">
          {rows.length > PAGE_SIZE
            ? `Showing top ${PAGE_SIZE} of ${rows.length} unique addresses on ${chain}`
            : `Ranked by total on-chain actions on ${chain}`}
        </p>
        {dataUpdatedAt > 0 && (
          <p className="text-mono">
            Indexed at {new Date(dataUpdatedAt).toLocaleTimeString()} · refreshes every 90s
          </p>
        )}
      </div>
    </div>
  );
}

function ChainToggle({ chain, onChange }: { chain: ChainTab; onChange: (c: ChainTab) => void }) {
  const tabs: { id: ChainTab; label: string; hint: string }[] = [
    { id: "celo", label: "Celo", hint: "cUSD events" },
    { id: "stacks", label: "Stacks", hint: "Hiro mainnet" },
  ];
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1"
      role="tablist"
      aria-label="Chain selector"
    >
      {tabs.map((t) => {
        const active = t.id === chain;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`rounded-full px-4 py-1.5 text-mono text-[12px] transition-colors ${
              active
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
            <span className="ml-2 text-[10px] opacity-60">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatStrip({
  uau,
  actions,
  contributed,
  chain,
  loading,
}: {
  uau: number;
  actions: number;
  contributed: bigint;
  chain: ChainTab;
  loading: boolean;
}) {
  const valueLabel = chain === "celo" ? "cUSD moved" : "STX in fees";
  const valueValue = loading
    ? "..."
    : chain === "celo"
      ? formatCusd(contributed)
      : (Number(contributed) / 1_000_000).toFixed(4);
  const networkLabel = chain === "celo" ? "Celo" : "Stacks";
  const stats = [
    { label: "Unique actors", value: loading ? "..." : uau.toString() },
    { label: "Total actions", value: loading ? "..." : actions.toString() },
    { label: valueLabel, value: valueValue },
    { label: "Network", value: networkLabel },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-[var(--bg-surface)] px-5 py-6">
          <div className="label-caps">{stat.label}</div>
          <div className="mt-2 text-2xl font-semibold leading-none tabular-nums md:text-3xl">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankCell({ rank }: { rank: number }) {
  const color =
    rank === 1
      ? "text-[var(--accent)]"
      : rank <= 3
        ? "text-[var(--text-primary)]"
        : "text-[var(--text-tertiary)]";
  return <div className={`text-mono text-sm font-semibold tabular-nums ${color}`}>{rank.toString().padStart(2, "0")}</div>;
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 md:block md:text-right">
      <span className="label-caps md:hidden">{label}</span>
      <span
        className={`${strong ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"} text-mono tabular-nums`}
      >
        {value}
      </span>
    </div>
  );
}

function AddressCell({
  address,
  breakdown,
  chain,
}: {
  address: string;
  breakdown: Record<string, number>;
  chain: ChainTab;
}) {
  const top3 = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const href =
    chain === "celo"
      ? `https://celoscan.io/address/${address}`
      : `https://explorer.hiro.so/address/${address}?chain=mainnet`;
  const label = chain === "celo" ? shortAddr(address) : shortStxAddress(address);

  return (
    <div className="min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block truncate text-mono font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
      >
        {label}
      </a>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {top3.map(([name, count]) => (
          <span
            key={name}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-tertiary)] text-mono"
          >
            {name} <span className="text-[var(--text-primary)]">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
