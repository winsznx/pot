/**
 * Server-side viem readers for the Pot contract. Used by RSC routes
 * (the [potId] detail page, OG image, sitemap) where wagmi hooks aren't
 * available. Returns `null` for any unreadable id so callers can gracefully
 * render a "not found" or "contract offline" state without throwing.
 */
import { createPublicClient, http } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { potAbi } from "@/lib/abi/pot";
import { ACTIVE_CHAIN_ID, POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

// Build the public client lazily per chain so we never resolve a union of
// `celo | celoAlfajores` in a single createPublicClient call (the two chains
// have divergent transaction shapes that TS can't reconcile in a union).
let _client: ReturnType<typeof buildClient> | null = null;
function buildClient() {
  return ACTIVE_CHAIN_ID === celo.id
    ? createPublicClient({ chain: celo, transport: http() })
    : createPublicClient({ chain: celoAlfajores, transport: http() });
}
function client() {
  if (!_client) _client = buildClient();
  return _client;
}

export type PotStatus = "Active" | "Withdrawn" | "Refunded" | "Cancelled";

export type OnchainPot = {
  id: string;
  creator: `0x${string}`;
  deadline: bigint;
  refundIfMissed: boolean;
  status: PotStatus;
  target: bigint;
  raised: bigint;
  metadataHash: `0x${string}`;
};

const STATUS_LABEL: readonly PotStatus[] = ["Active", "Withdrawn", "Refunded", "Cancelled"];

function normaliseId(raw: string): bigint | null {
  try {
    const trimmed = raw.replace(/^0+/, "") || "0";
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

export async function fetchPot(id: string): Promise<OnchainPot | null> {
  if (!isPotDeployed) return null;
  const bigId = normaliseId(id);
  if (bigId === null) return null;
  try {
    const data = (await client().readContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "getPot",
      args: [bigId],
    })) as {
      creator: `0x${string}`;
      deadline: bigint;
      refundIfMissed: boolean;
      status: number;
      target: bigint;
      raised: bigint;
      metadataHash: `0x${string}`;
    };
    return {
      id: id.padStart(4, "0"),
      creator: data.creator,
      deadline: data.deadline,
      refundIfMissed: data.refundIfMissed,
      status: STATUS_LABEL[data.status] ?? "Active",
      target: data.target,
      raised: data.raised,
      metadataHash: data.metadataHash,
    };
  } catch {
    return null;
  }
}

export async function fetchContributors(id: string): Promise<`0x${string}`[]> {
  if (!isPotDeployed) return [];
  const bigId = normaliseId(id);
  if (bigId === null) return [];
  try {
    const list = (await client().readContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "getContributors",
      args: [bigId],
    })) as `0x${string}`[];
    return list;
  } catch {
    return [];
  }
}

export async function fetchContribution(
  id: string,
  who: `0x${string}`,
): Promise<bigint> {
  if (!isPotDeployed) return 0n;
  const bigId = normaliseId(id);
  if (bigId === null) return 0n;
  try {
    return (await client().readContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "getContribution",
      args: [bigId, who],
    })) as bigint;
  } catch {
    return 0n;
  }
}

export async function fetchNextPotId(): Promise<bigint> {
  if (!isPotDeployed) return 0n;
  try {
    return (await client().readContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "nextPotId",
    })) as bigint;
  } catch {
    return 0n;
  }
}
