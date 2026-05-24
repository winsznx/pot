# pot

> Stablecoin fundraisers that work everywhere. Like GoFundMe, but it works in 66 countries, settles in seconds, and has zero platform fees.

Onchain pots powered by cUSD on Celo. Spin up a pot, drop the link in any chat, watch it fill in real time.

- Live worker: <https://pot.timjosh507.workers.dev>
- Network: Celo mainnet (chain id 42220)
- Pot contract: [`0xEf2DF00E73F37AE499Dd7Eb35E33b776CFBa1502`](https://celoscan.io/address/0xEf2DF00E73F37AE499Dd7Eb35E33b776CFBa1502)
- Badges contract: [`0xeFdF9073adD638b17EC5259C8Ace640c077b3146`](https://celoscan.io/address/0xeFdF9073adD638b17EC5259C8Ace640c077b3146)

## Stack

- Next.js 16 (App Router) on Cloudflare Workers via OpenNext
- React 19 + TypeScript
- Tailwind CSS v4
- wagmi v3 + viem v2 for chain reads/writes
- Foundry for the Solidity contracts

## Develop

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Build for production

```bash
pnpm build
```

## Deploy to Cloudflare Workers

```bash
pnpm exec opennextjs-cloudflare build
pnpm exec opennextjs-cloudflare deploy
```

The build needs `NEXT_PUBLIC_POT_ADDRESS`, `NEXT_PUBLIC_POT_BADGES_ADDRESS`, `NEXT_PUBLIC_CUSD_ADDRESS`, and `NEXT_PUBLIC_CHAIN_ID` inlined at build time.

## Contracts

Solidity sources live in [`contracts/`](./contracts), tests in [`test/`](./test), deploy scripts in [`script/`](./script).

```bash
forge build
forge test
```

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing + live pots strip |
| `/create` | Open a new pot |
| `/p/[potId]` | Public pot detail (contribute, endorse, tip, share) |
| `/dashboard` | Your pots + check-in streak |
| `/leaderboard` | All-time on-chain activity, refreshed every 90s |

## License

MIT — see [LICENSE](./LICENSE).
