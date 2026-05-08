"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseUnits, parseEventLogs } from "viem";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: txHash, isPending: isSigning, reset } = useWriteContract();
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [target, setTarget] = useState<number | "">("");
  const [durationDays, setDurationDays] = useState<number>(7);
  const [refundIfMissed, setRefundIfMissed] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const deadlineLabel = useMemo(() => {
    if (durationDays === 0) return "No deadline";
    const d = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [durationDays]);

  const titleCount = title.length;
  const storyCount = story.length;
  const formValid = metadataLooksValid({ title, story }) && (target === "" || (typeof target === "number" && target >= 0));
  const canSubmit = formValid && isConnected && isPotDeployed && !isSigning && !isMining;
  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN_ID;

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

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
    const nonce = BigInt(Math.floor(Date.now() / 1000));
    const metadataHash = hashPotMetadata({ title, story, creator: address, nonce });

    writeContract({
      abi: potAbi,
      address: POT_ADDRESS,
      functionName: "createPot",
      args: [targetWei, deadline, refundIfMissed, metadataHash],
    });
  }

  const submitLabel = isSigning
    ? "WAITING FOR WALLET…"
    : isMining
      ? "MINING…"
      : "CREATE POT →";

  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />

      <section className="container-page py-16 md:py-24">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div>
            <Link
              href="/"
              className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono hover:text-polar-white"
            >
              ← BACK TO LANDING
            </Link>

            <h1 className="mt-6 text-[44px] md:text-[63px] font-bold leading-[0.95] tracking-[-0.011em]">
              Start a pot.
            </h1>
            <p className="mt-5 text-[18px] text-ash-gray max-w-2xl leading-[1.31]">
              One transaction on Celo, sub-cent gas. The funds, target, and deadline are
              immutable once you sign — the story stays editable.
            </p>

            {!isConnected && (
              <ConnectBanner />
            )}
            {wrongChain && <WrongChainBanner expected={ACTIVE_CHAIN_ID} actual={chainId} />}
            {!isPotDeployed && <NotDeployedBanner />}
            {submitError && <ErrorBanner message={submitError} />}

            <form className="mt-12 space-y-10" onSubmit={handleSubmit}>
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
                label="TARGET (cUSD)"
                hint="Leave blank for no target — pot stays open until you withdraw."
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray text-mono">
                      $
                    </span>
                    <input
                      className="field-input pl-8 input-mono"
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
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={`px-4 py-2 rounded-lg text-[13px] text-mono border transition-colors ${
                          target === amount
                            ? "border-amber-glow text-amber-glow"
                            : "border-dark-carbon text-ash-gray hover:text-polar-white"
                        }`}
                        onClick={() => setTarget(amount)}
                      >
                        ${amount}
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
                      className={`px-4 py-2 rounded-lg text-[13px] text-mono border transition-colors ${
                        durationDays === d.days
                          ? "border-amber-glow text-amber-glow"
                          : "border-dark-carbon text-ash-gray hover:text-polar-white"
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
                    body="If the target isn't reached by the deadline, contributors can pull their cUSD back. You get nothing."
                  />
                  <RadioCard
                    selected={!refundIfMissed}
                    onClick={() => setRefundIfMissed(false)}
                    title="KEEP WHAT WE RAISED"
                    body="Withdraw whatever was raised when the deadline hits, even if the target wasn't reached. Be honest in your story."
                  />
                </div>
              </Field>

              <div className="flex items-center gap-4 pt-4">
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
                <span className="text-[13px] text-ash-gray text-mono">
                  {isConnected ? "Sub-cent gas on Celo." : "Connect a wallet first."}
                </span>
              </div>
            </form>
          </div>

          <aside className="lg:sticky lg:top-24 self-start">
            <div className="surface-card">
              <div className="flex items-center gap-2 mb-5">
                <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
                <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
                  PREVIEW
                </span>
              </div>

              <h3 className="text-[21px] font-bold text-polar-white leading-[1.22] mb-3">
                {title.trim() || "Your title appears here"}
              </h3>
              <p className="text-[14px] text-ash-gray leading-[1.43] mb-6 line-clamp-4">
                {story.trim() ||
                  "Your story appears here. Aim for 2–4 sentences — the why, the who, and what happens if it's funded."}
              </p>

              <div className="space-y-3">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: "0%" }} />
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-polar-white text-mono">
                    <span className="font-bold">$0</span>
                    {target !== "" && target !== 0 && (
                      <span className="text-ash-gray"> / ${target}</span>
                    )}
                  </span>
                  <span className="text-ash-gray text-mono">0 contributors</span>
                </div>
              </div>

              <div className="divider my-6" />

              <ul className="space-y-3 text-[13px] text-ash-gray text-mono">
                <li className="flex justify-between">
                  <span>DEADLINE</span>
                  <span className="text-polar-white">
                    {durationDays === 0 ? "—" : deadlineLabel}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>REFUND POLICY</span>
                  <span className="text-polar-white">
                    {refundIfMissed ? "ENABLED" : "DISABLED"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>PROTOCOL FEE</span>
                  <span className="text-polar-white">1% on withdraw</span>
                </li>
                <li className="flex justify-between">
                  <span>NETWORK</span>
                  <span className="text-polar-white">
                    {ACTIVE_CHAIN_ID === 42220 ? "Celo · cUSD" : "Alfajores · cUSD"}
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
              hintTone === "warn" ? "text-amber-glow" : "text-ash-gray"
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
          ? "border-amber-glow bg-deep-space"
          : "border-dark-carbon bg-deep-space hover:border-ash-gray"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden
          className={`block h-3 w-3 rounded-full border ${
            selected
              ? "border-amber-glow bg-amber-glow"
              : "border-ash-gray bg-transparent"
          }`}
        />
        <span className="text-[13px] uppercase text-mono tracking-[0.06em] text-polar-white">
          {title}
        </span>
      </div>
      <p className="text-[14px] text-ash-gray leading-[1.43]">{body}</p>
    </button>
  );
}

function ConnectBanner() {
  return (
    <div className="mt-8 surface-card border-amber-glow/40 flex items-start gap-4">
      <span aria-hidden className="block h-2 w-2 rounded-full bg-amber-glow mt-2" />
      <div>
        <div className="text-[14px] font-bold text-polar-white">Connect a wallet to continue</div>
        <p className="text-[13px] text-ash-gray mt-1">
          You can fill the form first, then connect when you&apos;re ready to sign.
        </p>
      </div>
    </div>
  );
}

function WrongChainBanner({ expected, actual }: { expected: number; actual?: number }) {
  return (
    <div className="mt-4 surface-card border-amber-glow/60">
      <div className="text-[14px] font-bold text-amber-glow">Wrong network</div>
      <p className="text-[13px] text-ash-gray mt-1">
        Switch your wallet to chain {expected} (currently {actual ?? "unknown"}). Pot only signs on
        the configured Celo network.
      </p>
    </div>
  );
}

function NotDeployedBanner() {
  return (
    <div className="mt-4 surface-card border-dark-carbon">
      <div className="text-[14px] font-bold text-polar-white">Pot contract not deployed yet</div>
      <p className="text-[13px] text-ash-gray mt-1 text-mono">
        Set <code>NEXT_PUBLIC_POT_ADDRESS</code> at build time. Until then the form is preview-only.
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 surface-card border-amber-glow/60">
      <div className="text-[14px] font-bold text-amber-glow">Could not submit</div>
      <p className="text-[13px] text-ash-gray mt-1">{message}</p>
    </div>
  );
}
