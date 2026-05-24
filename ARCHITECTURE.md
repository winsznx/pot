# Architecture

A wallet user lands on the Cloudflare Worker, the worker hands them a Next.js page, the page reads/writes the Pot contract directly through wagmi + viem. The worker has no database — every fact in the UI is reconstructed from contract state or recent event logs.

```
Browser ── HTML/JS ──> Cloudflare Worker (OpenNext-built Next.js 16)
                              │
                              ├── /api never used in this app — all data is on-chain
                              │
                              ▼
                       wagmi v3 + viem v2
                              │
                              ▼
        forno.celo.org  ←──── reads (getPot, nextPotId, getLogs)
                              │
                              ▼
                       Celo mainnet (42220)
                              │
                              ▼
            Pot.sol  ◀──────── PotBadges.sol (mint hooks)
              │
              └── cUSD (Mento) for value transfer
```

## Boundaries

- **Worker** never holds private keys. Everything that moves money is a user-signed transaction in the browser.
- **Contracts** are the source of truth. The badges contract calls Pot to verify backer/creator status before minting.
- **State** is reconstructed via `getLogs` lookback (200k blocks) for activity views; current data lives in `getPot(potId)` reads.

## Data flow per route

- `/` — reads `nextPotId`, then `getPot` for the latest N. No wallet needed.
- `/create` — single write: `createPot(target, deadline, refundIfMissed, metadataHash)`.
- `/p/[potId]` — server-renders the pot from RSC, contributions list via `Contributed` logs.
- `/dashboard` — wallet-gated; pulls `PotCreated` events filtered by `creator = address`.
- `/leaderboard` — aggregates all actor-bearing events across the Pot contract, ranked by total actions.

## Why Celo

cUSD on Celo gives a stablecoin denomination + gas paid in any ERC20 (MiniPay). The Mento broker handles cUSD ↔ CELO inside the protocol; we never touch it from the worker.

## Caching

OpenNext on Cloudflare gives us static asset caching for the build. Dynamic reads are not server-cached — every load reads fresh from forno via the browser. React-query handles client-side dedupe + 60s stale window.
