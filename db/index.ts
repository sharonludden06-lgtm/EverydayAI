import { neon } from "@neondatabase/serverless";

export type Subscriber = {
  id: number;
  email: string;
  first_name: string;
  source: string;
  status: "subscribed" | "unsubscribed";
  created_at: string;
};

// Vercel's Neon integration names the setting after the chosen prefix,
// so accept the common variants rather than only DATABASE_URL.
const URL_NAMES = ["DATABASE_URL", "POSTGRES_URL", "STORAGE_URL", "DATABASE_POSTGRES_URL", "NEON_DATABASE_URL"];

export function databaseUrl() {
  for (const name of URL_NAMES) {
    const v = process.env[name];
    if (v && v.startsWith("postgres")) return v;
  }
  for (const [name, v] of Object.entries(process.env)) {
    if (name.endsWith("_URL") && v?.startsWith("postgres")) return v;
  }
  return null;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS subscribers (
     id SERIAL PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     first_name TEXT NOT NULL DEFAULT '',
     source TEXT NOT NULL DEFAULT 'website',
     status TEXT NOT NULL DEFAULT 'subscribed',
     unsubscribe_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     unsubscribed_at TIMESTAMPTZ
   )`,
];

let ready: Promise<void> | null = null;

/** Returns a query function, creating the tables first if they don't exist yet. */
export async function getSql() {
  const url = databaseUrl();
  if (!url) throw new Error("No Postgres connection setting found (expected DATABASE_URL).");
  const sql = neon(url);
  ready ??= (async () => {
    for (const statement of SCHEMA) await sql.query(statement);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return sql;
}
