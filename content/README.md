# Guides

Each guide on the Resources page is one Markdown file in `content/guides/`. From that one file the site builds the guide's Resources card, puts it under the right filter, and creates its page at `/resources/<slug>`. There is no separate list of cards to update.

## Adding a guide

1. Copy an existing file in `content/guides/` and rename it, e.g. `sorting-school-emails.md`.
2. Fill in the details block at the top (see below) and write the guide underneath in Markdown.
3. Leave `status: draft` while writing, and check it on the Vercel Preview link.
4. When it has been reviewed and approved, set `status: published`, add the `published` date, and merge into `main`.

If a detail is missing or mistyped, the build stops with a message naming the file and the problem, so a broken guide can't reach the live site.

## The details block

```
---
title: The Sunday Reset
slug: the-sunday-reset
summary: Turn a photo of your fridge and a busy calendar into a realistic meal plan.
category: Home & family
label: Home & family
icon: house
status: draft
published: 2026-10-05
checked: 2026-10-01
featured: false
order: 1
---
```

| Detail | Required? | Notes |
|---|---|---|
| `title` | Yes | |
| `slug` | Yes | The web address. Must match the file name. Treat it as permanent once published: changing it breaks old links. |
| `summary` | Yes | Shown on the card and to search engines. |
| `category` | Yes | One of: `Home & family`, `Work`, `Prompts`, `Tools` (the Resources filters). |
| `label` | No | The small pill on the card, e.g. `Start here`. Defaults to the category. |
| `icon` | Yes | One of: `house`, `briefcase`, `wand`, `clock`. |
| `status` | Yes | `draft`, `coming-soon` or `published` (see below). |
| `published` | When published | Date written as `2026-10-05`. |
| `checked` | For guides naming AI tools | When the tool details were last checked. Shown as "Tool details checked October 2026". |
| `featured` | No | `true` or `false`. Not used yet; for featuring guides elsewhere later. |
| `order` | No | Lower numbers come first on the Resources page. |
| `readingTime` | No | Minutes. Worked out from the word count if left out. |

## Draft, coming soon and published

| Status | Live site | Vercel Preview |
|---|---|---|
| `draft` | Hidden: no card, no page | Card and page shown, marked "not public" |
| `coming-soon` | Card shows "Guide coming soon"; no page | Card and page shown, marked "not public" |
| `published` | Card and page are public | Same as live |

Nothing becomes public automatically. A guide is only public once a person sets `status: published` and the change is merged into `main`. Any future AI-assisted drafting must only ever create `draft` guides.

## Writing a guide

- Follow the voice, plain-English and fact-checking rules in `/CLAUDE.md`.
- Start sections with `##` (the page title is added automatically). Each `##` section is numbered and listed in "In this guide". Use `###` for smaller headings inside a section.
- For a sequence of sections, start the heading with `Step 1:`, `Prompt 1:` or `Part 1:` (e.g. `## Step 1: Write down your week`). That label is shown instead of the section number, and the other sections carry on 01, 02…
- The first paragraph is shown larger, as an introduction. Keep paragraphs short.

## Building blocks

Every guide page uses the same design. These are written in ordinary Markdown, so no guide needs custom design work.

| You write | It becomes |
|---|---|
| A quote block (lines starting with `>`) | A **prompt box** with a "Copy prompt" button. A short one-line prompt gets a compact box. |
| `> [!prompt] The meal-plan prompt` on the first line | A prompt box with its own heading. |
| `> [!privacy]` | A dark **Privacy first** panel. Use it wherever readers should think about what they share. |
| `> [!warning] Allergies need a human check` | An amber **Important** panel for safety points and serious limits. |
| `> [!tip]` | A pale blue **Tip** panel. |
| `> [!note]` | A cream **Good to know** panel. |
| `> [!quote]` | An ordinary quotation (not a prompt). |
| A numbered list (`1.`, `2.` …) | **Numbered steps**. |
| A task list (`- [x] item`) | A **tick list**, e.g. "What you'll need". |
| A bulleted list (`- item`) | Blue-dot bullets. |
| A list item starting with a bold phrase that ends in punctuation (`- **Check the settings.** Most AI…`) | The bold phrase becomes the item's heading, and the list is shown as divided rows for quick scanning. |

Any panel takes an optional heading after the marker (`> [!tip] Save your prompt`); without one it uses the default label. Leave a line with just `>` after the marker line, then the content, for example:

```
> [!privacy]
>
> - **Crop or cover anything personal.** Letters on the fridge door, addresses, other people's names.
> - **Check the settings.** Most AI assistants let you choose whether your conversations are used to improve their services.
```

Raw HTML isn't run (it's shown as text), and only normal web, email and on-site links work.
