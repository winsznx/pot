import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Pot",
  description: "Top backers, voters, and pinners on Pot. Ranked by total on-chain actions.",
};

export default function LeaderboardPage() {
  return (
    <main className="app-shell">
      <Header />

      <section className="container-wide py-12 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <div className="eyebrow">Leaderboard · onchain</div>
            <h1 className="mt-3 display-lg">Protocol activity, ranked like a dashboard.</h1>
            <p className="mt-4 max-w-2xl body-lg">
              Contributions, matches, endorsements, votes, tags, pins, referrals, and check-ins are
              grouped by wallet from Pot contract events.
            </p>
          </div>
          <a
            href={`https://celoscan.io/address/${process.env.NEXT_PUBLIC_POT_ADDRESS ?? ""}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            View contract
          </a>
        </div>

        <div className="mt-10">
          <Leaderboard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
