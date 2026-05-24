# Security

## Reporting

Found something? Open a private security advisory on the GitHub repo or email the maintainer listed in `package.json`.

Please **do not** open a public issue for:

- Reentrancy / arithmetic issues in any contract under `contracts/`
- Authorization bypass in `Pot.sol` (creator-only / backer-only paths)
- Anything that lets a non-backer claim a refund or a non-creator withdraw

## Out of scope

- Front-end XSS that requires running attacker-controlled JS already
- Cloudflare Worker logs being public (they aren't, but the worker has no secrets to leak — all writes are user-signed)
- Forno RPC reachability — that's Celo Foundation's surface
- Anything that requires the deployer's private key to first be compromised

## Disclosure timeline

We'll acknowledge in 48 hours, target a fix on `main` within 7 days for critical issues, and coordinate disclosure with you.

## Existing audit posture

`Pot.sol` + `PotBadges.sol` are not externally audited. They use OpenZeppelin's `ReentrancyGuard`, `Ownable`, and `Pausable` building blocks. Tests in `test/` cover the common-case flows. If you find an edge case the tests miss, that itself is a useful contribution.
