# Contributing

Thanks for digging in. A few ground rules so changes ship cleanly.

## Before you start

- Run `pnpm install` once. The workspace expects pnpm v9+.
- Foundry needed if you touch `contracts/`. Install via <https://book.getfoundry.sh/getting-started/installation>.
- Copy `.env.example` to a local `.env` if you need to point at mainnet — never commit it.

## Branch + commit hygiene

- Branch off `main`. Keep branches narrow — one concern per branch.
- Commits should describe the user-visible change, not the file path. Lowercase prefix is fine (`Header:`, `/create:`, `theme:`).
- No co-authored-by trailers. No backdating.

## Testing

```bash
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit (alias for `pnpm exec tsc --noEmit`)
forge test         # solidity
```

The Cloudflare build is the ultimate smoke test:

```bash
pnpm exec opennextjs-cloudflare build
```

If the worker bundle balloons, prefer `dynamic` imports or trimming dependencies over disabling rules.

## UI conventions

- The design system lives in `theme.css` + `src/app/globals.css`. Prefer CSS variables over hard-coded colours.
- New components go in `src/components/`. Keep them client-only only when they need wagmi or browser APIs.
- Mobile-first. Every breakpoint should look intentional at 375px.

## Solidity conventions

- Custom errors, not `require(..., "string")`. Cheaper + named.
- Events for every state change. Indexed actor field where present.
- No `block.timestamp` arithmetic without explicit bounds — overflow + drift bite.

## What we won't merge

- Generic commit messages ("update X", "fix bug")
- Changes that disable the type-checker or lint rule without a comment explaining why
- New top-level dependencies without a sentence in the PR about why a stdlib option wouldn't work
