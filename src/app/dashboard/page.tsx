import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckInButton } from "@/components/CheckInButton";
import { OwnPots } from "@/components/OwnPots";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />

      <section className="container-page py-16 md:py-20">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-3">
              DASHBOARD · onchain
            </div>
            <h1 className="text-[44px] font-bold leading-[1.03]">Your pots, your money.</h1>
            <p className="mt-4 text-[16px] text-ash-gray max-w-xl leading-[1.5]">
              Withdraw raised cUSD, edit stories, and watch contributions land in real time. The
              contract is the source of truth.
            </p>
          </div>
          <Link href="/create" className="btn-manifesto">
            CREATE NEW POT →
          </Link>
        </div>

        <div className="mt-12">
          <CheckInButton />
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
            <h2 className="text-[23px] font-bold leading-[1.11]">Pots you created</h2>
            <span className="text-[13px] text-ash-gray text-mono">
              indexed from PotCreated · live status
            </span>
          </div>
          <OwnPots />
        </div>

        <div className="mt-16">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
            <h2 className="text-[23px] font-bold leading-[1.11]">Browse other pots</h2>
            <Link href="/" className="btn-ghost-secondary">
              SEE EVERYTHING →
            </Link>
          </div>
          <p className="text-[14px] text-ash-gray text-mono">
            The full live list of active pots lives on the landing page → /
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
