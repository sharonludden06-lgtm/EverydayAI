import postgres from "postgres";

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

export type Enquiry = {
  id: number;
  name: string;
  email: string;
  organisation: string;
  kind: "school" | "business" | "other";
  message: string;
  status: "new" | "replied" | "archived";
  created_at: string;
};

export type TopicIdea = { id: number; idea: string; created_at: string; used_at: string | null };

/** The chosen database. If EVERYDAY_AI_DATABASE_URL is set it always wins (and must be valid). */
export function databaseUrl() {
  const chosen = process.env.EVERYDAY_AI_DATABASE_URL?.trim();
  if (chosen) {
    // Never fall back quietly to another database if the chosen one is mistyped.
    if (!chosen.startsWith("postgres")) throw new Error("EVERYDAY_AI_DATABASE_URL isn't a Postgres connection address.");
    return chosen;
  }
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
  // Tidy source markers out of drafts written before they were stripped automatically.
  `UPDATE issues SET body = regexp_replace(body, '</?cite[^>]*>', '', 'gi'),
                     subject = regexp_replace(subject, '</?cite[^>]*>', '', 'gi'),
                     preheader = regexp_replace(preheader, '</?cite[^>]*>', '', 'gi')
    WHERE status IN ('draft','approved','failed')
      AND (body ~* '</?cite' OR subject ~* '</?cite' OR preheader ~* '</?cite')`,
  `CREATE TABLE IF NOT EXISTS enquiries (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     organisation TEXT NOT NULL DEFAULT '',
     kind TEXT NOT NULL DEFAULT 'other',
     message TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'new',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS topic_ideas (
     id SERIAL PRIMARY KEY,
     idea TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     used_at TIMESTAMPTZ
   )`,
];

/** Which service the chosen database is on, for display in /admin. Never shows the address itself. */
export function databaseLabel() {
  try {
    const url = databaseUrl();
    if (!url) return "Not connected";
    const host = new URL(url).hostname;
    if (host.includes("supabase")) return "Supabase";
    if (host.includes("neon.tech")) return "Neon";
    return "Postgres";
  } catch {
    return "Not connected";
  }
}

// One shared connection pool per server instance. Works with both Supabase and Neon.
let client: postgres.Sql | null = null;
function connect(url: string) {
  // Drop options like ?sslmode=…&channel_binding=… (Neon) or ?pgbouncer=true (Supabase):
  // this connector would pass unknown ones to the server, which rejects them. SSL is set below instead.
  const clean = new URL(url);
  const local = ["localhost", "127.0.0.1"].includes(clean.hostname);
  clean.search = "";
  client ??= postgres(clean.toString(), {
    max: 3,
    idle_timeout: 20,
    prepare: false, // required by Supabase's transaction pooler
    ssl: local ? false : "require",
  });
  return client;
}

let ready: Promise<void> | null = null;

/** Returns a query function, creating the tables first if they don't exist yet. */
export async function getSql() {
  const url = databaseUrl();
  if (!url) throw new Error("No Postgres connection setting found (expected EVERYDAY_AI_DATABASE_URL or DATABASE_URL).");
  const sql = connect(url);
  ready ??= (async () => {
    for (const statement of SCHEMA) await sql.unsafe(statement);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return sql;
}
