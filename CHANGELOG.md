# Changelog

All notable changes will be recorded here. Versions track the worker deploy, not semver.

## 2026-05-23

- Light shell redesign with the `--accent`/`--bg-*` token system
- `/leaderboard` route — live, all-time, refreshes every 90s
- Cooldown UIs now actually tick (CheckInButton + Header)
- Skeleton + ErrorState + EmptyState primitives
- Per-route `loading.tsx` + `error.tsx` boundaries
- README/ARCHITECTURE/CONTRIBUTING/SECURITY in the repo root

## 2026-05-22

- Pot + PotBadges deployed to Celo mainnet
- Cross-link state verified: `Pot.badges → PotBadges`, `PotBadges.pot → Pot`
- Cloudflare Worker live at `https://pot.timjosh507.workers.dev`
- MiniPay auto-connect via `MiniPayBoot`
