# Pot — Stacks port

A Clarity rewrite of `Pot.sol`. Same shape (pot map, contributions, status enum) but settles in sBTC instead of cUSD.

## State

- [x] Storage maps + `next-pot-id` counter
- [x] `create-pot` happy path
- [ ] `contribute` (needs SIP-010 wiring)
- [ ] `withdraw` (creator pulls)
- [ ] `refund` (backer pulls on missed deadline)
- [ ] `cancel-pot`
- [ ] Tests

## Run locally

```bash
clarinet check
clarinet repl
```

## Why this exists

Talent.app's Stacks track wanted parity with the EVM build. This contract is a 1:1 port — same semantics, same status codes, same event-equivalent printlns. Aim is to keep the worker UI agnostic to chain (Celo or Stacks) via the `ChainProvider` layer.

## Differences vs the EVM build

- No `ReentrancyGuard` — Clarity's contract-call discipline avoids reentrancy.
- Events become `print` of structured tuples.
- Deadlines are in Stacks block-height (10-min blocks) not Unix seconds.
