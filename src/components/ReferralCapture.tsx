"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, isPotDeployed } from "@/lib/wagmi";

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO = "0x0000000000000000000000000000000000000000" as const;

/**
 * Reads ?ref=<wallet> from the share URL and writes setReferrer for the
 * connected wallet exactly once — when the visitor has no referrer set yet
 * and the ref param is a real address that isn't their own. Without this the
 * ShareButtons attribution chain (referralCount/referrerOf) stayed empty
 * forever, breaking the on-chain referrer badge promise.
 *
 * Mounted on the pot detail page so any first visit from a shared link
 * captures the attribution before the user even contributes.
 */
export function ReferralCapture() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const params = useSearchParams();
  const refParam = params?.get("ref");
  const refAddr =
    refParam && ADDR_RE.test(refParam)
      ? (refParam.toLowerCase() as `0x${string}`)
      : null;

  const { data: existingRef } = useReadContract({
    abi: potAbi,
    address: POT_ADDRESS,
    functionName: "referrerOf",
    args: address ? [address] : undefined,
    query: {
      enabled:
        kind === "celo" && isConnected && isPotDeployed && !!address && !!refAddr,
    },
  });

  const { writeContract } = useWriteContract();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (kind !== "celo") return;
    if (!isConnected || !address || !isPotDeployed) return;
    if (!refAddr) return;
    if (existingRef === undefined) return; // still loading
    if (existingRef && existingRef !== ZERO) return; // already attributed
    if (refAddr === address.toLowerCase()) return; // can't refer self

    firedRef.current = true;
    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "setReferrer",
      args: [refAddr],
    });
  }, [kind, isConnected, address, refAddr, existingRef, writeContract]);

  return null;
}
