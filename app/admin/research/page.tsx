import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getResearchSql, type ResearchFinding, type ResearchRun } from "@/db/research";
import { AdminNav } from "@/components/admin-nav";

export const metadata = { title: "Research", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const AREA: Record<string, string> = {
  tools: "AI tools & features",
  business: "Small business",
  schools: "Schools & education",
  privacy: "Privacy & regulation",
};

const STATUS: Record<string, string> = {
  verified: "Verified",
  partially_verified: "Partially verified",
  unverified: "Unverified",
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default async function ResearchAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");

  let runs: ResearchRun[] = [];
  let findings: ResearchFinding[] = [];
  let error = "";
  try {
    const sql = await getResearchSql();
    runs = (await sql`SELECT * FROM research_runs ORDER BY started_at DESC LIMIT 20`) as ResearchRun[];
    findings = (await sql`
      SELECT * FROM research_findings
       WHERE created_at > now() - interval '30 days'
       ORDER BY CASE verification_status WHEN 'verified' THEN 0 WHEN 'partially_verified' THEN 1 ELSE 2 END,
                created_at DESC
       LIMIT 200`) as ResearchFinding[];
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const verified = findings.filter((f) => f.verification_status === "verified").length;

  return (
    <main className="admin-page shell">
      <AdminNav current="research" />
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Private dashboard</p>
          <h1>Research</h1>
          <p>Weekly AI research, checked against official sources. Nothing here is published or emailed to subscribers.</p>
        </div>
        <div className="admin-summary">
          <strong>{verified}</strong>
          <span>Verified (last 30 days)</span>
        </div>
      </div>

      <div className="admin-callout">
        <strong>Not switched on yet.</strong> Research can&apos;t be run from here yet. The &ldquo;Research now&rdquo;
        button and the Use / Don&apos;t use choices arrive in the next stage. Nothing here feeds the Saturday newsletter.
      </div>
      {error && <p className="form-error admin-error" role="alert">Couldn&apos;t load research: {error}</p>}

      <section className="research-key">
        <h2>How findings are labelled</h2>
        <ul>
          <li><span className="issue-status verified">Verified</span> Confirmed on an official page that was actually opened and read.</li>
          <li><span className="issue-status partially_verified">Partially verified</span> Some parts confirmed; the note says what isn&apos;t, and why.</li>
          <li><span className="issue-status unverified">Unverified</span> Not confirmed. Never treat it as fact.</li>
        </ul>
      </section>

      <section>
        <h2>Findings</h2>
        {findings.length ? (
          <ul className="research-list">
            {findings.map((f) => (
              <li key={f.id}>
                <div className="research-meta">
                  <span className={`issue-status ${f.verification_status}`}>{STATUS[f.verification_status] ?? f.verification_status}</span>
                  <span>{AREA[f.area] ?? f.area}</span>
                  {f.event_date && <span>{fmt(f.event_date)}</span>}
                </div>
                <strong>{f.title}</strong>
                <p>{f.summary}</p>
                {f.verification_note && <p className="research-note">{f.verification_note}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="subscriber-table-wrap admin-empty">No research yet. Findings will appear here once research is switched on.</div>
        )}
      </section>

      {runs.length > 0 && (
        <section>
          <h2>Recent runs</h2>
          <ul className="research-list">
            {runs.map((r) => (
              <li key={r.id}>
                <div className="research-meta">
                  <span>{AREA[r.area] ?? r.area}</span>
                  <span>{fmt(r.started_at)}</span>
                  <span>{r.status}</span>
                  <span>{r.searches_used} searches · {r.pages_opened} pages · ~${Number(r.estimated_cost_usd).toFixed(2)}</span>
                </div>
                {r.unchecked_notes && <p className="research-note">Still unchecked: {r.unchecked_notes}</p>}
                {r.error && <p className="research-note">Error: {r.error}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
