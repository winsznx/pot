import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUnits } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContributeBox } from "@/components/ContributeBox";
import { EndorsePotButton } from "@/components/EndorsePotButton";
import { MatchContributionPanel } from "@/components/MatchContributionPanel";
import { RefundButton } from "@/components/RefundButton";
import { ShareButtons } from "@/components/ShareButtons";
import { TipCreatorButton } from "@/components/TipCreatorButton";
import { TagPanel } from "@/components/TagPanel";
import { fetchContributors, fetchPot, type OnchainPot } from "@/lib/chain";
import { progress, shortAddr, timeLeft } from "@/lib/format";
import { isPotDeployed } from "@/lib/wagmi";

type Props = {
  params: Promise<{ potId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { potId } = await params;
  const pot = await fetchPot(potId);
  if (!pot) return { title: `Pot ${potId}` };
  const title = `Pot.${pot.id} — Pot`;
  const desc = `On-chain pot. Raised ${formatCusd(pot.raised)} of ${
    pot.target === 0n ? "open-ended" : formatCusd(pot.target)
  }.`;
  return {
    title,
    description: desc,
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: `/p/${pot.id}`,
      images: [
        {
          url: `/p/${pot.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [`/p/${pot.id}/opengraph-image`],
    },
  };
}

export default async function PotDetailPage({ params }: Props) {
  const { potId } = await params;

  if (!isPotDeployed) {
    return <NotLive potId={potId} />;
  }

  const pot = await fetchPot(potId);
  if (!pot) notFound();

  const contributors = await fetchContributors(potId);
  const ended = pot.deadline !== 0n && pot.deadline * 1000n <= BigInt(Date.now());
  const target = Number(formatUnits(pot.target, 18));
  const raised = Number(formatUnits(pot.raised, 18));
  const pct = target > 0 ? progress(raised, target) : 100;
  const isFunded = target > 0 && raised >= target;
  const noTarget = target === 0;
  const ddlMs = Number(pot.deadline) * 1000;

  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />

      <section className="container-page py-12 md:py-16">
        <Link
          href="/"
          className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono hover:text-polar-white"
        >
          ← BACK TO POTS
        </Link>

        <div className="mt-8 grid lg:grid-cols-[1fr_400px] gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
                POT.{pot.id}
              </span>
              <StatusBadge status={pot.status} funded={isFunded} ended={ended} />
              <span className="text-[13px] text-ash-gray text-mono">
                CREATOR · {shortAddr(pot.creator)}
              </span>
            </div>

            <h1 className="text-[34px] md:text-[44px] font-bold leading-[1.03]">Pot.{pot.id}</h1>

            <p className="mt-6 text-[15px] text-ash-gray leading-[1.6] max-w-2xl">
              Metadata hash{" "}
              <span className="font-mono text-polar-white">{pot.metadataHash.slice(0, 12)}…</span>{" "}
              — rich title + story surface once the off-chain metadata service is wired up.
            </p>

            <div className="mt-10 surface-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
                  PROGRESS
                </span>
                <span className="text-[13px] text-ash-gray text-mono">
                  {pct}%{noTarget ? " (no target)" : " of target"}
                </span>
              </div>
              <div className="progress-track mb-5">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: isFunded
                      ? "var(--color-amber-glow)"
                      : "var(--color-neon-green)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Stat label="RAISED" value={formatCusd(pot.raised)} />
                {!noTarget && <Stat label="TARGET" value={formatCusd(pot.target)} />}
                <Stat label="CONTRIBUTORS" value={contributors.length.toString()} />
                <Stat
                  label="DEADLINE"
                  value={pot.deadline === 0n ? "OPEN-ENDED" : timeLeft(ddlMs)}
                />
                <Stat
                  label="REFUND POLICY"
                  value={pot.refundIfMissed ? "ENABLED" : "DISABLED"}
                />
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[23px] font-bold leading-[1.11]">Contributor wall</h2>
                <span className="text-[13px] text-ash-gray text-mono">
                  {contributors.length} TOTAL
                </span>
              </div>

              {contributors.length === 0 ? (
                <div className="surface-card text-center text-[14px] text-ash-gray text-mono">
                  No contributions yet. Be the first.
                </div>
              ) : (
                <ul className="border border-dark-carbon rounded-lg divide-y divide-dark-carbon">
                  {contributors.map((addr) => (
                    <li
                      key={addr}
                      className="flex items-center justify-between p-4 bg-deep-space hover:bg-midnight-void transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          aria-hidden
                          className="block h-7 w-7 rounded-full bg-dark-carbon shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[14px] text-polar-white text-mono truncate">
                            {shortAddr(addr)}
                          </div>
                          <div className="text-[13px] text-ash-gray text-mono truncate">
                            onchain backer
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://celoscan.io/address/${addr}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] text-ash-gray hover:text-polar-white text-mono"
                      >
                        celoscan ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <ContributeBox potId={pot.id} ended={ended} />

            <RefundButton
              potId={pot.id}
              eligible={
                ended && pot.refundIfMissed && pot.target > 0n && pot.raised < pot.target
              }
            />

            <EndorsePotButton potId={pot.id} ended={ended} />

            <MatchContributionPanel potId={pot.id} ended={ended} />

            <TipCreatorButton potId={pot.id} />

            <TagPanel potId={pot.id} />

            <div className="surface-card">
              <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-4 block">
                SHARE THIS POT
              </span>
              <ShareButtons potId={pot.id} title={`Pot.${pot.id}`} />
              <p className="mt-4 text-[13px] text-ash-gray leading-[1.43]">
                Every share appends your wallet as the referrer. Bring 5 in and earn an onchain
                badge.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function StatusBadge({
  status,
  funded,
  ended,
}: {
  status: OnchainPot["status"];
  funded: boolean;
  ended: boolean;
}) {
  if (status === "Withdrawn") {
    return (
      <span
        className="tag-status"
        style={{ background: "var(--color-amber-glow)", color: "var(--color-midnight-void)" }}
      >
        WITHDRAWN
      </span>
    );
  }
  if (status === "Refunded") {
    return (
      <span className="tag-status" style={{ background: "var(--color-dark-carbon)" }}>
        REFUNDED
      </span>
    );
  }
  if (status === "Cancelled") {
    return (
      <span className="tag-status" style={{ background: "var(--color-dark-carbon)" }}>
        CANCELLED
      </span>
    );
  }
  if (funded) {
    return (
      <span
        className="tag-status"
        style={{ background: "var(--color-amber-glow)", color: "var(--color-midnight-void)" }}
      >
        TARGET REACHED
      </span>
    );
  }
  if (ended) {
    return (
      <span className="tag-status" style={{ background: "var(--color-dark-carbon)" }}>
        ENDED
      </span>
    );
  }
  return (
    <span className="tag-status">
      <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-polar-white" />
      ACTIVE
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-2">
        {label}
      </div>
      <div className="text-[18px] font-bold text-polar-white">{value}</div>
    </div>
  );
}

function NotLive({ potId }: { potId: string }) {
  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />
      <section className="container-page py-24 text-center">
        <h1 className="text-[34px] font-bold mb-4">Pot.{potId}</h1>
        <p className="text-[16px] text-ash-gray max-w-md mx-auto leading-[1.5]">
          The Pot contract isn&apos;t deployed yet. Once it&apos;s live, this page will pull the
          pot directly from the chain.
        </p>
        <Link href="/" className="btn-ghost-secondary mt-8 inline-flex">
          ← Back to landing
        </Link>
      </section>
      <Footer />
    </main>
  );
}

function formatCusd(wei: bigint): string {
  const n = Number(formatUnits(wei, 18));
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n.toFixed(n < 10 ? 2 : 0)}`;
}
