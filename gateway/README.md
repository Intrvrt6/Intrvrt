# IRENX Gateway

Private HTTP + WebSocket gateway intended to run behind Cloudflare Tunnel.

## Security
- `IRENX_GATEWAY_TOKEN` is required for HTTP and WebSocket access.
- Store the token only in the machine environment/secret manager.
- Do not commit Cloudflare tunnel tokens or credential JSON.
- Keep the gateway bound to `127.0.0.1`; expose it through Cloudflare Tunnel.

## Run

```bash
cd gateway
npm install
IRENX_GATEWAY_TOKEN='LONG_RANDOM_SECRET' npm start
```

Health check locally:

```bash
curl http://127.0.0.1:8787/health
```

Authenticated API:

```bash
curl -H "Authorization: Bearer $IRENX_GATEWAY_TOKEN" http://127.0.0.1:8787/market/state
```

WebSocket endpoint:

```text
wss://ws.YOUR_DOMAIN/ws
```

The browser/client must send `Authorization: Bearer <gateway-token>` during the WebSocket handshake. Do not expose the gateway token in a public frontend bundle. For browser clients, put an authenticated edge/session layer in front of this gateway or use short-lived signed session tokens.
