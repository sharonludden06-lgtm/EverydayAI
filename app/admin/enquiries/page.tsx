import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSql, type Enquiry } from "@/db";
import { isAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin-nav";

export const metadata = { title: "Enquiries", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function setStatus(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["new", "replied", "archived"].includes(status)) return;
  const db = await getSql();
  await db`UPDATE enquiries SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/admin/enquiries");
}

const KIND: Record<string, string> = { school: "School", business: "Business", other: "Other" };

export default async function EnquiriesAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
  const sql = await getSql();
  const rows = (await sql`
    SELECT * FROM enquiries WHERE status <> 'archived' ORDER BY created_at DESC LIMIT 200`) as Enquiry[];
  const fresh = rows.filter((r) => r.status === "new").length;

  return (
    <main className="admin-page shell">
      <AdminNav current="enquiries" />
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Private dashboard</p>
          <h1>Enquiries</h1>
          <p>Messages from the Work with us page. You&apos;re also emailed each one, so you can simply hit reply.</p>
        </div>
        <div className="admin-summary">
          <strong>{fresh}</strong>
          <span>New</span>
        </div>
      </div>
      {rows.length ? (
        <ul className="enquiry-list">
          {rows.map((r) => (
            <li key={r.id} className={r.status}>
              <div className="enquiry-meta">
                <strong>{r.name}</strong>
                {r.organisation && <span>{r.organisation}</span>}
                <span className={`kind ${r.kind}`}>{KIND[r.kind] ?? r.kind}</span>
                <span>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <p>{r.message}</p>
              <div className="enquiry-actions">
                <a className="button button-primary small" href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your enquiry to Everyday AI")}`}>Reply to {r.email}</a>
                <form action={setStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "new" ? "replied" : "new"} />
                  <button className="text-link" type="submit">{r.status === "new" ? "Mark as replied" : "Mark as new"}</button>
                </form>
                <form action={setStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button className="text-link" type="submit">Archive</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="subscriber-table-wrap admin-empty">No enquiries yet. They&apos;ll appear here, and in your inbox, as soon as someone gets in touch.</div>
      )}
    </main>
  );
}
