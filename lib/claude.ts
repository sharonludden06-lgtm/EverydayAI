import "server-only";

const MODELS = [process.env.ANTHROPIC_MODEL, "claude-sonnet-5", "claude-sonnet-4-5"].filter(Boolean) as string[];

const SYSTEM = `You write "The Sunday Edit", the weekly email from Everyday AI (a UK website).

Readers: busy, curious everyday people — many are working parents — who want AI to be useful at home and at work. They are not technical and are a little wary of hype.

Voice: warm, calm, plain English, British spelling, lightly witty, never breathless. Short sentences. No jargon; if a term is unavoidable, explain it in a few words. Be honest about limits and privacy (e.g. don't paste personal or work-confidential details into AI tools). Never invent statistics, quotes, prices or features. Only recommend tools that genuinely exist and are available in the UK; if unsure about a detail, leave it out.

Every issue is a five-minute read (400–650 words) with exactly this structure in Markdown:

A 2–3 sentence opening that sets up this week's theme in a relatable, real-life moment. No heading.

## The helpful tool
One real AI tool or feature: what it is, one concrete everyday use, how to try it in 2–3 steps, and an honest one-line verdict (who it's for / who can skip it).

## The prompt drawer
Exactly three copy-ready prompts, each as: a bold short title on its own line, then the prompt itself as a blockquote (> ...), then one line on when to use it. Mix home and work.

## One real-life shortcut
A small, specific time-saver someone could try this week, in numbered steps.

## The human note
2–4 sentences: a sensible, reassuring perspective on using AI with good judgement.

Finish with a one-line sign-off: "Until next Sunday," on its own line, then "Everyday AI".

Do not add any other sections, links you have not verified, or images.`;

export type GeneratedIssue = { subject: string; preheader: string; body: string };

type ContentBlock = { type: string; text?: string };

async function callClaude(model: string, user: string, withSearch: boolean) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
      ...(withSearch ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] } : {}),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { content?: ContentBlock[]; error?: { message?: string } };
  return { ok: res.ok, status: res.status, data };
}

export async function generateIssue(pastSubjects: string[], ideas: string[]): Promise<GeneratedIssue> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set in Vercel.");

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const user = [
    `Write this week's issue. Today is ${today}; it will be sent on Sunday morning.`,
    ideas.length
      ? `Build the issue around this idea from the editor (use it as the theme): ${ideas.join(" / ")}`
      : "Choose a fresh, seasonal, practical theme yourself.",
    pastSubjects.length
      ? `Recent issues (don't repeat these themes or tools):\n- ${pastSubjects.join("\n- ")}`
      : "This is one of the very first issues.",
    "You may search the web briefly to check the tool you recommend is current and available in the UK.",
    `Reply with ONLY a JSON object, no other text: {"subject": "under 60 characters, intriguing not clickbait", "preheader": "under 100 characters, complements the subject", "body": "the full Markdown issue"}`,
  ].join("\n\n");

  let lastError = "";
  for (const model of MODELS) {
    for (const withSearch of [true, false]) {
      const { ok, status, data } = await callClaude(model, user, withSearch);
      if (!ok) {
        lastError = `${status}: ${data.error?.message ?? "unknown error"}`;
        if (status === 401 || status === 402 || status === 429) throw new Error(`Claude API error ${lastError}`);
        continue; // try without search, then next model
      }
      const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      try {
        const parsed = JSON.parse(json) as GeneratedIssue;
        if (parsed.subject && parsed.body) {
          return {
            subject: parsed.subject.trim().slice(0, 150),
            preheader: (parsed.preheader ?? "").trim().slice(0, 200),
            body: parsed.body.trim(),
          };
        }
        lastError = "Claude's reply was missing a subject or body.";
      } catch {
        lastError = "Claude's reply wasn't valid JSON.";
      }
    }
  }
  throw new Error(`Couldn't generate a draft. Last error: ${lastError}`);
}
