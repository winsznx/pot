"use client";

import { useQuery } from "@tanstack/react-query";
import { useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

const LOOKBACK = 200_000n;

/**
 * Pull the recent `PotCreated` event log slice. Shared between dashboard and
 * the live strip so the underlying getLogs call only runs once per minute.
 */
export function usePotsLog() {
  const config = useConfig();
  const chainId = useChainId();

  return useQuery({
    queryKey: ["pot-created-log", chainId, POT_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId });
      if (!client) return [];
      const head = await client.getBlockNumber();
      const from = head > LOOKBACK ? head - LOOKBACK : 0n;
      const eventAbi = potAbi.find(
        (i) => i.type === "event" && i.name === "PotCreated",
      ) as Extract<(typeof potAbi)[number], { type: "event"; name: "PotCreated" }>;
      const logs = await client.getLogs({
        address: POT_ADDRESS,
        event: eventAbi,
        fromBlock: from,
        toBlock: head,
      });
      return logs;
    },
    enabled: isPotDeployed,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
