import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-midnight-void/85 backdrop-blur-md border-b border-dark-carbon">
      <div className="container-page flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="block h-3 w-3 rounded-full bg-amber-glow" />
          <span className="text-[18px] font-bold tracking-tight text-polar-white">Pot</span>
          <span className="hidden sm:inline text-[13px] text-ash-gray ml-2 input-mono">
            /onchain.fundraisers
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <Link href="/#examples" className="nav-link">
            EXAMPLES
          </Link>
          <Link href="/#how" className="nav-link">
            HOW IT WORKS
          </Link>
          <Link href="/dashboard" className="nav-link">
            DASHBOARD
          </Link>
          <Link href="/leaderboard" className="nav-link">
            LEADERBOARD
            <span className="tag-new">NEW</span>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/create" className="hidden sm:inline-flex btn-ghost-secondary text-[13px]">
            START A POT
          </Link>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
