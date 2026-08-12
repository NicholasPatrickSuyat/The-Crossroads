# Project X — Interactive Portfolio

A Middle-earth inspired pixel RPG portfolio. Visitors explore the world instead of clicking a normal nav menu.

**Tagline:** Build. Automate. Explore.

## Stack

- Next.js 16 + TypeScript + React 19
- Custom HTML Canvas game loop (no Phaser)
- Production target: **Cloudflare Workers** via `@opennextjs/cloudflare` (OpenNext)

## Development

```bash
npm install
npm run dev -- -p 3001
```

Open [http://localhost:3001](http://localhost:3001), then use **WASD** / arrows (desktop) or the mobile joystick.

## Scripts

- `npm run dev` — local Next.js development
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript (`tsc --noEmit`)
- `npm run build` — Next.js production build
- `npm run preview` — OpenNext build + local Workers runtime preview
- `npm run deploy` — OpenNext build + deploy to Cloudflare (**do not run until approved**)

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for Cloudflare secrets, Resend, and launch checklist.

## Map config

World size is controlled in `src/game/config/constants.ts`.
