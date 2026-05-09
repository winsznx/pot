import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContributeBox } from "@/components/ContributeBox";
import { ShareButtons } from "@/components/ShareButtons";
import { findPot } from "@/lib/mock-pots";
import { formatUsd, progress, shortAddr, timeLeft } from "@/lib/format";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { potId } = await params;
  const pot = findPot(potId);
  if (!pot) return { title: "Pot not found" };
  const desc = pot.story.length > 160 ? `${pot.story.slice(0, 157)}…` : pot.story;
  return {
    title: `${pot.title} — Pot`,
    description: desc,
    openGraph: {
      type: "article",
      title: `${pot.title} — Pot`,
      description: desc,
      url: `/p/${potId}`,
      images: [
        {
          url: `/p/${potId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: pot.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pot.title} — Pot`,
      description: desc,
      images: [`/p/${potId}/opengraph-image`],
    },
  };
}

const FAKE_CONTRIBUTORS = [
  { addr: "0x9F3aD17B0c8e2C7d44AaA4ee2e1F8Fb33C9a7811", name: "ife.eth", amount: 50, when: "2h ago" },
  { addr: "0x4Bd8Fa1dA2eCf119F77E83a31f8e5Ee6d7Ee0b22", name: "coop.lagos", amount: 25, when: "3h ago" },
  { addr: "0x76FbCe22aA3aE2Bb9d6E6c4519E14eF4B2a30077", name: "anon", amount: 100, when: "5h ago" },
  { addr: "0xA12cE5b53d2F4123b88AAC5F1eDc41E2c0B9bC11", name: "zine.print", amount: 12, when: "6h ago" },
  { addr: "0x2c91A84d9EeF1A2BfC332dE5b88fB7a1cE6eBcD3", name: "estate.0xab", amount: 40, when: "9h ago" },
  { addr: "0xF89b3eA2dEc7F119F77cE3a31f8e5Ee6d7Ee0b88", name: "anon", amount: 5, when: "11h ago" },
  { addr: "0x012cE5b53d2F4123b88AAC5F1eDc41E2c0B9bC22", name: "k.maker", amount: 60, when: "14h ago" },
  { addr: "0x0d3ce5b53d2f4123b88aac5f1edc41e2c0b9bc33", name: "noemi", amount: 20, when: "18h ago" },
];

type Props = {
  params: Promise<{ potId: string }>;
};

export default async function PotDetailPage({ params }: Props) {
  const { potId } = await params;
  const pot = findPot(potId);
  if (!pot) notFound();

  const pct = pot.target > 0 ? progress(pot.raised, pot.target) : 100;
  const isFunded = pot.target > 0 && pot.raised >= pot.target;
  const ended = pot.deadline > 0 && pot.deadline <= Date.now();
  const noTarget = pot.target === 0;

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
              {isFunded ? (
                <span className="tag-status" style={{ background: "var(--color-amber-glow)", color: "var(--color-midnight-void)" }}>
                  TARGET REACHED
                </span>
              ) : ended ? (
                <span className="tag-status" style={{ background: "var(--color-dark-carbon)" }}>
                  ENDED
                </span>
              ) : (
                <span className="tag-status">
                  <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-polar-white" />
                  ACTIVE
                </span>
              )}
              <span className="text-[13px] text-ash-gray text-mono">
                CREATOR · {shortAddr(pot.creator)} ({pot.creatorName})
              </span>
            </div>

            <h1 className="text-[34px] md:text-[44px] font-bold leading-[1.03]">
              {pot.title}
            </h1>

            <p className="mt-6 text-[18px] text-polar-white leading-[1.31] whitespace-pre-line">
              {pot.story}
            </p>

            <div className="mt-10 surface-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
                  PROGRESS
                </span>
                <span className="text-[13px] text-ash-gray text-mono">
                  {pct}%{!noTarget ? " of target" : " (no target)"}
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
                <Stat label="RAISED" value={formatUsd(pot.raised)} />
                {!noTarget && (
                  <Stat label="TARGET" value={formatUsd(pot.target)} />
                )}
                <Stat label="CONTRIBUTORS" value={pot.contributors.toString()} />
                <Stat
                  label="DEADLINE"
                  value={pot.deadline === 0 ? "OPEN-ENDED" : timeLeft(pot.deadline)}
                />
                <Stat
                  label="REFUND POLICY"
                  value={pot.refundIfMissed ? "ENABLED" : "DISABLED"}
                />
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[23px] font-bold leading-[1.11]">
                  Contributor wall
                </h2>
                <span className="text-[13px] text-ash-gray text-mono">
                  {pot.contributors} TOTAL
                </span>
              </div>

              <ul className="border border-dark-carbon rounded-lg divide-y divide-dark-carbon">
                {FAKE_CONTRIBUTORS.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-4 bg-deep-space hover:bg-midnight-void transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        aria-hidden
                        className="block h-7 w-7 rounded-full bg-dark-carbon flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[14px] text-polar-white truncate">
                          {c.name === "anon" ? "Anonymous" : c.name}
                        </div>
                        <div className="text-[13px] text-ash-gray text-mono truncate">
                          {shortAddr(c.addr)} · {c.when}
                        </div>
                      </div>
                    </div>
                    <span className="text-[14px] text-polar-white text-mono font-bold flex-shrink-0">
                      ${c.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <ContributeBox potId={pot.id} ended={ended} />

            <div className="surface-card">
              <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-4 block">
                SHARE THIS POT
              </span>
              <ShareButtons potId={pot.id} title={pot.title} />
              <p className="mt-4 text-[13px] text-ash-gray leading-[1.43]">
                Every share appends your wallet as the referrer. Bring 5 in
                and earn an onchain badge.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
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
