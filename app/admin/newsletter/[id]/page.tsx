import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSql, type Issue } from "@/db";
import { isAdmin } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/config";
import { renderEmail } from "@/lib/email";
import { sendTest } from "@/lib/newsletter";
import { AdminNav, IssueStatus } from "@/components/admin-nav";
import { PendingButton } from "@/components/pending-button";

export const metadata = { title: "Edit issue", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function loadIssue(id: number) {
  const db = await getSql();
  const rows = (await db`SELECT * FROM issues WHERE id = ${id}`) as Issue[];
  return rows[0] ?? null;
}

const editable = (s: string) => s === "draft" || s === "approved" || s === "failed";

async function save(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  const intent = String(formData.get("intent"));
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 150);
  const preheader = String(formData.get("preheader") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim();
  const issue = await loadIssue(id);
  if (!issue || !editable(issue.status)) redirect(`/admin/newsletter/${id}`);
  if (!subject || !body) redirect(`/admin/newsletter/${id}?msg=${encodeURIComponent("Subject and body can't be empty.")}`);

  const sql = await getSql();
  await sql`UPDATE issues SET subject = ${subject}, preheader = ${preheader}, body = ${body}, updated_at = now() WHERE id = ${id}`;

  let msg = "Saved.";
  if (intent === "approve") {
    // Only one issue can be queued for Sunday at a time.
    await sql`UPDATE issues SET status = 'draft', approved_at = NULL WHERE status = 'approved' AND id <> ${id}`;
    await sql`UPDATE issues SET status = 'approved', approved_at = now(), send_note = NULL WHERE id = ${id}`;
    msg = "Approved — it will go out on Sunday morning.";
  } else if (intent === "unapprove") {
    await sql`UPDATE issues SET status = 'draft', approved_at = NULL WHERE id = ${id}`;
    msg = "Moved back to draft. It won't be sent unless you approve it again.";
  } else if (intent === "test") {
    try {
      await sendTest({ ...issue, subject, preheader, body });
      msg = "Test sent to your email.";
    } catch (e) {
      msg = `Test failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  revalidatePath(`/admin/newsletter/${id}`);
  redirect(`/admin/newsletter/${id}?msg=${encodeURIComponent(msg)}`);
}

async function remove(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  const db = await getSql();
  await db`DELETE FROM issues WHERE id = ${id} AND status IN ('draft','failed')`;
  redirect("/admin/newsletter");
}

export default async function EditIssue({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { msg } = await searchParams;
  const issue = await loadIssue(Number(id));
  if (!issue) notFound();
  const canEdit = editable(issue.status);
  const preview = renderEmail({ ...issue, siteUrl: siteUrl(), unsubscribeUrl: "#" }).html;

  return (
    <main className="admin-page shell">
      <AdminNav current="newsletter" />
      <p className="back-link"><Link href="/admin/newsletter">← All issues</Link></p>
      <div className="issue-head">
        <IssueStatus status={issue.status} />
        {issue.send_note && <p className="issue-note">{issue.send_note}</p>}
        {msg && <p className="issue-msg" role="status">{msg}</p>}
      </div>

      <div className="issue-editor">
        <form action={save} className="issue-form">
          <input type="hidden" name="id" value={issue.id} />
          <label>
            <span>Subject line</span>
            <input name="subject" defaultValue={issue.subject} maxLength={150} required disabled={!canEdit} />
          </label>
          <label>
            <span>Preview text <small>(the grey line after the subject in the inbox)</small></span>
            <input name="preheader" defaultValue={issue.preheader} maxLength={200} disabled={!canEdit} />
          </label>
          <label>
            <span>Email body <small>(## for headings, **bold**, &gt; for prompt boxes, 1. for steps)</small></span>
            <textarea name="body" defaultValue={issue.body} rows={28} required disabled={!canEdit} />
          </label>
          {canEdit ? (
            <div className="issue-actions">
              <PendingButton className="button button-light-outline" name="intent" value="save" pendingText="Saving…">Save changes</PendingButton>
              <PendingButton className="button button-light-outline" name="intent" value="test" pendingText="Sending test…">Save &amp; email me a test</PendingButton>
              {issue.status === "approved" ? (
                <PendingButton className="button button-light-outline" name="intent" value="unapprove" pendingText="Updating…">Un-approve</PendingButton>
              ) : (
                <PendingButton className="button button-primary" name="intent" value="approve" pendingText="Approving…">Save &amp; approve for Sunday</PendingButton>
              )}
            </div>
          ) : (
            <p className="issue-note">This issue has been sent, so it can no longer be edited.</p>
          )}
        </form>
        {issue.status !== "sent" && issue.status !== "sending" && issue.status !== "approved" && (
          <form action={remove} className="delete-form">
            <input type="hidden" name="id" value={issue.id} />
            <button type="submit" className="text-link danger">Delete this draft</button>
          </form>
        )}

        <section className="issue-preview">
          <h2>Preview <small>(last saved version)</small></h2>
          <iframe title="Email preview" srcDoc={preview} sandbox="" />
        </section>
      </div>
    </main>
  );
}
