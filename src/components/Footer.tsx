import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="container-wide grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--brand)] text-[13px] font-bold text-[var(--text-inverse)]">
              P
            </span>
            <span className="font-semibold">Pot</span>
          </div>
          <p className="mt-4 body-sm">
            Global stablecoin fundraisers on Celo. No signup, no custody, no platform fee.
          </p>
        </div>

        <FooterGroup
          title="Product"
          links={[
            ["Create a pot", "/create"],
            ["Dashboard", "/dashboard"],
            ["Leaderboard", "/leaderboard"],
          ]}
        />
        <FooterGroup
          title="Protocol"
          links={[
            ["Verified contract", "https://celoscan.io"],
            ["Celo mainnet", "https://celo.org"],
            ["cUSD settlement", "https://docs.celo.org"],
          ]}
        />
        <div>
          <div className="label-caps">Status</div>
          <ul className="mt-3 space-y-2 body-sm">
            <li>Protocol live</li>
            <li>Wallet-native</li>
            <li>MiniPay-ready</li>
          </ul>
        </div>
      </div>

      <div className="container-wide flex flex-col justify-between gap-3 border-t border-[var(--border-subtle)] py-5 text-[13px] text-[var(--text-tertiary)] sm:flex-row">
        <span>May Proof of Ship · Season 2 · May 2026</span>
        <span className="text-mono">cUSD · Celo · zero platform fees</span>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div className="label-caps">{title}</div>
      <ul className="mt-3 space-y-2 body-sm">
        {links.map(([label, href]) => {
          const external = href.startsWith("http");
          return (
            <li key={label}>
              <Link
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="transition-colors hover:text-[var(--text-primary)]"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
