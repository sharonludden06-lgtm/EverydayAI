# Specialist agents

This folder will hold Everyday AI's specialist Claude agents: one Markdown file per agent. They're added one at a time, only when Sharon asks.

Every agent inherits the project brief in `/CLAUDE.md` (purpose, audience, British voice, plain-English rules, fact-checking, privacy and the "ask first" list). An agent file should only add its own specialist focus, never loosen those rules.

## Agents

| Agent | Status | Focus |
|---|---|---|
| AI Research Agent | **Created**: `research-agent.md` | Finds and verifies AI tools, developments and use cases; saves reusable notes in `research/`. Does not write public content or publish. |
| Everyday AI Content Agent | Planned | Turns research and ideas into articles, guides, newsletter and social content in the Everyday AI voice. |
| Website Agent | Planned | Works on the Next.js site, respecting the protected areas in `CLAUDE.md`. |
| AI Adoption Consultant Agent | Planned | Develops practical ways businesses can adopt AI: workflows, training, governance and use cases. |
| Education AI Agent | Planned | Responsible, practical AI adoption in schools (safeguarding, pupil data, DfE guidance, staff confidence). |

## How they work together

Research Agent finds and verifies → Content Agent writes for the audience → Sharon approves anything important or public.
