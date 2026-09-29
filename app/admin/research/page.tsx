import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin-auth";
import { getResearchSql, type ResearchFinding, type ResearchRun } from "@/db/research";
import { AREAS, isArea, markAbandonedRuns, MAX_PAGES, MAX_SEARCHES, runResearch, WEEKLY_CAP_USD } from "@/lib/research";
import { calendarDate, ukDateTime } from "@/lib/uk-time";
import { AdminNav } from "@/components/admin-nav";
import { PendingButton } from "@/components/pending-button";

export const metadata = { title: "Research", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function research(formData: FormData) {
  "use server";
  await requireAdmin();
  const area = String(formData.get("intent") ?? "");
  let msg = "Unknown research area.";
  if (isArea(area)) {
    try {
      msg = (await runResearch(area)).message;
    } catch (e) {
      msg = `Research couldn't start: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  redirect(`/admin/research?msg=${encodeURIComponent(msg)}`);
}

async function decide(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("intent"));
  if (!["use", "dont_use", "undecided"].includes(decision)) return;
  const sql = await getResearchSql();
  await sql`UPDATE research_findings SET decision = ${decision},
              decided_at = ${decision === "undecided" ? null : new Date()} WHERE id = ${id}`;
  revalidatePath("/admin/research");
}

async function deleteRun(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  const sql = await getResearchSql();
  await sql`DELETE FROM research_runs WHERE id = ${id} AND status <> 'running'`; // findings go with it
  redirect(`/admin/research?msg=${encodeURIComponent("Run deleted.")}`);
}

const STATUS: Record<string, string> = {
  verified: "Verified",
  partially_verified: "Partially verified",
  unverified: "Unverified",
};

const RUN_STATUS: Record<string, string> = {
  running: "Running…",
  complete: "Complete",
  partial: "Partial",
  failed: "Failed",
  stopped_limit: "Stopped at a limit",
  interrupted: "Interrupted",
};

const ENV: Record<string, string> = { live: "Live", preview: "Preview", local: "Local test", unknown: "Unknown" };

const DECISION: Record<string, string> = { use: "Marked: Use", dont_use: "Marked: Don't use", undecided: "" };

function Detail({ label, value }: { label: string; value: string }) {
  return value ? (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  ) : null;
}

export default async function ResearchAdmin({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const { msg } = await searchParams;

  let runs: ResearchRun[] = [];
  let findings: ResearchFinding[] = [];
  let spent = 0;
  let error = "";
  try {
    const sql = await getResearchSql();
    await markAbandonedRuns(); // a run the server stopped can't stay "Running"
    runs = (await sql`SELECT * FROM research_runs ORDER BY started_at DESC LIMIT 20`) as ResearchRun[];
    findings = (await sql`
      SELECT * FROM research_findings
       WHERE created_at > now() - interval '30 days'
       ORDER BY CASE verification_status WHEN 'verified' THEN 0 WHEN 'partially_verified' THEN 1 ELSE 2 END,
                created_at DESC
       LIMIT 200`) as ResearchFinding[];
    const [row] = (await sql`
      SELECT COALESCE(SUM(estimated_cost_usd), 0)::float AS spent FROM research_runs
       WHERE started_at > now() - interval '7 days'`) as { spent: number }[];
    spent = Number(row?.spent ?? 0);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const verified = findings.filter((f) => f.verification_status === "verified").length;
  const runEnv = new Map(runs.map((r) => [r.id, r.environment]));

  return (
    <main className="admin-page shell">
      <AdminNav current="research" />
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Private dashboard</p>
          <h1>Research</h1>
          <p>AI research, checked against official sources. Nothing here is published or emailed to subscribers. Times are UK time.</p>
        </div>
        <div className="admin-summary">
          <strong>{verified}</strong>
          <span>Verified (last 30 days)</span>
        </div>
      </div>

      <div className="admin-callout">
        Research runs only when you click a button below. Each run covers one area, looks at the last 7 days, and uses at
        most {MAX_SEARCHES} searches and {MAX_PAGES} page reads. This week: <strong>${spent.toFixed(2)}</strong> of the $
        {WEEKLY_CAP_USD.toFixed(2)} research budget used. Nothing here feeds the Saturday newsletter yet.
      </div>
      {msg && <p className="issue-msg" role="status">{msg}</p>}
      {error && <p className="form-error admin-error" role="alert">Couldn&apos;t load research: {error}</p>}

      <section className="research-run-box">
        <h2>Research now</h2>
        <p>Takes up to about four minutes. Please keep this page open until it finishes.</p>
        <form action={research} className="research-buttons">
          {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((area) => (
            <PendingButton key={area} className="button button-primary small" name="intent" value={area} pendingText="Researching…">
              {AREAS[area].label}
            </PendingButton>
          ))}
        </form>
      </section>

      <section className="research-key">
        <h2>How findings are labelled</h2>
        <ul>
          <li><span className="issue-status verified">Verified</span> Confirmed on an official page that was actually opened and read (checked automatically).</li>
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
                  <span>{AREAS[f.area as keyof typeof AREAS]?.label ?? f.area}</span>
                  {f.event_date && <span>{calendarDate(f.event_date)}</span>}
                  <span>{ENV[runEnv.get(f.run_id) ?? "unknown"] ?? ""} run</span>
                  {DECISION[f.decision] && <span className="decision-tag">{DECISION[f.decision]}</span>}
                </div>
                <strong className="research-title">{f.title}</strong>
                <p>{f.summary}</p>
                <details>
                  <summary>Details and sources</summary>
                  <Detail label="Why it matters" value={f.why_it_matters} />
                  <Detail label="Who could benefit" value={f.who_benefits} />
                  <Detail label="Example" value={f.example} />
                  <Detail label="Rollout status" value={f.rollout_status} />
                  <Detail label="Eligible plans/users" value={f.eligible} />
                  <Detail label="UK availability" value={f.uk_availability} />
                  <Detail label="Pricing" value={f.pricing} />
                  <Detail label="Privacy" value={f.privacy} />
                  <Detail label="Conflicting sources" value={f.conflicts} />
                  <ul className="research-sources">
                    {(Array.isArray(f.sources) ? f.sources : []).map((s, i) => (
                      <li key={i}>
                        <span className={s.opened ? "opened" : "not-opened"}>{s.opened ? "Opened ✓" : "Not opened"}</span>{" "}
                        <span className="source-type">{s.type}</span>{" "}
                        {/^https?:\/\//.test(s.url) ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.title || s.url}</a>
                        ) : (
                          s.title || s.url
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
                {f.verification_note && <p className="research-note">{f.verification_note}</p>}
                <form action={decide} className="research-decision">
                  <input type="hidden" name="id" value={f.id} />
                  <button className="text-link" type="submit" name="intent" value="use" disabled={f.decision === "use"}>Use</button>
                  <button className="text-link" type="submit" name="intent" value="dont_use" disabled={f.decision === "dont_use"}>Don&apos;t use</button>
                  {f.decision !== "undecided" && (
                    <button className="text-link" type="submit" name="intent" value="undecided">Clear</button>
                  )}
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="subscriber-table-wrap admin-empty">No research yet. Choose an area above to run the first one.</div>
        )}
      </section>

      {runs.length > 0 && (
        <section>
          <h2>Recent runs</h2>
          <ul className="research-list">
            {runs.map((r) => (
              <li key={r.id}>
                <div className="research-meta">
                  <span className={`env-tag ${r.environment}`}>{ENV[r.environment] ?? r.environment}</span>
                  <span>{AREAS[r.area as keyof typeof AREAS]?.label ?? r.area}</span>
                  <span>{ukDateTime(r.started_at)}</span>
                  <span>
                    {RUN_STATUS[r.status] ?? r.status}
                    {r.status === "running" && r.last_activity_at ? ` (last activity ${ukDateTime(r.last_activity_at).split(", ").pop()})` : ""}
                  </span>
                  <span>
                    {r.searches_used} searches · {r.pages_opened} pages opened · ~${Number(r.estimated_cost_usd).toFixed(2)}
                  </span>
                </div>
                {r.unchecked_notes && <p className="research-note">Still unchecked: {r.unchecked_notes}</p>}
                {r.error && <p className="research-note">Problem: {r.error}</p>}
                {r.status !== "running" && (
                  <form action={deleteRun}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-link danger" type="submit">Delete this run and its findings</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
