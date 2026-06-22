"use client";

import { useMemo, useState } from "react";
import { hexToString, stringToHex } from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  POT_STX_DEPLOYER,
  POT_STX_PINBOARD_CONTRACT,
  POT_STX_TAG_FN,
} from "@/chain/stacksContracts";

const LOOKBACK_BLOCKS = 200_000n;
const MAX_TAG_BYTES = 31;

/**
 * Tag a pot with a short label (bytes32). Indexes the contract's Tagged events
 * for this pot so callers see what's already been pinned. The tag function
 * itself is free + open — anyone can tag any pot — but rep-weighting happens
 * off-chain by inspecting the tagger's wallet history.
 */
export function TagPanel({ potId }: { potId: string }) {
  const { kind } = useChainKind();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const [draft, setDraft] = useState("");
  const stx = useStacksWrite();

  const idBn = useMemo(() => {
    try {
      return BigInt(potId.replace(/^0+/, "") || "0");
    } catch {
      return null;
    }
  }, [potId]);

  const tagsQuery = useQuery({
    queryKey: ["pot-tags", chainId, potId],
    queryFn: async (): Promise<string[]> => {
      if (idBn === null) return [];
      const client = getPublicClient(config, { chainId });
      if (!client) return [];
      const head = await client.getBlockNumber();
      const from = head > LOOKBACK_BLOCKS ? head - LOOKBACK_BLOCKS : 0n;
      const eventAbi = potAbi.find(
        (i) => i.type === "event" && i.name === "Tagged",
      ) as Extract<(typeof potAbi)[number], { type: "event"; name: "Tagged" }>;
      const logs = await client.getLogs({
        address: POT_ADDRESS,
        event: eventAbi,
        args: { potId: idBn },
        fromBlock: from,
        toBlock: head,
      });
      const counts = new Map<string, number>();
      for (const l of logs) {
        const raw = l.args.tag;
        if (typeof raw !== "string") continue;
        try {
          const text = hexToString(raw as `0x${string}`, { size: 32 }).replace(/\0+$/, "");
          if (!text) continue;
          counts.set(text, (counts.get(text) ?? 0) + 1);
        } catch {
          /* ignore unparseable tag bytes */
        }
      }
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([t, n]) => `${t}${n > 1 ? ` ·${n}` : ""}`);
    },
    enabled: kind === "celo" && isPotDeployed && idBn !== null,
    refetchInterval: 60_000,
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (idBn === null) return;
    const t = draft.trim().toLowerCase();
    if (!t) return;
    const bytes = new TextEncoder().encode(t);
    if (bytes.length > MAX_TAG_BYTES) return;

    if (kind === "celo") {
      if (!isConnected) return;
      writeContract({
        abi: potAbi,
        address: POT_ADDRESS,
        functionName: "tagPot",
        args: [idBn, stringToHex(t, { size: 32 })],
      });
      setDraft("");
      return;
    }

    let s = readStacksSession();
    if (!s.isConnected) {
      s = await connectStacks();
      if (!s.isConnected) return;
    }
    const txid = await stx.call({
      contractAddress: POT_STX_DEPLOYER,
      contractName: POT_STX_PINBOARD_CONTRACT,
      functionName: POT_STX_TAG_FN,
      args: [
        { type: "uint", value: idBn },
        { type: "buff", value: stringToHex(t, { size: 32 }) },
      ],
    });
    if (txid) setDraft("");
  }

  const disabledCelo = !isConnected || !isPotDeployed || idBn === null || mining || isPending;
  const disabledStacks = idBn === null || stx.pending;
  const disabled = kind === "celo" ? disabledCelo : disabledStacks;
  const tags = tagsQuery.data ?? [];

  return (
    <div className="surface-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          TAGS
        </span>
        <span className="text-[12px] text-ash-gray text-mono">
          {tagsQuery.isLoading ? "loading…" : `${tags.length} unique`}
        </span>
      </div>

      {tags.length === 0 ? (
        <p className="text-[13px] text-ash-gray">No tags yet. Pin the first one.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full bg-deep-space border border-dark-carbon text-[12px] text-polar-white text-mono"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={31}
          placeholder="tuition · medical · zine…"
          className="field-input text-[13px] flex-1"
        />
        <button
          type="submit"
          disabled={disabled || draft.trim().length === 0}
          className="btn-ghost-secondary text-[13px] border border-dark-carbon disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mining ? "MINING" : isPending ? "SIGN" : "TAG"}
        </button>
      </form>
      {hash && (
        <button
          type="button"
          onClick={() => reset()}
          className="text-[12px] text-ash-gray underline"
        >
          reset
        </button>
      )}
      {stx.error && (
        <p className="text-[12px]" style={{ color: "var(--danger)" }}>
          {stx.error.split("\n")[0]}
        </p>
      )}
    </div>
  );
}
