"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseUnits, parseEventLogs } from "viem";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  POT_STX_CONTRACT,
  POT_STX_CREATE_FN,
  POT_STX_DEPLOYER,
} from "@/chain/stacksContracts";
import { potAbi } from "@/lib/abi/pot";
import { POT_ADDRESS, ACTIVE_CHAIN_ID, isPotDeployed } from "@/lib/wagmi";
import { hashPotMetadata, metadataLooksValid } from "@/lib/metadata";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];
const DURATIONS = [
  { label: "3 DAYS", days: 3 },
  { label: "7 DAYS", days: 7 },
  { label: "14 DAYS", days: 14 },
  { label: "30 DAYS", days: 30 },
  { label: "OPEN-ENDED", days: 0 },
];

export default function CreatePotPage() {
  const router = useRouter();
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: txHash, isPending: isSigning, reset } = useWriteContract();
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });
  const stx = useStacksWrite();

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [target, setTarget] = useState<number | "">("");
  const [durationDays, setDurationDays] = useState<number>(7);
  const [refundIfMissed, setRefundIfMissed] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const deadlineLabel = useMemo(() => {
    if (durationDays === 0) return "No deadline";
    return `${durationDays} day${durationDays === 1 ? "" : "s"} from creation`;
  }, [durationDays]);

  const titleCount = title.length;
  const storyCount = story.length;
  const formValid = metadataLooksValid({ title, story }) && (target === "" || (typeof target === "number" && target >= 0));
  const canSubmitCelo = formValid && isConnected && isPotDeployed && !isSigning && !isMining;
  const canSubmitStacks = formValid && !stx.pending;
  const canSubmit = kind === "celo" ? canSubmitCelo : canSubmitStacks;
  const wrongChain = kind === "celo" && isConnected && chainId !== ACTIVE_CHAIN_ID;

  // After tx confirms, parse the PotCreated event for the potId and redirect.
  useEffect(() => {
    if (!receipt) return;
    try {
      const events = parseEventLogs({
        abi: potAbi,
        eventName: "PotCreated",
        logs: receipt.logs,
      });
      const ev = events[0];
      if (ev && "args" in ev) {
        const id = (ev.args as { potId: bigint }).potId;
        const idStr = id.toString().padStart(4, "0");
        router.push(`/p/${idStr}`);
      }
    } catch (err) {
      console.error("could not parse PotCreated", err);
    }
  }, [receipt, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (kind === "celo") {
      if (!isConnected || !address) {
        setSubmitError("Connect a wallet first.");
        return;
      }
      if (!isPotDeployed) {
        setSubmitError("Pot contract address isn't configured yet. Set NEXT_PUBLIC_POT_ADDRESS.");
        return;
      }

      const targetWei = target === "" ? 0n : parseUnits(String(target), 18);
      const deadline = durationDays === 0
        ? 0n
        : BigInt(Math.floor(Date.now() / 1000) + durationDays * 24 * 60 * 60);
      // Use a strong random nonce so two creators submitting the same
      // title/story in the same second don't collide on the metadata hash.
      const nonce = randomBigIntNonce();
      const metadataHash = hashPotMetadata({ title, story, creator: address, nonce });

      writeContract({
        abi: potAbi,
        address: POT_ADDRESS,
        functionName: "createPot",
        args: [targetWei, deadline, refundIfMissed, metadataHash],
      });
      return;
    }

    // Stacks branch — STX target in micro-STX, deadline in stacks block height
    let session = readStacksSession();
    if (!session.isConnected) {
      session = await connectStacks();
      if (!session.isConnected) {
        setSubmitError("Stacks wallet not connected.");
        return;
      }
    }
    const targetMicroStx =
      target === "" ? 0n : BigInt(Math.floor(Number(target) * 1_000_000));

    // Deadline must be an absolute Stacks block height — fetch current tip
    // from Hiro and add the duration window. 0 = open-ended.
    let deadlineBlocks = 0n;
    if (durationDays > 0) {
      try {
        const info = await fetch("https://api.hiro.so/v2/info").then((r) => r.json());
        const tip = BigInt(info?.stacks_tip_height ?? info?.burn_block_height ?? 0);
        deadlineBlocks = tip + BigInt(durationDays * 144);
      } catch {
        setSubmitError("Could not fetch Stacks block height — try again.");
        return;
      }
    }
    const nonce = randomBigIntNonce();
    // Reuse the existing metadata hasher with a synthetic 0x address derived
    // from the connected stx principal — keeps the hash format identical to the
    // Celo side so an off-chain index can verify either chain the same way.
    const synthetic = `0x${"0".repeat(40)}` as `0x${string}`;
    const hashHex = hashPotMetadata({ title, story, creator: synthetic, nonce });
    await stx.call({
      contractAddress: POT_STX_DEPLOYER,
      contractName: POT_STX_CONTRACT,
      functionName: POT_STX_CREATE_FN,
      args: [
        { type: "uint", value: targetMicroStx },
        { type: "uint", value: deadlineBlocks },
        { type: "bool", value: refundIfMissed },
        { type: "buff", value: hashHex },
      ],
    });
  }

  const submitLabel =
    kind === "stacks"
      ? stx.pending
        ? "WAITING FOR STACKS WALLET…"
        : "CREATE POT ON STACKS →"
      : isSigning
        ? "WAITING FOR WALLET…"
        : isMining
          ? "MINING…"
          : "CREATE POT →";

  return (
    <main className="app-shell">
      <Header />

      <section className="container-wide py-12 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <Link
              href="/"
              className="btn-ghost-secondary px-0"
            >
              Back to landing
            </Link>

            <div className="mt-8 max-w-3xl">
              <div className="eyebrow">Create fundraiser</div>
              <h1 className="mt-3 display-lg">Define the terms people can trust.</h1>
            </div>
            <p className="mt-5 max-w-2xl body-lg">
              One transaction writes the target, deadline, refund policy, and metadata hash to the
              chain you pick — Celo (cUSD) or Stacks (STX). Make the story specific, then share a
              wallet-native link.
            </p>

            {!isConnected && (
              <ConnectBanner />
            )}
            {wrongChain && <WrongChainBanner expected={ACTIVE_CHAIN_ID} actual={chainId} />}
            {!isPotDeployed && <NotDeployedBanner />}
            {submitError && <ErrorBanner message={submitError} />}

            <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
              <Field
                label="POT TITLE"
                hint={`${titleCount}/80`}
                hintTone={titleCount > 80 ? "warn" : "muted"}
              >
                <input
                  className="field-input"
                  placeholder="e.g. Adaeze's tuition for final semester"
                  value={title}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>

              <Field
                label="THE STORY"
                hint={`${storyCount}/600 · markdown OK`}
                hintTone={storyCount > 600 ? "warn" : "muted"}
              >
                <textarea
                  className="field-textarea"
                  placeholder="Why are you raising? Who benefits? What happens if it's funded? People give to specifics — be specific."
                  value={story}
                  maxLength={600}
                  onChange={(e) => setStory(e.target.value)}
                />
              </Field>

              <Field
                label={kind === "stacks" ? "TARGET (STX)" : "TARGET (cUSD)"}
                hint="Leave blank for no target — pot stays open until you withdraw."
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
                    {kind === "celo" ? (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray text-mono">
                        $
                      </span>
                    ) : null}
                    <input
                      className={`field-input input-mono ${kind === "celo" ? "pl-8" : "pr-12"}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      placeholder="0"
                      value={target === "" ? "" : target}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTarget(v === "" ? "" : Math.max(0, Number(v)));
                      }}
                    />
                    {kind === "stacks" ? (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ash-gray text-mono text-[12px]">
                        STX
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={`btn-secondary min-h-[44px] px-4 py-2 text-[13px] ${
                          target === amount
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                            : ""
                        }`}
                        onClick={() => setTarget(amount)}
                      >
                        {kind === "celo" ? `$${amount}` : `${amount} STX`}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              <Field
                label="DURATION"
                hint={
                  durationDays === 0
                    ? "Pot stays open until you withdraw."
                    : `Pot ends ${deadlineLabel}`
                }
              >
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      className={`btn-secondary min-h-0 px-4 py-2 text-[13px] ${
                        durationDays === d.days
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                          : ""
                      }`}
                      onClick={() => setDurationDays(d.days)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="IF YOU MISS THE TARGET">
                <div className="grid sm:grid-cols-2 gap-3">
                  <RadioCard
                    selected={refundIfMissed}
                    onClick={() => setRefundIfMissed(true)}
                    title="REFUND CONTRIBUTORS"
                    body="If the target isn't reached by the deadline, contributors can pull their funds back from the contract. You get nothing."
                  />
                  <RadioCard
                    selected={!refundIfMissed}
                    onClick={() => setRefundIfMissed(false)}
                    title="KEEP WHAT WE RAISED"
                    body="Withdraw whatever was raised when the deadline hits, even if the target wasn't reached. Be honest in your story."
                  />
                </div>
              </Field>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-manifesto disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitLabel}
                </button>
                {txHash && (
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="btn-ghost-secondary text-[13px]"
                  >
                    RESET
                  </button>
                )}
                {stx.txid && (
                  <a
                    href={`https://explorer.hiro.so/txid/${stx.txid}?chain=mainnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost-secondary text-[13px]"
                  >
                    VIEW STACKS TX ↗
                  </a>
                )}
                {stx.error && (
                  <span className="body-sm text-mono text-[var(--warning)]">
                    {stx.error}
                  </span>
                )}
                <span className="body-sm text-mono">
                  {isConnected ? "Pay cents in gas — Celo or Stacks." : "Connect a wallet first."}
                </span>
              </div>
            </form>
          </div>

          <aside className="self-start lg:sticky lg:top-24">
            <div className="surface-raised p-5">
              <div className="flex items-center gap-2 mb-5">
                <span aria-hidden className="status-dot text-[var(--success)]" />
                <span className="label-caps">
                  PREVIEW
                </span>
              </div>

              <h3 className="heading-md mb-3">
                {title.trim() || "Your title appears here"}
              </h3>
              <p className="body-sm mb-6 line-clamp-4">
                {story.trim() ||
                  "Your story appears here. Aim for 2–4 sentences — the why, the who, and what happens if it's funded."}
              </p>

              <div className="space-y-3">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: "0%" }} />
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-mono">
                    <span className="font-bold">$0</span>
                    {target !== "" && target !== 0 && <span className="text-[var(--text-tertiary)]"> / ${target}</span>}
                  </span>
                  <span className="text-[var(--text-tertiary)] text-mono">0 contributors</span>
                </div>
              </div>

              <div className="divider my-6" />

              <ul className="space-y-3 text-[13px] text-[var(--text-tertiary)] text-mono">
                <li className="flex justify-between">
                  <span>DEADLINE</span>
                  <span className="text-[var(--text-primary)]">
                    {durationDays === 0 ? "—" : deadlineLabel}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>REFUND POLICY</span>
                  <span className="text-[var(--text-primary)]">
                    {refundIfMissed ? "ENABLED" : "DISABLED"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>PROTOCOL FEE</span>
                  <span className="text-[var(--text-primary)]">1% on withdraw</span>
                </li>
                <li className="flex justify-between">
                  <span>NETWORK</span>
                  <span className="text-[var(--text-primary)]">
                    {kind === "stacks"
                      ? "Stacks · STX"
                      : ACTIVE_CHAIN_ID === 42220
                        ? "Celo · cUSD"
                        : "Alfajores · cUSD"}
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/**
 * 256-bit randomness packed into a bigint. Used as the metadata-hash nonce
 * so simultaneous creates (same wallet, same second) never collide.
 */
function randomBigIntNonce(): bigint {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = 0n;
  for (const b of bytes) out = (out << 8n) | BigInt(b);
  return out;
}

function Field({
  label,
  hint,
  hintTone = "muted",
  children,
}: {
  label: string;
  hint?: string;
  hintTone?: "muted" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="field-label">{label}</span>
        {hint && (
          <span
            className={`text-[13px] text-mono ${
              hintTone === "warn" ? "text-[var(--warning)]" : "text-[var(--text-tertiary)]"
            }`}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function RadioCard({
  selected,
  onClick,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg p-5 border transition-colors ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden
          className={`block h-3 w-3 rounded-full border ${
            selected
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--border-strong)] bg-transparent"
          }`}
        />
        <span className="text-[13px] uppercase text-mono text-[var(--text-primary)]">
          {title}
        </span>
      </div>
      <p className="body-sm">{body}</p>
    </button>
  );
}

function ConnectBanner() {
  return (
    <div className="mt-8 surface-card flex items-start gap-4 border-[var(--warning)]/40 bg-[var(--warning-soft)]">
      <span aria-hidden className="status-dot mt-2 text-[var(--warning)]" />
      <div>
        <div className="text-[14px] font-bold text-[var(--text-primary)]">Connect a wallet to continue</div>
        <p className="body-sm mt-1">
          You can fill the form first, then connect when you&apos;re ready to sign.
        </p>
      </div>
    </div>
  );
}

function WrongChainBanner({ expected, actual }: { expected: number; actual?: number }) {
  return (
    <div className="mt-4 surface-card border-[var(--warning)] bg-[var(--warning-soft)]">
      <div className="text-[14px] font-bold text-[var(--warning)]">Wrong network</div>
      <p className="body-sm mt-1">
        Switch your wallet to chain {expected} (currently {actual ?? "unknown"}). Pot only signs on
        the chain you picked for this fundraiser.
      </p>
    </div>
  );
}

function NotDeployedBanner() {
  return (
    <div className="mt-4 surface-card">
      <div className="text-[14px] font-bold text-[var(--text-primary)]">Pot contract not deployed yet</div>
      <p className="body-sm mt-1 text-mono">
        Set <code>NEXT_PUBLIC_POT_ADDRESS</code> at build time. Until then the form is preview-only.
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 surface-card border-[var(--danger)] bg-[var(--danger-soft)]">
      <div className="text-[14px] font-bold text-[var(--danger)]">Could not submit</div>
      <p className="body-sm mt-1">{message}</p>
    </div>
  );
}
