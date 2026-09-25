import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSql, type Issue, type TopicIdea } from "@/db";
import { isAdmin } from "@/lib/admin-auth";
import { adminEmail, sendingEnabled } from "@/lib/config";
import { createDraft } from "@/lib/newsletter";
import { AdminNav, IssueStatus } from "@/components/admin-nav";
import { PendingButton } from "@/components/pending-button";

export const metadata = { title: "Newsletter", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function generateNow() {
  "use server";
  await requireAdmin();
  let target = "/admin/newsletter";
  try {
    const result = await createDraft({ force: true });
    target = `/admin/newsletter/${result.id}`;
  } catch (e) {
    target = `/admin/newsletter?error=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`;
  }
  redirect(target);
}

async function addIdea(formData: FormData) {
  "use server";
  await requireAdmin();
  const idea = String(formData.get("idea") ?? "").trim().slice(0, 300);
  const db = await getSql();
  if (idea) await db`INSERT INTO topic_ideas (idea) VALUES (${idea})`;
  revalidatePath("/admin/newsletter");
}

async function removeIdea(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  const db = await getSql();
  await db`DELETE FROM topic_ideas WHERE id = ${id}`;
  revalidatePath("/admin/newsletter");
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—";

export default async function NewsletterAdmin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const sql = await getSql();
  const issues = (await sql`
    SELECT id, subject, status, created_at, sent_at, sent_count FROM issues
    ORDER BY created_at DESC LIMIT 50`) as Issue[];
  const ideas = (await sql`SELECT * FROM topic_ideas WHERE used_at IS NULL ORDER BY created_at`) as TopicIdea[];
  const live = sendingEnabled();

  return (
    <main className="admin-page shell">
      <AdminNav current="newsletter" />
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Private dashboard</p>
          <h1>The Sunday Edit</h1>
          <p>A draft is written every Saturday morning. Approve it and it goes out on Sunday at about 8am.</p>
        </div>
      </div>

      <div className={`admin-callout ${live ? "live" : ""}`}>
        {live ? (
          <><strong>Live:</strong> approved issues go to all active subscribers on Sunday.</>
        ) : (
          <><strong>Rehearsal mode:</strong> on Sunday the approved issue is sent to you only
          {adminEmail() ? "" : " (set ADMIN_EMAIL in Vercel)"}. Subscribers get it once your domain is set up and SENDING_ENABLED is switched on.</>
        )}
      </div>
      {error && <p className="form-error admin-error" role="alert">{error}</p>}

      <div className="newsletter-admin-grid">
        <section>
          <div className="section-bar">
            <h2>Issues</h2>
            <form action={generateNow}>
              <PendingButton className="button button-primary small" pendingText="Writing… (about a minute)">Write a draft now</PendingButton>
            </form>
          </div>
          {issues.length ? (
            <ul className="issue-list">
              {issues.map((i) => (
                <li key={i.id}>
                  <Link href={`/admin/newsletter/${i.id}`}>
                    <strong>{i.subject}</strong>
                    <span>
                      Written {fmt(i.created_at)}
                      {i.sent_at ? ` · sent ${fmt(i.sent_at)} to ${i.sent_count}` : ""}
                    </span>
                  </Link>
                  <IssueStatus status={i.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="subscriber-table-wrap admin-empty">
              No issues yet. The first draft arrives Saturday morning, or click “Write a draft now”. It takes about a minute.
            </div>
          )}
        </section>

        <aside className="idea-box">
          <h2>Ideas for upcoming issues</h2>
          <p>Add a theme and the next draft will be built around it. Leave empty and Claude picks one.</p>
          <form action={addIdea} className="idea-form">
            <input name="idea" placeholder="e.g. Using AI to plan half-term" maxLength={300} required />
            <button className="button button-primary small" type="submit">Add</button>
          </form>
          {ideas.length > 0 && (
            <ol className="idea-list">
              {ideas.map((idea) => (
                <li key={idea.id}>
                  <span>{idea.idea}</span>
                  <form action={removeIdea}>
                    <input type="hidden" name="id" value={idea.id} />
                    <button type="submit" aria-label="Remove idea">×</button>
                  </form>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </main>
  );
}
