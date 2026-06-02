import Link from "next/link";
import { StacksStatusCard } from "@/chain/StacksStatusCard";
import { CheckInButton } from "@/components/CheckInButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OwnPots, OwnPotsSummary } from "@/components/OwnPots";

export default function DashboardPage() {
  return (
    <main className="app-shell">
      <Header />

      <section className="container-wide py-12 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="eyebrow">Dashboard · onchain</div>
            <h1 className="mt-3 display-lg">Operate your fundraisers.</h1>
            <p className="mt-4 body-lg">
              Track live pots, monitor withdrawable balances, and keep creator actions tied to
              contract state instead of dashboard guesswork.
            </p>
          </div>
          <Link href="/create" className="btn-manifesto">
            Create new pot
          </Link>
        </div>

        <div className="mt-10">
          <OwnPotsSummary />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="heading-md">Pots you created</h2>
                <p className="body-sm mt-1">Indexed from PotCreated events and refreshed from live reads.</p>
              </div>
              <span className="badge">Live status</span>
            </div>
            <OwnPots />
          </section>

          <aside className="space-y-6">
            <StacksStatusCard />
            <CheckInButton />
            <div className="surface-card">
              <div className="eyebrow">Settlement rules</div>
              <div className="mt-4 space-y-4">
                <Rule title="Withdrawals" body="Available when the pot hits target, is open-ended, or reaches a non-refundable deadline." />
                <Rule title="Refunds" body="Available to contributors when a refund-enabled pot misses its target after deadline." />
                <Rule title="Source of truth" body="Amounts, deadlines, and statuses are read from the Pot contract." />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12 surface-raised flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="heading-md">Browse public activity</h2>
            <p className="body-sm mt-1">See active pots and top protocol actors.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/#examples" className="btn-secondary">
              Live pots
            </Link>
            <Link href="/leaderboard" className="btn-secondary">
              Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Rule({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-[var(--accent)] pl-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="body-sm mt-1">{body}</p>
    </div>
  );
}
