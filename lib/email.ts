import "server-only";
import { Marked } from "marked";
import { fromAddress } from "@/lib/config";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Markdown → HTML, with any raw HTML in the text shown as text rather than run.
const md = new Marked({ gfm: true, breaks: true });
md.use({ renderer: { html: ({ text }) => esc(text) } });

const INK = "#071526";
const BLUE = "#0a45df";
const MUTED = "#4a5563";

/** Inline styles so the email looks right in Gmail/Outlook/Apple Mail. */
function styleHtml(html: string) {
  return html
    .replace(/<h2>/g, `<h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${INK};margin:34px 0 12px;">`)
    .replace(/<h3>/g, `<h3 style="font-family:Georgia,serif;font-weight:400;font-size:20px;color:${INK};margin:24px 0 8px;">`)
    .replace(/<p>/g, `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#243242;">`)
    .replace(/<blockquote>\s*<p style="[^"]*">/g, `<blockquote style="margin:8px 0 10px;padding:14px 18px;background:#eef3ff;border-left:3px solid ${BLUE};border-radius:6px;"><p style="margin:0;font-size:15px;line-height:1.6;color:${INK};font-family:Georgia,serif;">`)
    .replace(/<ol>/g, `<ol style="margin:0 0 16px;padding-left:22px;color:#243242;font-size:16px;line-height:1.65;">`)
    .replace(/<ul>/g, `<ul style="margin:0 0 16px;padding-left:22px;color:#243242;font-size:16px;line-height:1.65;">`)
    .replace(/<li>/g, `<li style="margin:0 0 6px;">`)
    .replace(/<a href=/g, `<a style="color:${BLUE};" href=`)
    .replace(/<strong>/g, `<strong style="color:${INK};">`)
    .replace(/<hr>/g, `<hr style="border:0;border-top:1px solid #d9dde3;margin:28px 0;">`);
}

export function renderIssueBodyHtml(body: string) {
  return styleHtml(md.parse(body, { async: false }) as string);
}

export function renderEmail(opts: {
  subject: string;
  preheader: string;
  body: string;
  unsubscribeUrl: string;
  siteUrl: string;
  banner?: string;
}) {
  const content = renderIssueBodyHtml(opts.body);
  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f4ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ee;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffefa;border:1px solid #e3e5e8;border-radius:14px;">
${opts.banner ? `<tr><td style="padding:12px 32px;background:#fff4d6;border-radius:14px 14px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#6b4e00;">${esc(opts.banner)}</td></tr>` : ""}
<tr><td style="padding:30px 32px 6px;font-family:Arial,sans-serif;">
<span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;background:${INK};color:#fff;border-radius:50%;font-family:Georgia,serif;font-style:italic;font-size:16px;vertical-align:middle;">E</span>
<span style="font-weight:700;font-size:12px;letter-spacing:2px;color:${INK};vertical-align:middle;margin-left:8px;">EVERYDAY<span style="color:${BLUE};">AI</span></span>
<div style="margin-top:22px;font-size:11px;letter-spacing:2.5px;color:${BLUE};font-weight:700;">THE SUNDAY EDIT</div>
<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:32px;line-height:1.15;color:${INK};margin:10px 0 22px;">${esc(opts.subject)}</h1>
</td></tr>
<tr><td style="padding:0 32px 18px;font-family:Arial,Helvetica,sans-serif;">${content}</td></tr>
<tr><td style="padding:22px 32px 30px;border-top:1px solid #e3e5e8;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
You're receiving this because you signed up at <a href="${opts.siteUrl}" style="color:${MUTED};">Everyday AI</a>.<br>
<a href="${opts.unsubscribeUrl}" style="color:${MUTED};">Unsubscribe</a> any time — one click, no hard feelings.
</td></tr>
</table></td></tr></table></body></html>`;

  const text = `${opts.subject}\n\n${opts.body}\n\n—\nYou're receiving this because you signed up at ${opts.siteUrl}\nUnsubscribe: ${opts.unsubscribeUrl}\n`;
  return { html, text };
}

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

async function resend(path: string, payload: unknown, idempotencyKey?: string) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set in Vercel.");
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Resend error ${res.status}: ${body.message ?? "unknown"}`);
  }
  return res.json();
}

export async function sendOne(m: Message) {
  return resend("/emails", { from: fromAddress(), ...m, to: [m.to] });
}

/** Sends up to 100 emails per request. */
export async function sendBatch(messages: Message[], keyPrefix: string) {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ from: fromAddress(), ...m, to: [m.to] }));
    await resend("/emails/batch", chunk, `${keyPrefix}-${i / 100}`);
  }
}
