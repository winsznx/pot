import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Pot",
  description: "Top backers, voters, and pinners on Pot. Ranked by total on-chain actions.",
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />

      <section className="container-page py-16 md:py-20">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div>
            <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-3">
              LEADERBOARD · onchain
            </div>
            <h1 className="text-[44px] md:text-[63px] font-bold leading-[0.95] tracking-[-0.011em] max-w-3xl">
              Top backers,
              <br />
              <span className="text-slate">top everything.</span>
            </h1>
            <p className="mt-6 text-[16px] text-ash-gray max-w-xl leading-[1.5]">
              Ranked by total on-chain actions on the Pot contract — contributions,
              endorsements, votes, tags, pins, check-ins, and referrals. The contract is
              the source of truth.
            </p>
          </div>
          <a
            href={`https://celoscan.io/address/${process.env.NEXT_PUBLIC_POT_ADDRESS ?? ""}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost-secondary"
          >
            VIEW CONTRACT →
          </a>
        </div>

        <Leaderboard />
      </section>

      <Footer />
    </main>
  );
}
