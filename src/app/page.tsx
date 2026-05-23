import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DotArt } from "@/components/DotArt";
import { LivePotsStrip } from "@/components/LivePotsStrip";

const STATS = [
  { label: "POTS LIVE", value: "412" },
  { label: "RAISED ALL-TIME", value: "$28.4k" },
  { label: "CONTRIBUTORS", value: "1,872" },
  { label: "PLATFORM FEE", value: "0%" },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "Create a pot",
    body:
      "Title, story, target, deadline. One transaction on Celo, sub-cent gas. Refundable to contributors if the target is missed (you choose).",
  },
  {
    n: "02",
    title: "Share the link",
    body:
      "Drop it in WhatsApp, X, Farcaster, anywhere. Pots open in MiniPay for your phone-first contributors and in any wallet for everyone else.",
  },
  {
    n: "03",
    title: "Withdraw or refund",
    body:
      "Hit your target or pass the deadline — withdraw cUSD straight to your wallet. Miss it? Contributors pull refunds themselves. Zero platform fees.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-midnight-void text-polar-white">
      <Header />

      <Hero />
      <Stats />
      <FeaturedPots />
      <HowItWorks />
      <WhyPot />
      <BeltCta />

      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative crosshatch-bg border-b border-dark-carbon">
      <div className="container-page pt-14 pb-16 md:pt-28 md:pb-32 grid lg:grid-cols-[1fr_auto] gap-12 md:gap-16 items-center">
        <div>
          <div className="flex items-center gap-3 mb-10 flex-wrap">
            <span className="tag-status">
              <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-polar-white" />
              LIVE ON CELO MAINNET
            </span>
            <span className="text-[13px] text-ash-gray text-mono">
              v0.1 · contracts verified
            </span>
          </div>

          <h1 className="text-[34px] sm:text-[44px] md:text-[56px] lg:text-[63px] font-bold leading-[1] md:leading-[0.95] tracking-[-0.011em] max-w-3xl text-polar-white">
            Stablecoin fundraisers
            <br className="hidden sm:block" />{" "}
            <span className="text-slate">that work everywhere.</span>
          </h1>

          <p className="mt-6 md:mt-8 max-w-2xl text-base md:text-[18px] text-polar-white leading-[1.4] md:leading-[1.31]">
            Like GoFundMe, but it works in 66 countries, settles in seconds,
            and has zero platform fees. Spin up a pot, drop the link in any
            chat, watch it fill in real time.
          </p>

          <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-3 md:gap-4">
            <Link href="/create" className="btn-manifesto">
              START A POT →
            </Link>
            <Link href="#examples" className="btn-ghost-secondary">
              VIEW LIVE POTS
            </Link>
            <span className="hidden sm:inline text-[13px] text-ash-gray text-mono ml-2">
              Sub-cent gas · cUSD · MiniPay-ready
            </span>
          </div>
        </div>

        <div className="hidden lg:flex justify-end items-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-10 rounded-full blur-[80px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(231,197,154,0.18), transparent 70%)",
              }}
            />
            <DotArt className="relative w-[360px] h-[360px]" />
            <div className="relative mt-6 flex items-center justify-between text-[13px] text-mono text-ash-gray">
              <span>POT.PROTOCOL</span>
              <span className="text-amber-glow">v0.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-deep-space border-b border-dark-carbon">
      <div className="container-page grid grid-cols-2 md:grid-cols-4 divide-x divide-dark-carbon">
        {STATS.map((stat) => (
          <div key={stat.label} className="py-8 md:py-10 px-4 md:px-6">
            <div className="text-[11px] md:text-[13px] uppercase text-ash-gray tracking-[0.08em] text-mono mb-2 md:mb-3">
              {stat.label}
            </div>
            <div className="text-[26px] md:text-[34px] font-bold text-polar-white leading-[1.07] tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedPots() {
  return (
    <section id="examples" className="section dot-grid-bg">
      <div className="container-page">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
                LIVE POTS · UPDATING NOW
              </span>
            </div>
            <h2 className="text-[28px] sm:text-[34px] md:text-[44px] font-bold leading-[1.05] md:leading-[1.03]">
              Real pots, real people,
              <br className="hidden md:block" /> right now.
            </h2>
          </div>
          <Link href="/dashboard" className="btn-ghost-secondary">
            BROWSE ALL →
          </Link>
        </div>

        <LivePotsStrip />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how"
      className="section bg-deep-space border-y border-dark-carbon relative"
    >
      <div className="container-page">
        <div className="grid md:grid-cols-[380px_1fr] gap-12">
          <div>
            <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-4">
              HOW IT WORKS
            </div>
            <h2 className="text-[34px] font-bold leading-[1.07]">
              Three steps,
              <br />
              one transaction each.
            </h2>
            <p className="mt-6 text-[16px] text-ash-gray leading-[1.5] max-w-sm">
              Built on Celo with cUSD. Audited contracts, sub-cent gas, no
              custody, no platform fees, no surprise rules.
            </p>

            <div className="mt-10 hidden md:block">
              <DotArt className="w-44 h-44 opacity-60" />
            </div>
          </div>

          <div className="space-y-4">
            {HOW_STEPS.map((step) => (
              <div
                key={step.n}
                className="surface-card border-dark-carbon hover:border-amber-glow/60 transition-colors flex flex-col md:flex-row gap-6"
              >
                <div className="md:w-20 flex md:flex-col items-center md:items-start gap-3">
                  <span className="text-mono text-[34px] font-bold text-amber-glow leading-none">
                    {step.n}
                  </span>
                  <span className="hidden md:block h-px w-10 bg-amber-glow/40" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[23px] font-bold text-polar-white mb-2 leading-[1.11]">
                    {step.title}
                  </h3>
                  <p className="text-[16px] text-ash-gray leading-[1.5]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyPot() {
  const points = [
    {
      n: "01",
      title: "Zero platform fees",
      body:
        "GoFundMe takes ~3% + payment processing. Pot takes 0%. Optional 1% protocol fee, hard-capped at 5%, paid only on successful withdrawal.",
    },
    {
      n: "02",
      title: "Pull-based refunds",
      body:
        "Miss your target with refunds enabled and contributors call refund() themselves. No griefing, no trapped funds, no manual customer support.",
    },
    {
      n: "03",
      title: "Permit-gasless contributions",
      body:
        "MiniPay users sign once. The relayer submits. They never need to hold CELO for gas. Open the link, tap contribute, done.",
    },
    {
      n: "04",
      title: "Verified, paused, recoverable",
      body:
        "Sourcify-verified, ReentrancyGuard everywhere, Pausable for emergencies. Even when paused, withdrawals and refunds always go through.",
    },
  ];

  return (
    <section className="section">
      <div className="container-page">
        <div className="max-w-3xl mb-14">
          <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono mb-4">
            WHY POT?
          </div>
          <h2 className="text-[44px] font-bold leading-[1.03]">
            The fundraiser primitive,
            <br />
            stripped to the bone.
          </h2>
          <p className="mt-6 text-[18px] text-polar-white leading-[1.31]">
            Pot is one Solidity contract on Celo, one Next.js frontend, one
            shareable link. No accounts, no KYC walls for $20 contributions, no
            &ldquo;we&rsquo;re holding your funds while we review.&rdquo;
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {points.map((p) => (
            <div
              key={p.title}
              className="surface-card hover:border-amber-glow/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-mono text-[13px] uppercase text-amber-glow tracking-[0.1em]">
                  {p.n}
                </span>
                <span aria-hidden className="block h-px flex-1 bg-dark-carbon ml-4" />
              </div>
              <h3 className="text-[23px] font-bold text-polar-white mb-3 leading-[1.11]">
                {p.title}
              </h3>
              <p className="text-[16px] text-ash-gray leading-[1.5]">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/create" className="btn-manifesto">
            START YOUR FIRST POT →
          </Link>
          <a
            href="https://celoscan.io"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost-secondary"
          >
            READ THE CONTRACT
          </a>
        </div>
      </div>
    </section>
  );
}

function BeltCta() {
  return (
    <section className="section dot-grid-bg">
      <div className="container-page">
        <div className="surface-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 md:p-10 border-amber-glow/40">
          <div>
            <div className="text-[13px] uppercase text-amber-glow tracking-[0.06em] text-mono mb-2">
              READY WHEN YOU ARE
            </div>
            <h3 className="text-[34px] font-bold leading-[1.07] max-w-2xl">
              Spin up a pot in under 60 seconds.
            </h3>
            <p className="mt-3 text-[16px] text-ash-gray max-w-xl">
              No account, no signup, no fees. Connect a wallet, write a story,
              share the link.
            </p>
          </div>
          <Link href="/create" className="btn-manifesto whitespace-nowrap">
            CREATE A POT →
          </Link>
        </div>
      </div>
    </section>
  );
}
