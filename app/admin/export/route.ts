import { getSql, type Subscriber } from "@/db";
import { isAdmin } from "@/lib/admin-auth";
import { ukIsoDate, UK_TIME_ZONE } from "@/lib/uk-time";

export const dynamic = "force-dynamic";

const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

// e.g. "2026-09-29 10:00:09" in UK local time (GMT or BST, whichever applied on that date).
const ukLocal = (d: string) =>
  new Date(d).toLocaleString("sv-SE", { timeZone: UK_TIME_ZONE }).replace("T", " ");

export async function GET() {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const sql = await getSql();
  const rows = (await sql`
    SELECT email, first_name, source, status, created_at
      FROM subscribers ORDER BY created_at`) as Subscriber[];
  const csv = [
    "email,first_name,source,status,joined_utc,joined_uk_local_time",
    ...rows.map((r) =>
      [r.email, r.first_name, r.source, r.status, new Date(r.created_at).toISOString(), ukLocal(r.created_at)].map(cell).join(","),
    ),
  ].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${ukIsoDate()}.csv"`,
    },
  });
}
