# Everyday AI research methodology

This is the single source of truth for how Everyday AI researches and verifies AI tools, news and developments. It is shared by:

- the **Research Agent** in Claude Code (`.claude/agents/research-agent.md`), which runs when Sharon asks; and
- the **automated weekly researcher** on the website (planned; not built yet), which will use this file as its instructions.

Each of those adds only its own practical details (where notes are saved, output format, when to stop and ask). Neither may loosen anything here.

> **Changing this file will change the automated research once it is live.** Treat edits like changes to the newsletter brief: ask Sharon first.

## Purpose

Find, verify and discover trustworthy source material about AI that Everyday AI can use later. Research is internal: it is not finished public content, and it is never published or emailed to subscribers without Sharon's approval.

Everyday AI makes AI understandable and useful for ordinary, non-technical people: busy professionals, parents, teachers, school leaders and small-business owners. It is primarily a **UK** audience.

## What to research

- New AI tools and features
- Practical everyday uses at home and at work
- Small-business AI adoption
- Schools and education
- AI news explained simply
- Privacy and regulation
- Practical automation

Focus on practical AI adoption, not developer-level technical content. Cover a technical development only when it has a meaningful implication for ordinary users or businesses, and explain it in plain English.

**Priorities:**
1. Everyday AI content and newsletter, and useful developments for ordinary people
2. Small-business AI adoption
3. Schools and education

Never ignore an important development just because it sits in a lower-priority category.

**What makes a finding valuable:** it is practical; relevant to the Everyday AI audience; available or coming to the UK; saves time or solves a genuine problem; or is an important development (privacy change, regulation, forthcoming feature) people should understand. It does not have to be something a person can try today.

**Platforms to watch:** ChatGPT/OpenAI, Claude/Anthropic, Gemini/Google, Microsoft Copilot, Canva, Perplexity, and other significant emerging consumer or business AI tools. Don't limit research to these: part of the job is discovering useful tools Sharon hasn't heard of yet.

**UK first:** for anything involving businesses, schools, privacy, regulation, pricing or availability, check the UK position (e.g. UK GDPR, ICO, DfE guidance, prices in £). If UK availability or pricing can't be confirmed, say so.

## Sources

**Prefer primary sources wherever possible:**
1. Official product documentation and help centres
2. Official product or company announcements
3. Official pricing and feature pages
4. UK Government and regulatory bodies (e.g. GOV.UK, ICO, DfE, Ofqual, Ofsted)
5. Original academic or research publications

**Reputable journalism** provides useful independent reporting and context.

**Community sources** (social media, Reddit, YouTube, newsletters, forums, creators and influencers) are valuable for discovery, real user experience, common problems, interesting workflows and emerging trends. Don't dismiss them, but never treat them as authoritative evidence for factual product claims.

Company marketing claims are the company's claims. Report them as such ("OpenAI says…"), not as independently established fact.

## Verification

- For prices, availability, features, privacy policies and capabilities, check the **current official source** wherever possible.
- One current, authoritative primary source is enough to establish a fact. Add independent sources when a claim is disputed, unclear, significant, or would benefit from independent confirmation.
- **Freshness depends on the kind of information.** For fast-changing AI products, prioritise very recent information; treat anything older than about three months as potentially outdated (check it again, don't discard it automatically). Legislation, academic research and stable background information can remain valid for much longer.
- Record when each source was checked (e.g. "checked 28 September 2026").
- Unverified information may be included when genuinely useful, but it must be labelled and must say what could and couldn't be confirmed. An unverified claim must never become established fact later just because it appears in research.
- Never disguise uncertainty.

### Verification status (use for every significant finding)

- **Verified**: confirmed by a current authoritative source that was actually opened and read (plus independent sources where needed).
- **Partially verified**: some parts confirmed; say which parts aren't, and why.
- **Unverified**: not confirmed; say what was tried.

Use these labels instead of High/Medium/Low confidence ratings.

### When reliable sources disagree

- **Don't simply pick one.** Record the disagreement: what each source says, and its date.
- Where appropriate, give priority to the **most current authoritative source** (usually the provider's own, most recently updated page), and say that's what you've done.
- Keep the finding **Partially verified** until the conflict is resolved.

### Announced is not the same as available

- Don't treat **announced**, **rolling out**, **preview**, **beta**, **coming soon** or **selected users only** as meaning generally available.
- Record these separately wherever possible:
  - **Rollout status** (e.g. announced, rolling out, preview, generally available)
  - **Eligible plans or users** (e.g. paid plans only, business accounts, selected countries)
  - **UK availability**
- If any of these can't be confirmed, say so rather than assuming.

### When a primary source can't be opened

If an official page can't be opened for technical reasons (blocked by the network, an HTTP 403 or similar refusal, a page that loads without its content):

- **Don't keep trying to work around it.** One honest attempt is enough; don't hunt for mirrors, caches, proxies or other routes to the same page.
- **Mark the claim Partially verified or Unverified**, never Verified.
- **Name the primary source that couldn't be opened** (the URL and what happened, e.g. "HTTP 403" or "blocked by network").
- **Say what would be needed to verify it**, e.g. allowing that website in the network settings, or Sharon opening the page herself and confirming the detail.
- **Never upgrade a claim to Verified solely from search-result summaries** (the snippets a search engine shows of a page), even when they appear to quote the official page. Journalism can support a claim but doesn't replace the primary source.

## Cost awareness

Research costs money each time it searches or opens a page.

- **Automated research must stay within the limits the application sets** (for example, the number of searches or page reads per run, and any spending limit). The limits themselves are set in the application and account settings, not here, because they may change.
- **Don't do extra searches or page reads just to make a report longer.** Enough to verify the findings well is the aim.
- **Prioritise verifying the most useful findings** first, so that if the budget runs out, the important ones are already checked.
- **If a limit is reached, stop cleanly.** Report what was completed and what remains unchecked. Never try to get round a limit.

## What to record for each finding

Include where relevant:

- **What happened / what the tool is**, with the date it happened
- **Plain-English explanation** (define any technical term on first use, e.g. "API (a way for different software systems to talk to each other)")
- **Why it matters**
- **Who could benefit**
- **Practical example / use case**
- **Rollout status and eligible plans/users** (see "Announced is not the same as available")
- **UK availability**
- **Current pricing / free option** (in £ where UK pricing is confirmed)
- **Privacy and data considerations**, especially for personal, business, children's or school data
- **Verification status**: Verified / Partially verified / Unverified, with what couldn't be confirmed and what would be needed
- **Basis**: hands-on testing or documentation/research
- **Sources**: link, type (official / journalism / community), whether it was actually opened, and the date checked

**Style:** clear, concise, factual internal notes in British English. Don't try to sound like finished Everyday AI content.

**Copyright:** summarise and link to the original. Never copy substantial copyrighted material; keep any direct quote short and attributed.

## Never

- Invent facts, statistics, quotes, prices, features or sources.
- Disguise uncertainty.
- Present company marketing claims as independently established fact.
- Mark anything Verified from search-result summaries alone.
- Suggest uploading confidential, personal, client, pupil or school data to an AI tool without addressing its data and privacy arrangements.
- Publish, email, post or send anything externally.
- Add affiliate links, or let them influence a recommendation.
