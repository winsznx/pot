import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LivePotsStrip } from "@/components/LivePotsStrip";

const STATS = [
  ["Platform fee", "0%"],
  ["Settlement", "Seconds"],
  ["Signup", "None"],
  ["Networks", "Celo · Stacks"],
];

const HOW = [
  ["Create", "Pick a chain, target, deadline, and refund policy. Pot writes the fundraiser terms straight to a Solidity or Clarity contract."],
  ["Share", "Send one link through WhatsApp, X, Farcaster, MiniPay, or any compatible wallet browser."],
  ["Settle", "Withdraw cUSD (Celo) or STX (Stacks) when funded, or let contributors pull refunds if the rules allow it."],
];

const BENEFITS = [
  ["Cross-chain by design", "The same pot ships on Celo and Stacks — backers contribute on whichever network they already hold value on."],
  ["Wallet-native", "Creators and contributors use wallets they already trust. No platform account, no email, no KYC."],
  ["Transparent escrow", "Raised, target, deadline, refunds, and withdrawals are readable from the contract on either chain."],
  ["No platform fee", "Pot does not take a cut of donations. Contributors see exactly what they are moving."],
];

const FAQ = [
  ["Does Pot custody funds?", "No. Funds sit in the Pot smart contract — Solidity on Celo, Clarity on Stacks — until the fundraiser is withdrawable or refundable."],
  ["What currency do contributors use?", "Pot supports cUSD on Celo and STX on Stacks. Creators pick a chain at launch and contributors pay in that chain's native asset."],
  ["What happens if a target is missed?", "Creators choose the refund policy at creation. Refund-enabled pots let contributors pull funds back after the deadline."],
  ["Do contributors need an account?", "No. They only need a compatible wallet — MiniPay, MetaMask, or any EVM wallet on Celo; Leather or Xverse on Stacks."],
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <Header />
      <Hero />
      <TrustBar />
      <LiveSection />
      <HowItWorks />
      <Benefits />
      <Security />
      <FAQSection />
      <CTA />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 trust-grid opacity-70" aria-hidden />
      <div className="container-wide relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="badge badge-success">
              <span className="status-dot" aria-hidden />
              Live on Celo + Stacks mainnet
            </span>
            <span className="badge">Verified contracts</span>
            <span className="badge">cUSD · STX</span>
          </div>
          <h1 className="display-xl max-w-4xl">
            GoFundMe, but onchain — on Celo and Stacks.
          </h1>
          <p className="mt-6 max-w-2xl body-lg">
            Pot lets anyone launch a trustworthy fundraiser, collect cUSD or STX directly from
            backers, and settle funds out of an onchain escrow with zero platform fees.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/create" className="btn-manifesto">
              Start a pot
            </Link>
            <Link href="#examples" className="btn-secondary">
              View live activity
            </Link>
            <span className="body-sm sm:ml-2">No signup · cents in gas · wallet-native</span>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="surface-raised overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="label-caps">Pot preview</span>
          <span className="badge badge-success">Active</span>
        </div>
      </div>
      <div className="p-5">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="label-caps">Medical fund · Lagos</div>
              <h2 className="mt-3 heading-md">Community surgery support</h2>
            </div>
            <span className="badge">POT.0421</span>
          </div>
          <div className="mt-6 progress-track">
            <div className="progress-fill" style={{ width: "74%" }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <PreviewStat label="Raised" value="$7,420" />
            <PreviewStat label="Target" value="$10,000" />
            <PreviewStat label="Backers" value="184" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <div className="label-caps">Next action</div>
            <div className="mt-2 font-semibold">Contribute cUSD · STX</div>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <div className="label-caps">Policy</div>
            <div className="mt-2 font-semibold">Refundable</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="container-wide grid grid-cols-2 divide-x divide-y divide-[var(--border-subtle)] md:grid-cols-4 md:divide-y-0">
        {STATS.map(([label, value]) => (
          <div key={label} className="px-5 py-7">
            <div className="label-caps">{label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveSection() {
  return (
    <section id="examples" className="section">
      <div className="container-wide">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="eyebrow">Live activity</div>
            <h2 className="mt-3 display-lg">Fundraisers with onchain state.</h2>
            <p className="mt-4 max-w-2xl body-lg">
              Each pot is a direct contract read: raised amount, target progress, deadline, and
              settlement status.
            </p>
          </div>
          <Link href="/dashboard" className="btn-secondary">
            Open dashboard
          </Link>
        </div>
        <LivePotsStrip />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="section bg-[var(--bg-surface)]">
      <div className="container-wide grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="eyebrow">How it works</div>
          <h2 className="mt-3 display-lg">A fundraiser flow with contract-grade clarity.</h2>
          <p className="mt-4 body-lg">
            Pot keeps the human flow simple while making the money movement explicit.
          </p>
        </div>
        <div className="grid gap-4">
          {HOW.map(([title, body], index) => (
            <div key={title} className="surface-card grid gap-4 sm:grid-cols-[4rem_1fr]">
              <span className="text-mono text-2xl font-semibold text-[var(--accent)]">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div>
                <h3 className="heading-md">{title}</h3>
                <p className="mt-2 body-sm">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="section">
      <div className="container-wide">
        <div className="max-w-3xl">
          <div className="eyebrow">Why Pot</div>
          <h2 className="mt-3 display-lg">Built for money moments that need trust fast.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {BENEFITS.map(([title, body]) => (
            <div key={title} className="surface-card">
              <h3 className="heading-md">{title}</h3>
              <p className="mt-3 body-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section id="trust" className="section">
      <div className="container-wide panel-dark rounded-2xl p-6 md:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="eyebrow">Trust architecture</div>
            <h2 className="mt-3 display-lg">Users can verify what matters before moving money.</h2>
          </div>
          <div className="grid gap-3">
            {[
              ["Contract visibility", "Campaign terms are stored in the Pot contract and linked from every trust surface."],
              ["Network clarity", "The active chain — Celo (cUSD) or Stacks (STX) — is shown at contribution, creation, and settlement moments."],
              ["Transaction feedback", "Wallet signing, mining, success, and reset states are explicit across money actions."],
              ["Refund path", "Refund-enabled campaigns expose pull refunds when the contract says contributors are eligible."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-[var(--border-inverse)] p-4">
                <h3 className="font-semibold text-[var(--text-inverse)]">{title}</h3>
                <p className="mt-1 text-sm text-[rgba(248,250,246,0.72)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="section bg-[var(--bg-surface)]">
      <div className="container-page">
        <div className="eyebrow">FAQ</div>
        <div className="mt-6 divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-[var(--text-tertiary)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 body-sm">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="section-tight">
      <div className="container-wide surface-raised flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center md:p-8">
        <div>
          <div className="eyebrow">Ready when you are</div>
          <h2 className="mt-2 heading-lg">Launch a pot in under a minute.</h2>
        </div>
        <Link href="/create" className="btn-manifesto">
          Create a pot
        </Link>
      </div>
    </section>
  );
}
