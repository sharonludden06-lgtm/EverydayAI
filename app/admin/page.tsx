import { redirect } from "next/navigation";
import { getSql, type Subscriber } from "@/db";
import { endAdminSession, isAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Newsletter subscribers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  await endAdminSession();
  redirect("/admin/login");
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const records = (await getSql()`
    SELECT id, email, first_name, source, status, created_at
      FROM subscribers
     ORDER BY created_at DESC`) as Subscriber[];
  const active = records.filter((r) => r.status === "subscribed").length;

  return (
    <main className="admin-page shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Private dashboard</p>
          <h1>Newsletter subscribers</h1>
          <p>Everyone who has signed up through the website.</p>
          <div className="admin-actions">
            <a className="text-link" href="/admin/export">Download CSV</a>
            <form action={signOut}><button className="text-link" type="submit">Sign out</button></form>
          </div>
        </div>
        <div className="admin-summary">
          <strong>{active}</strong>
          <span>Active subscribers</span>
        </div>
      </div>

      {records.length ? (
        <div className="subscriber-table-wrap">
          <table className="subscriber-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email address</th>
                <th>Joined</th>
                <th>Signed up from</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.first_name || "—"}</td>
                  <td>{r.email}</td>
                  <td>
                    {new Date(r.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>{r.source}</td>
                  <td>
                    <span className={`subscriber-status ${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="subscriber-table-wrap admin-empty">
          No subscribers yet. New signups will appear here automatically.
        </div>
      )}
    </main>
  );
}
