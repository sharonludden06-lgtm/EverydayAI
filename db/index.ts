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

export type IssueStatus = "draft" | "approved" | "sending" | "sent" | "failed";

export type Issue = {
  id: number;
  subject: string;
  preheader: string;
  body: string;
  status: IssueStatus;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  sent_at: string | null;
  sent_count: number;
  send_note: string | null;
};

export type TopicIdea = { id: number; idea: string; created_at: string; used_at: string | null };

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
  `CREATE TABLE IF NOT EXISTS issues (
     id SERIAL PRIMARY KEY,
     subject TEXT NOT NULL,
     preheader TEXT NOT NULL DEFAULT '',
     body TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'draft',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     approved_at TIMESTAMPTZ,
     sent_at TIMESTAMPTZ,
     sent_count INTEGER NOT NULL DEFAULT 0,
     send_note TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS topic_ideas (
     id SERIAL PRIMARY KEY,
     idea TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     used_at TIMESTAMPTZ
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
