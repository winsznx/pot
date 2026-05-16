import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PotCard } from "@/components/PotCard";
import { CheckInButton } from "@/components/CheckInButton";
import { WithdrawButton } from "@/components/WithdrawButton";
import { MOCK_POTS } from "@/lib/mock-pots";
import { formatUsd, progress, timeLeft } from "@/lib/format";

const SUMMARY = [
  { label: "POTS YOU CREATED", value: "3" },
  { label: "RAISED ALL-TIME", value: "$1,377" },
  { label: "CONTRIBUTORS REACHED", value: "86" },
  { label: "WITHDRAWABLE NOW", value: "$220" },
];

export default function DashboardPage() {
  const ownPots = MOCK_POTS.slice(0, 3);
  const browseMore = MOCK_POTS.slice(3);

  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />

      <section className="container-page py-16 md:py-20">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-3">
              DASHBOARD · 0x9F3a…7811
            </div>
            <h1 className="text-[44px] font-bold leading-[1.03]">
              Your pots, your money.
            </h1>
            <p className="mt-4 text-[16px] text-ash-gray max-w-xl leading-[1.5]">
              Withdraw raised cUSD, edit stories, and watch contributions land
              in real time. The contract is the source of truth.
            </p>
          </div>
          <Link href="/create" className="btn-manifesto">
            CREATE NEW POT →
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-dark-carbon border border-dark-carbon rounded-lg overflow-hidden">
          {SUMMARY.map((s) => (
            <div key={s.label} className="bg-deep-space p-6">
              <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-3">
                {s.label}
              </div>
              <div className="text-[34px] font-bold text-polar-white leading-[1.07]">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <CheckInButton />
        </div>

        <div className="mt-16">
          <h2 className="text-[23px] font-bold leading-[1.11] mb-6">
            Pots you created
          </h2>

          <div className="border border-dark-carbon rounded-lg overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1fr_140px_140px_120px_140px] px-6 py-4 bg-deep-space text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
              <span>POT</span>
              <span>RAISED</span>
              <span>TARGET</span>
              <span>BACKERS</span>
              <span className="text-right">ACTION</span>
            </div>

            <ul className="divide-y divide-dark-carbon">
              {ownPots.map((pot) => {
                const pct =
                  pot.target > 0 ? progress(pot.raised, pot.target) : 100;
                const isFunded =
                  pot.target > 0 && pot.raised >= pot.target;
                const ended =
                  pot.deadline > 0 && pot.deadline <= Date.now();
                const canWithdraw =
                  isFunded || ended || pot.target === 0;

                return (
                  <li
                    key={pot.id}
                    className="bg-midnight-void px-6 py-5 grid md:grid-cols-[1fr_140px_140px_120px_140px] gap-4 items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          aria-hidden
                          className={`block h-2 w-2 rounded-full ${
                            isFunded ? "bg-amber-glow" : "bg-neon-green"
                          }`}
                        />
                        <Link
                          href={`/p/${pot.id}`}
                          className="text-[16px] text-polar-white font-bold hover:text-amber-glow truncate"
                        >
                          {pot.title}
                        </Link>
                      </div>
                      <div className="text-[13px] text-ash-gray text-mono">
                        POT.{pot.id} · {pot.deadline === 0 ? "OPEN-ENDED" : timeLeft(pot.deadline)}
                      </div>
                      <div className="md:hidden mt-3 progress-track">
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
                    </div>

                    <span className="text-[14px] text-polar-white text-mono font-bold">
                      {formatUsd(pot.raised)}
                    </span>
                    <span className="text-[14px] text-ash-gray text-mono">
                      {pot.target === 0 ? "—" : formatUsd(pot.target)}
                    </span>
                    <span className="text-[14px] text-ash-gray text-mono">
                      {pot.contributors}
                    </span>

                    <div className="flex md:justify-end">
                      {canWithdraw ? (
                        <WithdrawButton potId={pot.id} />
                      ) : (
                        <span className="text-[13px] text-ash-gray text-mono">
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
            <h2 className="text-[23px] font-bold leading-[1.11]">
              Browse other pots
            </h2>
            <Link href="/" className="btn-ghost-secondary">
              SEE EVERYTHING →
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {browseMore.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
