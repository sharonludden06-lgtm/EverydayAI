-- Safe to run repeatedly: only creates what is missing.
CREATE TABLE IF NOT EXISTS subscribers (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  first_name       TEXT NOT NULL DEFAULT '',
  source           TEXT NOT NULL DEFAULT 'website',
  status           TEXT NOT NULL DEFAULT 'subscribed',
  unsubscribe_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at  TIMESTAMPTZ
);
