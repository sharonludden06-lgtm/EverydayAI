# Everyday AI project log

A lightweight record of important decisions and outstanding work. Newest first. One or two lines per entry.

## Decisions

- **2026-09-28**: Database connector switched to the standard `postgres` package on the working branch; `EVERYDAY_AI_DATABASE_URL` takes priority over the Neon setting. Not merged; Preview not yet connected to Supabase.
- **2026-09-28**: No Neon data to migrate (test rows only). Stage 2.5.2 done: Supabase `everyday-ai` project (London), six empty tables, RLS on, Data API off. Production still on Neon.
- **2026-09-28**: Stage 3 paused; standardising on Supabase first (Stage 2.5, plan in `docs/supabase-migration.md`). 2.5.1 before-state recorded: Neon London, `main` branch only, 1 subscriber, 1 draft issue, other tables empty. Preview and Production share the same Neon database.
- **2026-09-28**: Stage 2 built on the working branch (not in `main`): `research_runs` and `research_findings` tables, set up separately in `db/research.ts`; read-only `/admin/research` page and nav tab. No API calls, schedules or emails.
- **2026-09-28**: Automated Friday research planned in stages; Sonnet 5 via a separate Anthropic "Everyday AI Research" workspace capped at $10/month; Saturday may only use findings that are Verified **and** marked "Use" by Sharon (connecting to Saturday needs separate approval).
- **2026-09-28**: Stage 0 done: research workspace, $10 limit, key saved in Vercel as `ANTHROPIC_RESEARCH_API_KEY` (Production + Preview). Vercel plan: Hobby.
- **2026-09-28**: Stage 1: `docs/research-methodology.md` is now the single source of truth for research; `research-agent.md` points to it. Editing it will change automated research once live, so ask Sharon first.
- **2026-09-28**: Research rule: if a primary source can't be opened for technical reasons, don't keep working around it; mark the claim Partially verified/Unverified, name the source and say what's needed to verify it. Never mark Verified from search-result summaries alone (added to `research-agent.md`).
- **2026-09-28**: Re-checked `research/2026-09-28-weekly-ai-roundup.md` against official sources: Microsoft, Googlebook (except UK prices) and ICO findings now Verified; Opus 5.5 Free-plan claim corrected; OpenAI and Meta items still Partially verified (sites unreadable/blocked).

- **2026-09-28**: Created the Research Agent (`.claude/agents/research-agent.md`). It runs only when asked, saves reusable notes in `research/`, and never publishes. Roles: Research finds and verifies → Content writes → Sharon approves.
- **2026-09-28**: Research findings use Verified / Partially verified / Unverified labels instead of confidence ratings; unverified claims must be checked again before public use.
- **2026-09-28**: Created `CLAUDE.md` as the main operating brief for Claude, based on Sharon's answers and the existing site.
- **2026-09-28**: Keep the "Everyday AI / we / the founder" voice; don't make the site about Sharon personally for now.
- **2026-09-28**: Specialist agents will be added later, one at a time, only when Sharon asks.
- **2026-09-28**: No paid products until Sharon asks. Affiliate links (if ever used) must be disclosed and never drive recommendations.

## Outstanding work

- [ ] Resources page: "Open guide" links point to `#`; real guide pages are needed.
- [ ] Resources page: the filter chips (Home & family, Work, …) don't filter yet.
- [ ] Newsletter is in rehearsal mode; going live needs the domain verified in Resend, then `NEWSLETTER_FROM` and `SENDING_ENABLED=true` set in Vercel (Sharon to do, or approve).
- [ ] No automated checks (tests/linting) yet; consider adding a simple type-check.
- [ ] Future: glossary page for technical terms.
- [ ] Future: create the remaining specialist agents (Content, Website, AI Adoption Consultant, Education AI) when ready.
- [ ] Automated research: Stage 2 awaiting Sharon's preview test and approval to merge; Stage 3 (manual "research now" + Use/Don't use), Stage 4 (Friday schedule + summary email). Stage 5 (feed Saturday) needs separate approval.
- [ ] Verify Vercel Hobby limits (cron timing, function duration) before Stage 4; vercel.com was blocked from this environment.
