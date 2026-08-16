# IRENX PRIME AI — Deployment Contract

## Required secrets

Never commit secrets. Configure them in the runtime secret store:

- `TWELVEDATA_API_KEY` — Twelve Data API/WebSocket access
- `DATABASE_URL` — PostgreSQL connection string (when persistence is enabled)
- Cloudflare Tunnel credentials — only on the machine running `cloudflared`
- Optional AI provider keys — server-side only

## Production flow

`GitHub → Vercel (web/API) → Cloudflare Access/Tunnel → IRENX Gateway → market stream → IRENX Core`

## Safety gates

- Missing market credentials => degraded / no-trade.
- Stale or invalid market data => no-trade.
- Structure/liquidity conflicts => WAIT or NO TRADE.
- Risk engine must approve before any execution integration.

## WebSocket

The persistent WebSocket bridge runs outside ordinary serverless request handlers. `server/ws-server.js` is intended for a long-lived Node runtime and can be exposed through Cloudflare Tunnel.
