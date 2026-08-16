-- IRENX PRIME AI persistent state schema (PostgreSQL)
create table if not exists market_candles (
  symbol text not null, timeframe text not null, ts timestamptz not null,
  open numeric not null, high numeric not null, low numeric not null, close numeric not null,
  volume numeric default 0, source text not null, received_at timestamptz default now(),
  primary key(symbol,timeframe,ts)
);
create index if not exists market_candles_lookup on market_candles(symbol,timeframe,ts desc);

create table if not exists signal_events (
  id bigserial primary key, symbol text not null, mode text not null, timeframe text not null,
  ts timestamptz not null, status text not null, direction text not null, score numeric,
  regime text, structure_bias text, bos text, mss text, liquidity text, displacement text,
  orochi text, entry_low numeric, entry_high numeric, stop_loss numeric,
  tp1 numeric, tp2 numeric, tp3 numeric, reason jsonb, created_at timestamptz default now()
);
create index if not exists signal_events_lookup on signal_events(symbol,ts desc);

create table if not exists system_health (
  service text primary key, status text not null, latency_ms numeric,
  last_seen timestamptz, details jsonb, updated_at timestamptz default now()
);
