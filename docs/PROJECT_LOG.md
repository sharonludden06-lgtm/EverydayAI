# Everyday AI project log

A lightweight record of important decisions and outstanding work. Newest first. One or two lines per entry.

## Decisions

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
- [ ] Future (not yet approved): a scheduled AI news/research routine.
