# Everyday AI: operating instructions for Claude

This file is the main brief for any work on Everyday AI: website, content, newsletter or business. Read it before starting a task. Future specialist agents in `.claude/agents/` build on it and must not contradict it.

## 1. What Everyday AI is

Everyday AI makes AI understandable, practical and useful for ordinary, non-technical people. It shows how AI can genuinely save time, make work easier and help with everyday tasks, without drowning people in technical terminology.

Over the next 12 months it is growing into two things at once:

1. **A useful public resource**: free guides, tutorials, prompt ideas, tool explanations and The Sunday Edit newsletter.
2. **A credible AI adoption business**: paid consultancy and training for businesses and schools.

### Current priorities (in order)

1. Build useful Everyday AI content and grow the audience and newsletter.
2. Develop AI consultancy and training services for businesses.
3. Develop AI consultancy and training for schools and education, drawing on the founder's education background.
4. Create genuinely useful free guides and resources that demonstrate expertise.

Paid products (templates, prompt packs, guides, workshops, courses, memberships) may come later. **Do not build paid products unless Sharon specifically asks.**

### The founder

Keep the existing "Everyday AI", "we" and "the founder" approach. Do not make the site about Sharon personally. Where credibility matters (e.g. the Work with us and About pages), refer to the founder's background as the site already does: former Assistant Headteacher and Head of ICT, 18+ years bringing new technology into schools, BSc Software Development, PGDip Educational Leadership (Warwick), based in Essex, working in person locally and online across the UK. Don't invent further credentials, clients or testimonials.

## 2. Audience

Ordinary people who are interested in AI but aren't necessarily technical: busy professionals, parents, teachers, school leaders, small-business owners, and anyone who simply wants to understand how AI could help them.

**Guiding principle:** Everyday AI must be accessible to people who currently think AI is "too technical" for them. If they would feel lost, the content isn't finished.

**Geography:** primarily the UK. Anything involving businesses, schools, privacy, regulation, pricing or availability should be UK-first (e.g. UK GDPR, ICO, DfE guidance, prices in £). General everyday content can serve an international audience.

## 3. Voice and style

Warm, calm, approachable and British. It should sound like a knowledgeable person explaining AI to someone over a coffee, not a technology company selling AI. Practical, reassuring and intelligent, never patronising or oversimplified.

The existing site already sets the tone. Examples to match:

- "Make AI useful. In real life."
- "AI should feel less like another thing to learn, and more like a quiet extra pair of hands."
- "No coding. No breathless predictions. No pretending every new app will change your life."
- Site values: **Plain English · Real usefulness · Human judgement**

### Rules

- **British English** throughout (organise, colour, programme, licence/license, £).
- Short, clear sentences. Concrete, real-life examples (the school run, a full inbox, a quote for a customer).
- Every piece should answer: **"How could an ordinary person actually use this?"**
- Be honest about limits. AI makes mistakes; human judgement still leads.
- No unrealistic claims about what AI can do.
- Avoid hype and generic AI marketing language: "revolutionise", "unlock the power of", "game-changing", "transform your life", "supercharge", "cutting-edge", "harness", "in today's fast-paced world" and similar, unless there's a genuine reason.
- No excessive emojis, exclamation marks or hard-sell writing.

### Technical terms

Never assume the reader knows terms such as API, LLM, agent, RAG, tokens, embeddings, prompt, model or automation. Explain each in plain English the first time it appears, for example:

> API (a way for different software systems to talk to each other)

If a piece needs lots of definitions, simplify the piece. (A site glossary may be added later.)

## 4. Content

### Types of content we produce (now or eventually)

Practical guides · tool explanations and reviews · simple tutorials · prompt ideas and prompt packs · AI news explained for ordinary people · social media content · newsletter content · business AI adoption examples · school and education AI resources · case studies · practical automation examples.

### Tool recommendations

- Naming and comparing specific products and brands is fine and encouraged.
- Prioritise tools available in the UK.
- Mention genuine free plans, but don't recommend something just because it's free.
- Recommend what genuinely suits the reader. Affiliate links must never influence a recommendation; if introduced later, they must be clearly disclosed.

### Privacy and safety (always)

Take particular care with personal information, confidential business information, children's information and school data. Never suggest uploading sensitive or confidential information to an AI service without addressing that service's data and privacy arrangements. Where relevant, remind readers what not to paste into AI tools.

### Fact-checking

- Verify current facts about AI products (pricing, availability, features, policies) from reliable, current sources, preferably the provider's official documentation.
- **Never invent** facts, statistics, prices, capabilities, quotes, testimonials or sources.
- If something can't be verified, say so, or leave it out.
- AI products change quickly: add a date where freshness matters, e.g. "(checked September 2026)".

### The Sunday Edit newsletter

The newsletter's own writing brief lives in `lib/claude.ts` (the `SYSTEM` prompt). It follows this voice and has a fixed structure: opening, *The helpful tool*, *The prompt drawer*, *One real-life shortcut*, *The human note*, sign-off. Keep the two consistent: if the voice rules here change, suggest matching changes there (and vice versa). Changing that prompt changes live newsletter output, so ask first.

## 5. The website (technical overview)

A Next.js app (a popular framework for building websites with React) hosted on **Vercel**. The live site deploys from the `main` branch.

| Area | Where | Notes |
|---|---|---|
| Public pages | `app/page.tsx` (home), `app/resources`, `app/newsletter`, `app/about`, `app/work-with-us` | Content currently lives directly in these files |
| Shared layout | `app/layout.tsx`, `components/site-header.tsx`, `components/site-footer.tsx` | |
| Styling | `app/globals.css`, `app/contrast.css` | Tailwind 4 plus hand-written CSS. Colours: ink `#071526`, blue `#0a45df`, cyan `#54d7ff`, ivory/paper. Georgia serif headings with blue italic `<em>` emphasis; small uppercase blue "eyebrow" labels |
| Forms | `components/newsletter-form.tsx`, `components/enquiry-form.tsx` → `app/api/subscribe`, `app/api/enquiry` | **Protected** |
| Admin | `app/admin/*`, `lib/admin-auth.ts` | Password-protected subscriber list, enquiries, newsletter review, research (`/admin/research`). **Protected** |
| Research engine | `lib/research.ts`, `lib/research-schedule.ts`, `app/api/cron/research/[job]`, `app/admin/research/actions.ts`, `components/research-runner.tsx`, `docs/research-methodology.md` | **Friday research (Stage 4):** six Vercel cron jobs every Friday, 04:00–09:00 UTC (`/api/cron/research/1`–`6`), each carrying on from the next unfinished step through all four areas (tools → business → schools → privacy), then one summary email to `ADMIN_EMAIL`. Does nothing unless the Research-page switch is on (stored per environment in `research_settings`; off by default; can't be changed from Preview, which shares the live database). A job lock in `research_weeks` stops overlapping jobs; each area runs at most once per research week; the last job sends the summary even if something didn't finish. **Limits:** $2.50 per research week (Friday–Thursday, UK time) and an $8.00 calendar-month safety limit, both counting all research and checked before every step; the $10 Anthropic workspace limit is the backstop. Reaching any limit stops the week cleanly with no retries. The one exception to "no retries": if Anthropic refuses a Friday step's first request as unavailable/overloaded (503/529, so nothing was carried out), the step is left for the next Friday job, at most 2 attempts in all, never twice in the same job; timeouts, cut-offs and other errors are never retried, and manual research is unchanged. Not connected to the newsletter (Stage 5 needs separate approval). **Manual research** per area (Stage 3), run in short **resumable steps**, each only when Sharon presses a button: step 1 searches for up to 4 candidates (max 4 searches); then one step per candidate opens and checks its official pages (max 2 page reads + 1 search). Claude Sonnet 5 via `ANTHROPIC_RESEARCH_API_KEY`; basic web search/fetch tools. Limits apply to the **whole run**: 8 searches, 8 page-read attempts; spending limits checked before each step with a small reserve. The plan, step log and usage are saved in `research_runs` (`plan`, `fetches_used`); a step lock (`step_lock_id`/`step_lock_until`, 330 s) stops a step running twice; results and "done" are saved in one transaction; a cut-off step is marked "Cut off" and never repeated; no automatic retries. "Verified" is re-checked in code (official page actually opened in that step). Paused runs close as Interrupted after 24 hours; old one-request runs after 6 minutes. **Protected** |
| Newsletter system | `lib/newsletter.ts`, `lib/claude.ts`, `lib/email.ts`, `app/api/cron/*`, `vercel.json` | Saturday draft → Sharon approves → Sunday send, via Resend. **Protected** |
| Database | `db/index.ts`, `db/research.ts` | **Supabase** Postgres (project `everyday-ai`, London) via the standard `postgres` connector, for both Production and Preview through `EVERYDAY_AI_DATABASE_URL`. The old Neon database and setting are kept untouched as a fallback (see `docs/supabase-migration.md`); if `EVERYDAY_AI_DATABASE_URL` isn't set, the site falls back to Neon. `/admin` shows which database is in use. Tables are created automatically on first use (main tables in `db/index.ts`; research tables separately in `db/research.ts`, so a problem there can't affect sign-ups or the newsletter). `db/schema.sql` is out of date and `scripts/migrate.mjs` only checks a database is connected. **Protected** |
| Dates and times | `lib/uk-time.ts` | Stored as exact moments (TIMESTAMPTZ); the admin area shows them in UK time (`Europe/London`, GMT/BST automatic). The CSV has both UTC and UK columns. |
| Settings/secrets | `.env.example`, Vercel environment variables, `lib/config.ts` | **Protected** |

Known gaps (not bugs to fix silently): the Resources "Open guide" links point to `#` and the filter chips don't filter yet.

### Commands

```bash
npm install      # install dependencies
npm run dev      # run the site locally at http://localhost:3000
npm run build    # production build (also runs the database migration, so needs DATABASE_URL)
```

There is no test suite or linter yet. Before finishing code changes, at minimum make sure TypeScript compiles (`npx tsc --noEmit`) and, where possible, check the page visually. Keep new code in the style of the surrounding files.

### Roadmap (build gradually, not all at once)

Proper resource/guide pages, articles, newsletter archive, practical tutorials, tool recommendations, fuller consultancy/training pages, case studies, testimonials, and eventually booking or enquiry flows.

## 6. When to act and when to ask

**Fine to do without asking:** small, low-risk improvements such as fixing typos, tidying wording in the house voice, small accessibility or contrast fixes, minor layout polish, drafting content for review.

**Always ask Sharon first before:**

- major design changes or substantial redesigns
- deleting or removing any existing functionality
- database or schema changes
- changes to authentication or the admin area
- changes to the newsletter system, email collection or sending
- deployment, infrastructure, environment variables, API routes or other backend changes
- sending or publishing anything (emails, newsletter issues, social posts)
- spending money or introducing paid services or subscriptions
- anything that could break the live site, materially change the business, or be hard to reverse

**When uncertain, ask.**

**Never:** expose, print, commit or share API keys, passwords, tokens or other secrets (`.env*` files stay out of Git). Never invent credentials, testimonials or results.

## 7. Working with Sharon

Sharon is learning the technical side, so:

- **Plain English first**, technical detail afterwards only if useful.
- Don't assume programming or Git knowledge. When introducing something new, say briefly what it is and why we need it.
- For substantial changes, finish with:
  - **What I changed**
  - **Why**
  - **What you should check**
  - **Does it affect the live site?** (yes/no, and how)
- For major visual changes, show them for review (a preview or screenshots) before treating them as final.

### Git and GitHub (safe habits)

Git keeps a history of every change so anything can be undone; GitHub stores that history online.

- Work on a separate **branch** (a safe copy of the project to make changes in), never directly on `main`, the branch the live site is built from.
- Make small, clearly described **commits** (saved snapshots of changes).
- **Never merge significant changes into `main` without Sharon's approval.** Merging into `main` updates the live site.
- Only open a **pull request** (a request to merge a branch into `main`, where the changes can be reviewed) when it helps the task or Sharon asks.
- Never rewrite history, force-push over someone else's work or delete branches without asking.
- Briefly explain any Git step Sharon needs to take.

## 8. Project log

Keep `docs/PROJECT_LOG.md` up to date: a lightweight record of **important decisions** and **outstanding work**. Add an entry when a meaningful decision is made or a task is started, finished or parked. Keep entries to one or two lines; no admin clutter.

## 9. Specialist agents (future)

`.claude/agents/` is ready for specialist agents, but none exist yet. Don't create them unless Sharon asks. Planned agents are listed in `.claude/agents/README.md`. Every agent inherits everything in this file (voice, audience, fact-checking, privacy and the "ask first" rules) and only adds its own specialist focus.
