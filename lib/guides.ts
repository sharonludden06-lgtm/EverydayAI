import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Marked, type Tokens } from "marked";

/**
 * Everyday AI guides: one Markdown file per guide in content/guides/.
 *
 * This is the only place that reads the guide files. The Resources cards, the guide pages and the
 * home page all ask this file for guides, so if guides ever move (e.g. into the database for an
 * admin editor), only this file needs to change.
 *
 * Status:
 *   draft        – being written. Hidden on the live site: no card, no page.
 *   coming-soon  – card shows on the live site with "Guide coming soon"; the page isn't public yet.
 *   published    – card and page are public.
 * On Vercel Preview (and `npm run dev`) every guide page can be opened, with a "not public" banner,
 * so drafts can be reviewed. Nothing becomes public unless a person sets `status: published` and
 * the change is merged into `main`.
 */

/** The Resources filter buttons, in order. Every guide's `category` must be one of these. */
export const CATEGORIES = ["Home & family", "Work", "Prompts", "Tools"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Card icons a guide can choose from (drawn on the Resources page). */
export const ICONS = ["house", "briefcase", "wand", "clock"] as const;
export type GuideIcon = (typeof ICONS)[number];

const STATUSES = ["draft", "coming-soon", "published"] as const;
export type GuideStatus = (typeof STATUSES)[number];

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  category: Category;
  /** The small pill on the card, e.g. "Start here". Defaults to the category. */
  label: string;
  icon: GuideIcon;
  status: GuideStatus;
  /** YYYY-MM-DD. Required once published. */
  published?: string;
  /** YYYY-MM-DD: when named AI tools/features in the guide were last checked. */
  checked?: string;
  featured: boolean;
  /** Lower numbers come first on the Resources page. */
  order?: number;
  /** Minutes: set in the file, or worked out from the word count. */
  readingTime: number;
  /** The guide itself, in Markdown. */
  body: string;
};

const DIR = path.join(process.cwd(), "content", "guides");
const FIELDS = ["title", "slug", "summary", "category", "label", "icon", "status", "published", "checked", "featured", "order", "readingTime"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True on Vercel Preview deployments and when running locally with `npm run dev`. Never on the live site. */
export function showsUnpublished() {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";
}

/** Reads the simple `key: value` block between the `---` lines at the top of a guide file. */
function parseFile(file: string, text: string) {
  const fail = (msg: string): never => {
    throw new Error(`Guide file content/guides/${file}: ${msg}`);
  };
  const match = text.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) fail("it must start with a details block between two '---' lines.");
  const [, head, body] = match!;
  const data: Record<string, string> = {};
  for (const raw of head.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const colon = line.indexOf(":");
    if (colon < 1) fail(`couldn't read the line "${line}". Each line should look like "title: The Sunday Reset".`);
    const key = line.slice(0, colon).trim();
    if (!FIELDS.includes(key)) fail(`"${key}" isn't a recognised detail. Allowed: ${FIELDS.join(", ")}.`);
    if (key in data) fail(`"${key}" appears twice.`);
    data[key] = line.slice(colon + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return { data, body: body.trim(), fail };
}

function toGuide(file: string, text: string): Guide {
  const { data, body, fail } = parseFile(file, text);
  const need = (key: string) => data[key] || fail(`"${key}" is missing.`);
  const oneOf = <T extends string>(key: string, allowed: readonly T[]) => {
    const value = need(key);
    return (allowed as readonly string[]).includes(value) ? (value as T) : fail(`${key} "${value}" must be one of: ${allowed.join(", ")}.`);
  };
  const date = (key: string) => {
    const value = data[key];
    if (value === undefined || value === "") return undefined;
    return DATE.test(value) && !Number.isNaN(Date.parse(value)) ? value : fail(`${key} "${value}" must be a date written like 2026-10-05.`);
  };
  const whole = (key: string) => {
    const value = data[key];
    if (value === undefined || value === "") return undefined;
    return /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : fail(`${key} "${value}" must be a whole number above 0.`);
  };

  const slug = need("slug");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`slug "${slug}" may only use lower-case letters, numbers and single hyphens.`);
  if (`${slug}.md` !== file) fail(`the slug "${slug}" must match the file name (expected ${slug}.md).`);
  if (data.featured && !["true", "false"].includes(data.featured)) fail(`featured must be true or false.`);

  const status = oneOf("status", STATUSES);
  const published = date("published");
  if (status === "published" && !published) fail(`a published guide needs a "published" date.`);
  if (status === "published" && !body) fail(`a published guide needs some guide text below the details.`);

  const category = oneOf("category", CATEGORIES);
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: need("title"),
    summary: need("summary"),
    category,
    label: data.label || category,
    icon: oneOf("icon", ICONS),
    status,
    published,
    checked: date("checked"),
    featured: data.featured === "true",
    order: whole("order"),
    readingTime: whole("readingTime") ?? Math.max(1, Math.round(words / 200)),
    body,
  };
}

/** Every guide file, checked. A mistake in any file stops the build with a plain message. */
function allGuides(): Guide[] {
  const guides = readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => toGuide(f, readFileSync(path.join(DIR, f), "utf8")));
  return guides.sort(
    (a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) ||
      (b.published ?? "").localeCompare(a.published ?? "") ||
      a.title.localeCompare(b.title),
  );
}

/** Guides with a card on the Resources page: published and coming-soon (plus drafts on Preview). */
export function getGuideCards() {
  return allGuides().filter((g) => g.status !== "draft" || showsUnpublished());
}

/** Guides that have their own page: published only (every guide on Preview). */
export function getGuidePages() {
  return allGuides().filter((g) => g.status === "published" || showsUnpublished());
}

/** One guide, if its page can be shown here. */
export function getGuide(slug: string) {
  return getGuidePages().find((g) => g.slug === slug);
}

/** A guide's page address once it's published on the live site, otherwise the Resources page. */
export function guideHref(slug: string) {
  return allGuides().some((g) => g.slug === slug && g.status === "published") ? `/resources/${slug}` : "/resources";
}

/** "2026-10-05" → "5 October 2026"; with `monthOnly`, "October 2026". */
export function formatGuideDate(date: string, monthOnly = false) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    ...(monthOnly ? {} : { day: "numeric" }),
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeHref = (href: string) => /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href);

/**
 * Guide building blocks, written in ordinary Markdown (see content/README.md):
 *   > A plain quote block                → a prompt box with a "Copy prompt" button
 *   > [!prompt] Optional heading         → the same, with its own heading
 *   > [!privacy] / [!warning] / [!tip] / [!note]  (optional heading after it) → a callout panel
 *   > [!quote]                           → an ordinary quotation
 *   1. Numbered list                     → numbered steps
 *   - [x] Task-list items                → a tick list
 *   ## Section headings                  → listed in "In this guide"
 */
const CALLOUTS: Record<string, string> = {
  privacy: "Privacy first",
  warning: "Important",
  tip: "Tip",
  note: "Good to know",
};

/** Turns &amp; &#39; etc. back into characters (the contents list is plain text). */
const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** `label` is set for headings such as "Step 1: …" or "Prompt 2: …", which show that label instead of a section number. */
export type GuideHeading = { id: string; text: string; label?: string };

const slugify = (text: string) =>
  text.toLowerCase().replace(/[*_`[\]()]/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

// A list item that opens with a bold phrase ending in punctuation ("**Crop or cover anything personal.** …").
function hasLead(item: Tokens.ListItem) {
  const first = item.tokens.find((t) => t.type !== "checkbox");
  const opening = first && "tokens" in first ? first.tokens?.[0] : undefined;
  return opening?.type === "strong" && /[.:?!]\W*$/.test(opening.text);
}

/** Markdown → HTML plus the list of sections. As in the newsletter, raw HTML in a guide is shown as
 * text rather than run, and only ordinary web, email and on-site links are allowed. */
export function renderGuide(body: string): { html: string; headings: GuideHeading[] } {
  const headings: GuideHeading[] = [];
  const md = new Marked({ gfm: true });
  md.use({
    renderer: {
      html: ({ text }) => esc(text),
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        if (!safeHref(href)) return text;
        const external = /^https?:\/\//i.test(href);
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' rel="noopener noreferrer"' : ""}>${text}</a>`;
      },
      image({ href, title, text }) {
        if (!/^(https:\/\/|\/(?!\/))/i.test(href)) return esc(text);
        return `<img src="${esc(href)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy">`;
      },
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        if (depth > 2) return `<h3>${inner}</h3>\n`;
        let id = slugify(text);
        while (headings.some((h) => h.id === id)) id += "-2";
        const plain = decode(inner.replace(/<[^>]+>/g, ""));
        const labelled = plain.match(/^((?:Step|Prompt|Part)\s+\d+)\s*[:.]\s+(.+)$/i);
        if (labelled) {
          headings.push({ id, text: labelled[2], label: labelled[1] });
          return `<h2 id="${id}" class="labelled"><span class="guide-h2-label">${esc(labelled[1])}</span>${esc(labelled[2])}</h2>\n`;
        }
        headings.push({ id, text: plain });
        return `<h2 id="${id}">${inner}</h2>\n`;
      },
      blockquote({ tokens, text }) {
        const marker = text.match(/^\s*\[!(\w+)\][ \t]*([^\n]*)\n?([\s\S]*)$/);
        const type = marker?.[1].toLowerCase();
        const heading = marker?.[2].trim() ?? "";
        const inner = marker && type && (type in CALLOUTS || type === "prompt" || type === "quote") ? md.parse(marker[3], { async: false }) as string : this.parser.parse(tokens);
        if (type === "quote") return `<blockquote class="guide-quote">${inner}</blockquote>\n`;
        if (type && type in CALLOUTS) {
          return `<aside class="guide-callout guide-callout-${type}" role="note"><p class="guide-callout-label">${esc(heading || CALLOUTS[type])}</p>${inner}</aside>\n`;
        }
        // Anything else is a prompt box. Short one-line prompts get a compact box.
        const compact = !heading && tokens.length === 1 && tokens[0].type === "paragraph" && tokens[0].text.length <= 140;
        return `<figure class="guide-prompt${compact ? " compact" : ""}"><figcaption><span>${esc(heading || (compact ? "Try" : "Try this prompt"))}</span><button type="button" class="guide-copy" data-copy hidden>${compact ? "Copy" : "Copy prompt"}</button></figcaption><div class="guide-prompt-text">${inner.trim()}</div></figure>\n`;
      },
      list(token) {
        const tag = token.ordered ? "ol" : "ul";
        const cls = token.ordered ? "guide-steps" : token.items.some((i) => i.task) ? "guide-checks" : token.items.some(hasLead) ? "guide-list rows" : "guide-list";
        const start = token.ordered && token.start !== 1 && token.start !== "" ? ` start="${token.start}"` : "";
        return `<${tag} class="${cls}"${start}>\n${token.items.map((i) => this.listitem(i)).join("")}</${tag}>\n`;
      },
      listitem(item) {
        // An item that opens with a bold phrase ending in punctuation ("**Crop or cover anything personal.** …") shows that phrase as its heading.
        const lead = hasLead(item);
        return `<li${lead ? ' class="has-lead"' : ""}>${this.parser.parse(item.tokens)}</li>\n`;
      },
      checkbox: () => "",
    },
  });
  const html = md.parse(body, { async: false }) as string;
  return { html, headings };
}
