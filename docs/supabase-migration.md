# Neon → Supabase migration (Stage 2.5)

Working record for moving the Everyday AI database from Neon to Supabase. No secrets, connection strings or personal data belong in this file.

## 2.5.1 Before-state (checked 28 September 2026, read-only)

Checked by Sharon in the Neon SQL Editor (counts only).

| Item | Value |
|---|---|
| Provider | Neon (via Vercel Storage), connected with `@neondatabase/serverless` in `db/index.ts` |
| Region | AWS Europe West 2 (London) |
| Branches | `main` only |
| Database | `neondb` |
| PostgreSQL | 18.6 |

| Table | Rows | Status totals |
|---|---|---|
| `subscribers` | 1 | subscribed: 1 |
| `issues` | 1 | draft: 1 |
| `topic_ideas` | 0 | |
| `enquiries` | 0 | |
| `research_runs` | 0 | |
| `research_findings` | 0 | |

**What this tells us**

- The Stage 2 research tables exist in the live database, and Neon has only one branch. The research tables were only ever created by the Stage 2 **Preview**, so **Preview and Production currently share the same Neon database**.
- The data is very small (two rows in total), which keeps the copy simple.

## Decision: no data migration

Sharon confirmed the one subscriber and one draft issue in Neon are only her own tests. Supabase starts fresh with the same table structure; no data is copied. Neon stays untouched as a fallback.

## 2.5.2 Supabase project (done 28 September 2026)

| Item | Value |
|---|---|
| Project | `everyday-ai` (organisation: clarity-education, Free plan) |
| Region | West Europe (London), eu-west-2 |
| Data API | Off; "Automatically expose new tables" off |
| Automatic RLS | On |
| Tables | `subscribers`, `issues`, `enquiries`, `topic_ideas`, `research_runs`, `research_findings`: same structure as `db/index.ts` and `db/research.ts`, all empty |
| Security | Row Level Security on for all six tables; `anon` and `authenticated` roles have no access. Security Advisor: no errors. |

The database password is stored only in Sharon's password manager.

## Connector change (built 28 September 2026, working branch only)

- `@neondatabase/serverless` replaced with the standard `postgres` package (works with Supabase and Neon); no feature code rewritten.
- `EVERYDAY_AI_DATABASE_URL` is used whenever it is set. If it is set but invalid, the site shows an error rather than quietly falling back to Neon.
- `/admin` shows "Database: Supabase / Neon / Postgres" (never the address).
- Tested end to end against a throwaway local Postgres: sign-up, enquiry, unsubscribe and re-subscribe, all admin pages, adding an idea, marking an enquiry replied, approving an issue, CSV export, and the Saturday/Sunday job database steps (no emails or AI calls possible in the test).

## 2.5.4 Preview connected to Supabase (28 September 2026)

- Supabase database password reset to letters and numbers only (symbols can break a web-style address).
- `EVERYDAY_AI_DATABASE_URL` (Transaction pooler, eu-west-2, port 6543) added in Vercel for **Preview only**, marked Sensitive.
- First attempt failed with "password authentication failed"; fixed by re-entering the address with the new password and redeploying the Preview.
- Preview `/admin` now shows **Database: Supabase** with 0 subscribers.
- An accidental Production redeploy of the existing `main` code happened during this step. Checked afterwards: live `/admin` still shows the Neon test subscriber and the original tabs, so nothing changed.

## 2.5.5 Preview testing on Supabase (28 September 2026)

Passed on Preview (label "Database: Supabase"):

- Newsletter sign-up, Work with us enquiry, Mark as replied
- Unsubscribe via token (copied from Supabase), then re-subscribe
- Add and remove a topic idea
- "Write a draft now" created a draft; "Save & email me a test" arrived in Sharon's inbox
- Supabase Table Editor afterwards: subscribers 1, issues 1, enquiries 1 (test rows)
- Live site checked: still the old code on Neon, showing only the original test draft. Its subscriber's "signed up from" changed to newsletter-page because Sharon also signed up once on the live site; harmless.

Still to tick off: approve/un-approve on Preview, CSV download, Research tab.

## Rules for the whole migration

- Neon is never deleted, modified or disconnected; it stays as the fallback.
- Preview moves to Supabase first; Production only after Sharon's explicit approval.
- New setting name: `EVERYDAY_AI_DATABASE_URL` (checked first; if missing, the site falls back to today's Neon setting).
- Row Level Security on for every Supabase table; Supabase's public keys aren't used.
- No secrets in chat, in this repository, or in the Claude cloud environment unless Sharon agrees there's no safer practical option.
