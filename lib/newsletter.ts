import "server-only";
import { getSql, type Issue } from "@/db";
import { generateIssue } from "@/lib/claude";
import { adminEmail, sendingEnabled, siteUrl } from "@/lib/config";
import { renderEmail, sendBatch, sendOne } from "@/lib/email";

/** Saturday: write a draft (unless one is already waiting) and tell the editor. */
export async function createDraft({ force = false } = {}) {
  const sql = await getSql();
  if (!force) {
    const waiting = (await sql`SELECT id FROM issues WHERE status IN ('draft','approved') LIMIT 1`) as { id: number }[];
    if (waiting.length) return { created: false, id: waiting[0].id, reason: "A draft is already waiting for review." };
  }

  const past = (await sql`SELECT subject FROM issues ORDER BY created_at DESC LIMIT 12`) as { subject: string }[];
  const ideas = (await sql`SELECT id, idea FROM topic_ideas WHERE used_at IS NULL ORDER BY created_at LIMIT 1`) as { id: number; idea: string }[];

  const draft = await generateIssue(past.map((p) => p.subject), ideas.map((i) => i.idea));
  const [row] = (await sql`
    INSERT INTO issues (subject, preheader, body)
    VALUES (${draft.subject}, ${draft.preheader}, ${draft.body})
    RETURNING id`) as { id: number }[];
  if (ideas.length) await sql`UPDATE topic_ideas SET used_at = now() WHERE id = ${ideas[0].id}`;

  const to = adminEmail();
  if (to) {
    const link = `${siteUrl()}/admin/newsletter/${row.id}`;
    await sendOne({
      to,
      subject: `Draft ready to review: ${draft.subject}`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px;">This week's Sunday Edit is drafted and waiting for you.</p>
<p style="font-family:Arial,sans-serif;font-size:15px;"><a href="${link}" style="display:inline-block;background:#0a45df;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold;">Review &amp; approve</a></p>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#555;">Nothing goes out unless you approve it before Sunday morning.</p>`,
      text: `This week's Sunday Edit is drafted: ${link}\nNothing goes out unless you approve it.`,
    }).catch((e) => console.error("Draft notice email failed", e));
  }
  return { created: true, id: row.id };
}

/** A copy to the editor only, marked as a test. */
export async function sendTest(issue: Issue) {
  const to = adminEmail();
  if (!to) throw new Error("Set ADMIN_EMAIL in Vercel to receive test sends.");
  const { html, text } = renderEmail({
    ...issue,
    siteUrl: siteUrl(),
    unsubscribeUrl: `${siteUrl()}/unsubscribe`,
    banner: "Test send — only you received this.",
  });
  await sendOne({ to, subject: `[TEST] ${issue.subject}`, html, text });
}

/** Sunday: send the approved issue to every active subscriber. */
export async function sendApproved() {
  const sql = await getSql();
  // Claim the issue so a retry can never send it twice.
  const claimed = (await sql`
    UPDATE issues SET status = 'sending', updated_at = now()
     WHERE id = (SELECT id FROM issues WHERE status = 'approved' ORDER BY approved_at LIMIT 1)
     RETURNING *`) as Issue[];
  const issue = claimed[0];

  if (!issue) {
    const to = adminEmail();
    if (to) {
      await sendOne({
        to,
        subject: "No Sunday Edit sent this week",
        html: `<p style="font-family:Arial,sans-serif;">Nothing was approved, so nothing went out. <a href="${siteUrl()}/admin/newsletter">Open the newsletter admin</a>.</p>`,
        text: `Nothing was approved, so nothing went out. ${siteUrl()}/admin/newsletter`,
      }).catch(() => {});
    }
    return { sent: 0, reason: "No approved issue." };
  }

  try {
    if (!sendingEnabled()) {
      await sendTest(issue);
      await sql`UPDATE issues SET status = 'sent', sent_at = now(), sent_count = 0,
                send_note = 'Rehearsal: sent to you only (subscriber sending is switched off until your domain is set up).'
                WHERE id = ${issue.id}`;
      return { sent: 0, reason: "Rehearsal only — SENDING_ENABLED is not true." };
    }

    const subs = (await sql`
      SELECT email, unsubscribe_token FROM subscribers WHERE status = 'subscribed' ORDER BY id`) as {
      email: string;
      unsubscribe_token: string;
    }[];
    const base = siteUrl();
    const messages = subs.map((s) => {
      const unsubscribeUrl = `${base}/unsubscribe?token=${s.unsubscribe_token}`;
      const { html, text } = renderEmail({ ...issue, siteUrl: base, unsubscribeUrl });
      return {
        to: s.email,
        subject: issue.subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${base}/api/unsubscribe?token=${s.unsubscribe_token}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });
    await sendBatch(messages, `issue-${issue.id}`);
    await sql`UPDATE issues SET status = 'sent', sent_at = now(), sent_count = ${messages.length},
              send_note = NULL WHERE id = ${issue.id}`;
    return { sent: messages.length };
  } catch (error) {
    const note = error instanceof Error ? error.message : String(error);
    await sql`UPDATE issues SET status = 'failed', send_note = ${note.slice(0, 500)} WHERE id = ${issue.id}`;
    throw error;
  }
}
