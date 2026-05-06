import Link from "next/link";
import type { MockPot } from "@/lib/mock-pots";
import { formatUsd, progress, timeLeft } from "@/lib/format";

export function PotCard({ pot }: { pot: MockPot }) {
  const pct = pot.target > 0 ? progress(pot.raised, pot.target) : 100;
  const isFunded = pot.target > 0 && pot.raised >= pot.target;
  const noTarget = pot.target === 0;

  return (
    <Link
      href={`/p/${pot.id}`}
      className="group surface-card block hover:border-ash-gray transition-colors"
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          aria-hidden
          className={`block h-2 w-2 rounded-full ${
            isFunded ? "bg-amber-glow" : "bg-neon-green"
          }`}
        />
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          POT.{pot.id}
        </span>
        <span className="ml-auto text-[13px] text-ash-gray text-mono">
          {pot.deadline === 0 ? "OPEN-ENDED" : timeLeft(pot.deadline)}
        </span>
      </div>

      <h3 className="text-[21px] font-bold text-polar-white leading-[1.22] mb-3 group-hover:text-amber-glow transition-colors">
        {pot.title}
      </h3>

      <p className="text-[14px] text-ash-gray leading-[1.43] mb-6 line-clamp-2">
        {pot.story}
      </p>

      <div className="space-y-3">
        <div className="progress-track">
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

        <div className="flex items-center justify-between text-[14px]">
          <span className="text-polar-white text-mono">
            <span className="font-bold">{formatUsd(pot.raised)}</span>
            {!noTarget && (
              <span className="text-ash-gray">
                {" "}
                / {formatUsd(pot.target)}
              </span>
            )}
          </span>
          <span className="text-ash-gray text-mono">
            {pot.contributors} contributors
          </span>
        </div>
      </div>
    </Link>
  );
}
