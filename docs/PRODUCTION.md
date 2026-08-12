# Production readiness — Cloudflare Workers (OpenNext)

This app is prepared for **Cloudflare Workers** via `@opennextjs/cloudflare`.
It is **not** a static-only site: `/api/leads` must remain a server route.

## Do not deploy yet

Scripts exist (`npm run preview`, `npm run deploy`) but deployment should wait until:

1. Resend (or equivalent) credentials are ready
2. Cloudflare secrets are configured
3. You explicitly approve deploy

## Architecture

| Piece | Runtime |
| --- | --- |
| Canvas game, Web Audio, UI | Browser (client) |
| `/api/leads` + Resend send | Cloudflare Workers (Node.js compat via OpenNext) |
| `public/` assets (sprites, music, Profilepic) | Worker static assets |

Next.js **16.3** + OpenNext Cloudflare adapter. Prefer Workers, not legacy Pages/`next-on-pages`.

## Local development

```bash
npm install
npm run dev
# default: http://localhost:3000 — this project often uses: npm run dev -- -p 3001
```

Workers-runtime preview (after OpenNext build):

```bash
npm run preview
```

## Production build (Next only)

```bash
npm run lint
npm run typecheck
npm run build
```

## Cloudflare deploy (when approved)

```bash
# 1. Set secrets in Cloudflare (Dashboard or CLI) — never commit keys
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put LEAD_FROM_EMAIL
npx wrangler secret put LEAD_TO_EMAIL

# 2. Deploy (only when Nick explicitly requests it)
npm run deploy
```

Optional: Workers Builds / Git integration — build command should run OpenNext deploy/upload, not plain `next start`.

### Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes (for real email) | Server-only |
| `LEAD_FROM_EMAIL` | Yes (for real email) | Verified Resend from-address |
| `LEAD_TO_EMAIL` | Optional | Defaults to `Nicholaspatricksuyat@gmail.com` |

Placeholders: `.env.example`, `.dev.vars.example`.

## Mordor / leads hardening

- Length limits + required fields + enum checks
- Malformed email rejection
- ~16 KiB body cap
- Honeypot field (`website`) — silent discard
- No provider error strings returned to the browser
- Reply-To set to prospect email via Resend API body (not client headers)

### Recommended Cloudflare rate limiting (document only)

In Cloudflare Dashboard → Security / WAF / Rate limiting (exact UI varies):

- Rule on path `/api/leads`
- Method `POST`
- Example: ~5–10 requests / minute / IP

Do not invent a local distributed rate limiter for this milestone.

## Public assets checklist

Confirm these ship under `public/` and resolve at the production origin (no localhost):

- `/images/Profilepic.png`
- `/audio/music/exploration-theme.mp3`
- `/sprites/**`
- `/_headers` (static cache for `/_next/static/*`)

## Audit notes (runtime)

- **localhost**: only in README / docs — not in production runtime paths
- **localStorage / Web Audio / window**: client-only components / game loop — OK
- **No filesystem reads** in API routes — leads use `fetch` to Resend
- **`export const runtime = "nodejs"`** on `/api/leads` — required for OpenNext (edge runtime unsupported)
- **Next/Image** + Cloudflare `IMAGES` binding configured in `wrangler.jsonc`

## Optional later

- Enable R2 incremental cache (`NEXT_INC_CACHE_R2_BUCKET`) when R2 is turned on
- Custom domain on the Worker
- Resend domain verification for branded `LEAD_FROM_EMAIL`
