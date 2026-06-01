import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Pot",
  description: "Top backers, voters, and pinners on Pot — ranked by total on-chain actions on Celo and Stacks.",
};

export default function LeaderboardPage() {
  return (
    <main className="app-shell">
      <Header />

      <section className="container-wide py-12 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <div className="eyebrow">Leaderboard · onchain</div>
            <h1 className="mt-3 display-lg">Protocol activity, ranked across Celo and Stacks.</h1>
            <p className="mt-4 max-w-2xl body-lg">
              Contributions, matches, endorsements, votes, tags, pins, referrals, and check-ins are
              grouped by wallet — switch the chain toggle to see Celo (cUSD) or Stacks (STX) activity.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Leaderboard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
