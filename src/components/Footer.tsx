import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-dark-carbon mt-20">
      <div className="container-page py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span aria-hidden className="block h-3 w-3 rounded-full bg-amber-glow" />
            <span className="text-[18px] font-bold text-polar-white">Pot</span>
          </div>
          <p className="text-[14px] text-ash-gray max-w-sm leading-[1.43]">
            Stablecoin fundraisers that work everywhere. Onchain pots powered
            by cUSD on Celo. No platform fees, settles in seconds, links open
            on any phone.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em]">
            Product
          </div>
          <ul className="space-y-2 text-[14px] text-polar-white">
            <li>
              <Link href="/create" className="hover:text-ash-gray">
                Create a pot
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-ash-gray">
                Your dashboard
              </Link>
            </li>
            <li>
              <Link href="/#examples" className="hover:text-ash-gray">
                Live examples
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-[13px] uppercase text-ash-gray tracking-[0.06em]">
            Build
          </div>
          <ul className="space-y-2 text-[14px] text-polar-white">
            <li>Pot.sol on Celo mainnet</li>
            <li>Verified on Sourcify</li>
            <li>Open source · MIT</li>
          </ul>
        </div>
      </div>

      <div className="container-page pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] text-ash-gray">
        <span className="text-mono">
          May Proof of Ship · Season 2 · Edition: May 2026
        </span>
        <span className="text-mono">cUSD · Celo · MiniPay-ready</span>
      </div>
    </footer>
  );
}
