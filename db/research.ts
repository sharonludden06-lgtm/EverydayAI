import { getSql } from "@/db";

// Research tables are set up separately from the main schema in db/index.ts,
// so a problem here can only affect /admin/research, never sign-ups or the newsletter.

export type ResearchArea = "tools" | "business" | "schools" | "privacy";
export type RunStatus = "running" | "complete" | "partial" | "failed" | "stopped_limit" | "interrupted";
export type VerificationStatus = "verified" | "partially_verified" | "unverified";
export type FindingDecision = "undecided" | "use" | "dont_use";

export type ResearchSource = {
  url: string;
  title: string;
  type: "official" | "journalism" | "community";
  opened: boolean; // true only if the page itself was actually opened and read
  checked_at: string;
  note?: string;
};

export type ResearchRun = {
  id: number;
  week_of: string;
  area: ResearchArea;
  trigger: "manual" | "scheduled";
  environment: "live" | "preview" | "local" | "unknown";
  status: RunStatus;
  model: string;
  started_at: string;
  finished_at: string | null;
  last_activity_at: string | null;
  searches_used: number;
  pages_opened: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: string; // NUMERIC comes back as a string
  unchecked_notes: string | null;
  error: string | null;
  // Step-by-step runs (older one-request runs have no plan).
  plan: ResearchPlan | null;
  fetches_used: number;
  step_lock_id: string | null;
  step_lock_until: string | null;
};

export type StepStatus = "pending" | "in_progress" | "done" | "failed" | "cut_off" | "skipped" | "dropped";

export type ResearchCandidate = {
  title: string;
  event_date: string;
  summary: string;
  official_urls: string[];
  other_urls: string[];
  status: StepStatus;
  note: string;
  finding_id: number | null;
};

export type ResearchStepLog = {
  n: number;
  kind: "discovery" | "verify";
  label: string;
  started_at: string;
  finished_at: string | null;
  searches: number;
  fetches: number; // page-read attempts (these count towards the limit)
  pages: number; // pages actually opened
  cost: number;
  outcome: "running" | "done" | "failed" | "cut_off" | "dropped";
  note: string;
};

/** Everything a step-by-step run needs to carry on from where it stopped. Saved in research_runs.plan. */
export type ResearchPlan = {
  version: 1;
  discovery: { status: StepStatus; note: string };
  candidates: ResearchCandidate[];
  unchecked: string;
  stop_reason: string;
  steps: ResearchStepLog[];
};

export type ResearchFinding = {
  id: number;
  run_id: number;
  area: ResearchArea;
  title: string;
  event_date: string | null;
  summary: string;
  why_it_matters: string;
  who_benefits: string;
  example: string;
  rollout_status: string;
  eligible: string;
  uk_availability: string;
  pricing: string;
  privacy: string;
  verification_status: VerificationStatus;
  verification_note: string;
  conflicts: string;
  basis: string;
  sources: ResearchSource[];
  decision: FindingDecision;
  decided_at: string | null;
  used_in_issue_id: number | null;
  created_at: string;
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS research_runs (
     id SERIAL PRIMARY KEY,
     week_of DATE NOT NULL,
     area TEXT NOT NULL,
     trigger TEXT NOT NULL DEFAULT 'manual',
     status TEXT NOT NULL DEFAULT 'running',
     model TEXT NOT NULL DEFAULT '',
     started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     finished_at TIMESTAMPTZ,
     searches_used INTEGER NOT NULL DEFAULT 0,
     pages_opened INTEGER NOT NULL DEFAULT 0,
     input_tokens INTEGER NOT NULL DEFAULT 0,
     output_tokens INTEGER NOT NULL DEFAULT 0,
     estimated_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
     unchecked_notes TEXT,
     error TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS research_findings (
     id SERIAL PRIMARY KEY,
     run_id INTEGER NOT NULL REFERENCES research_runs(id) ON DELETE CASCADE,
     area TEXT NOT NULL,
     title TEXT NOT NULL,
     event_date DATE,
     summary TEXT NOT NULL DEFAULT '',
     why_it_matters TEXT NOT NULL DEFAULT '',
     who_benefits TEXT NOT NULL DEFAULT '',
     example TEXT NOT NULL DEFAULT '',
     rollout_status TEXT NOT NULL DEFAULT '',
     eligible TEXT NOT NULL DEFAULT '',
     uk_availability TEXT NOT NULL DEFAULT '',
     pricing TEXT NOT NULL DEFAULT '',
     privacy TEXT NOT NULL DEFAULT '',
     verification_status TEXT NOT NULL DEFAULT 'unverified',
     verification_note TEXT NOT NULL DEFAULT '',
     conflicts TEXT NOT NULL DEFAULT '',
     basis TEXT NOT NULL DEFAULT 'documentation/research',
     sources JSONB NOT NULL DEFAULT '[]'::jsonb,
     decision TEXT NOT NULL DEFAULT 'undecided',
     decided_at TIMESTAMPTZ,
     used_in_issue_id INTEGER,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS research_findings_run_idx ON research_findings (run_id)`,
  // Stage 3: label each run with where it ran, so Preview test runs are easy to spot and delete.
  `ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'unknown'`,
  // Updated after every reply from Anthropic; used to spot runs the server abandoned.
  `ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ`,
  // Step-by-step runs: the saved plan, page-read attempts, and a short-lived lock so only one step runs at a time.
  `ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS plan JSONB`,
  `ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS fetches_used INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS step_lock_id TEXT`,
  `ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS step_lock_until TIMESTAMPTZ`,
];

let ready: Promise<void> | null = null;

/** Returns a query function, creating the research tables first if they don't exist yet. */
export async function getResearchSql() {
  const sql = await getSql();
  ready ??= (async () => {
    for (const statement of SCHEMA) await sql.unsafe(statement);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return sql;
}
