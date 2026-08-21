# IRENX Upgrade Protocol

Every `IRENX upgrade` is treated as a system change, not a UI-only change.

## Deployment map
- GitHub: source of truth and version history.
- Vercel: frontend and serverless HTTP API.
- Twelve Data: normalized market quotes/candles upstream; credentials remain server-side.
- Cloudflare Tunnel: secure ingress to the persistent IRENX Gateway/WebSocket runtime.
- Replit or another persistent runtime: Gateway/WebSocket/backtest jobs when connected.
- PostgreSQL: signal, candle, health, and backtest history.
- AI provider: reasoning/explanation only; deterministic IRENX Core and Risk Gate remain authoritative.

## Safety rules
1. Never commit provider/API/tunnel/broker secrets.
2. Stale, missing, malformed, or disconnected market data => `NO TRADE`.
3. AI cannot override the deterministic risk gate.
4. Scalping requires higher-timeframe context plus lower-timeframe confirmation.
5. Every strategy change requires core smoke tests and historical validation before live execution.

## Production sequence
1. Commit code to GitHub.
2. Run tests/backtest.
3. Deploy affected Vercel routes/frontend.
4. Verify market provider environment variables without exposing them.
5. Verify Cloudflare route and persistent gateway/WebSocket.
6. Verify `/api/health`, `/api/market`, `/api/candles`, `/api/analyze`.
7. Only then enable live signal display.

## Upgrade v3.7
The next production gate is deployment validation. A GitHub commit alone is not considered a live deployment. Vercel, Twelve Data, Cloudflare, and the persistent Gateway must each be independently reachable and healthy before IRENX can report LIVE.
