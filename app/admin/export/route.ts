import { getSql, type Subscriber } from "@/db";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET() {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const sql = await getSql();
  const rows = (await sql`
    SELECT email, first_name, source, status, created_at
      FROM subscribers ORDER BY created_at`) as Subscriber[];
  const csv = [
    "email,first_name,source,status,joined",
    ...rows.map((r) =>
      [r.email, r.first_name, r.source, r.status, new Date(r.created_at).toISOString()].map(cell).join(","),
    ),
  ].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
