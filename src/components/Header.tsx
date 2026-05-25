import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { NetworkSelector } from "./NetworkSelector";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#trust", label: "Trust" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  return (
    <header className="sticky top-3 z-40 px-3">
      <div className="container-wide nav-frame flex min-h-[72px] items-center justify-between gap-5 px-5 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Pot home">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand)] text-[13px] font-bold text-[var(--text-inverse)] shadow-sm"
          >
            P
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-semibold text-[var(--text-primary)]">Pot</span>
            <span className="mt-1 hidden max-w-[190px] truncate text-[12px] text-[var(--text-tertiary)] sm:block">
              Onchain stablecoin fundraising
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-2 rounded-full bg-[var(--bg-subtle)] p-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <NetworkSelector />
          <Link href="/create" className="hidden sm:inline-flex btn-ghost-secondary">
            Start a pot
          </Link>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
