# The Crossroads

The Crossroads is an interactive fantasy RPG-inspired developer portfolio built with Next.js, React, TypeScript, and a custom HTML Canvas game engine.

**Brand:** Project X · The Crossroads  
**Tagline:** Build. Automate. Explore.

## Destinations

| Place | Purpose |
| --- | --- |
| Hearth Hollow | About Me |
| Mistveil Mountains | Projects |
| Ashen Reach | Start a Project |

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
- `npm run deploy` — OpenNext build + deploy to Cloudflare (**only when approved**)

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for Cloudflare secrets, Resend, and launch checklist.

## Map config

World size is controlled in `src/game/config/constants.ts`.
