"use client";

import { useState } from "react";

const PRESETS = [5, 10, 25, 50, 100];

export function ContributeBox({
  potId,
  ended,
}: {
  potId: string;
  ended: boolean;
}) {
  const [amount, setAmount] = useState<number | "">(10);
  const [anon, setAnon] = useState(false);
  const [name, setName] = useState("");

  const canContribute = !ended && typeof amount === "number" && amount > 0;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="surface-card space-y-5"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-neon-green" />
        <span className="text-[13px] uppercase text-ash-gray tracking-[0.06em] text-mono">
          CONTRIBUTE TO POT.{potId}
        </span>
      </div>

      <div>
        <span className="field-label">Amount (cUSD)</span>
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray text-mono">
            $
          </span>
          <input
            className="field-input pl-8 input-mono"
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            value={amount === "" ? "" : amount}
            onChange={(e) => {
              const v = e.target.value;
              setAmount(v === "" ? "" : Math.max(0, Number(v)));
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`px-4 py-2 rounded-lg text-[13px] text-mono border transition-colors ${
                amount === p
                  ? "border-amber-glow text-amber-glow"
                  : "border-dark-carbon text-ash-gray hover:text-polar-white"
              }`}
              onClick={() => setAmount(p)}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="field-label">Display name (optional)</span>
        <input
          className="field-input"
          placeholder="ife.eth"
          value={name}
          disabled={anon}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="mt-3 flex items-center gap-2 text-[13px] text-ash-gray text-mono cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            className="accent-amber-glow"
          />
          CONTRIBUTE ANONYMOUSLY
        </label>
      </div>

      <button
        type="submit"
        disabled={!canContribute}
        className="btn-manifesto w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {ended ? "POT HAS ENDED" : `CONTRIBUTE $${amount || 0} →`}
      </button>

      <p className="text-[13px] text-ash-gray leading-[1.43]">
        Sub-cent gas on Celo. Contributions are pull-refundable if the pot
        misses its target with refunds enabled.
      </p>
    </form>
  );
}
