import "server-only";
import { randomUUID } from "node:crypto";
import { getResearchSql, type ResearchArea, type ResearchRun, type ResearchWeek } from "@/db/research";
import {
  advanceResearchRun,
  AREAS,
  MIN_STEP_TIME_MS,
  MONTHLY_CAP_USD,
  researchEnvironment,
  researchSpending,
  researchWeekStart,
  startResearchRun,
  stopResearchRun,
  WEEKLY_CAP_USD,
  type LimitReason,
} from "@/lib/research";
import { adminEmail, siteUrl } from "@/lib/config";
import { sendOne } from "@/lib/email";
import { ukIsoDate, ukLongDate } from "@/lib/uk-time";

// Stage 4: Friday research. Six Friday jobs an hour apart (see vercel.json) each carry on from the next unfinished
// step, using the same resumable runs as the Research page. Nothing here touches the newsletter.

export const FRIDAY_AREAS: ResearchArea[] = ["tools", "business", "schools", "privacy"];
export const FRIDAY_JOBS = 6; // the sixth is the last: it sends the summary even if something didn't finish
const JOB_TIME_MS = 240_000; // work stops well before Vercel's 300-second limit
const JOB_LOCK_SECONDS = 330; // longer than any job can live, so an overlapping job never runs alongside it
const MAX_ROUNDS_PER_JOB = 30; // a backstop only: time is the real limit

const LIMIT_TEXT: Record<LimitReason, string> = {
  weekly_cap: `the research-week budget ($${WEEKLY_CAP_USD.toFixed(2)}, Friday to Thursday) was reached`,
  monthly_cap: `the monthly research safety limit ($${MONTHLY_CAP_USD.toFixed(2)}) was reached`,
  spend_limit: "the Anthropic research workspace's own spend limit was reached",
};

// ---------------------------------------------------------------------------------------------------------
// The on/off switch: one per environment, so switching it in one place can never switch it elsewhere.

const switchKey = () => `friday_enabled:${researchEnvironment()}`;

export async function fridayEnabled() {
  const sql = await getResearchSql();
  const [row] = (await sql`SELECT value FROM research_settings WHERE key = ${switchKey()}`) as { value: string }[];
  return row?.value === "true";
}

/** Preview shares the live database, so the switch can only be changed on the live site (or locally). */
export function canChangeSwitch() {
  return researchEnvironment() !== "preview";
}

export async function setFridayEnabled(on: boolean) {
  if (!canChangeSwitch()) throw new Error("Friday research can only be switched on or off on the live site.");
  const sql = await getResearchSql();
  await sql`
    INSERT INTO research_settings (key, value, updated_at) VALUES (${switchKey()}, ${on ? "true" : "false"}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}

// ---------------------------------------------------------------------------------------------------------
// This research week's Friday runs

/** The latest scheduled run for each area this research week (in this environment), or null if not started. */
export async function fridayAreaRuns(week = researchWeekStart()) {
  const sql = await getResearchSql();
  const runs = (await sql`
    SELECT * FROM research_runs
     WHERE trigger = 'scheduled' AND environment = ${researchEnvironment()}
       AND started_at >= (${week}::date::timestamp AT TIME ZONE 'Europe/London')
     ORDER BY started_at DESC`) as ResearchRun[];
  const byArea = {} as Record<ResearchArea, ResearchRun | null>;
  for (const area of FRIDAY_AREAS) byArea[area] = runs.find((r) => r.area === area) ?? null;
  return byArea;
}

export async function fridayWeek(week = researchWeekStart()): Promise<ResearchWeek | null> {
  const sql = await getResearchSql();
  const [row] = (await sql`
    SELECT * FROM research_weeks WHERE week_start = ${week} AND environment = ${researchEnvironment()}`) as ResearchWeek[];
  return row ?? null;
}

const lockedNow = (until: string | Date | null) => !!until && new Date(until).getTime() > Date.now();

async function stopWeek(week: string, reason: LimitReason, note: string) {
  const sql = await getResearchSql();
  await sql`
    UPDATE research_weeks SET stop_reason = ${reason}, stop_note = ${note}
     WHERE week_start = ${week} AND environment = ${researchEnvironment()} AND stop_reason IS NULL`;
}

// ---------------------------------------------------------------------------------------------------------
// One Friday job

/**
 * One Friday job: carries on from the next unfinished step, starting the next area when one finishes, until its
 * time is nearly up. Every step still goes through the research page's checks (limits before each step, a step lock,
 * no repeats, no retries). Only one job can work at a time; an overlapping job does nothing.
 *
 * `test` (the Research page's test button): runs regardless of the switch or the day, and stops after finishing
 * one area, so a Preview test can be watched area by area.
 */
export async function runFridayJob({ job, test = false }: { job: number | null; test?: boolean }) {
  const deadline = Date.now() + JOB_TIME_MS;
  const env = researchEnvironment();
  const log: string[] = [];

  if (!test) {
    if (!(await fridayEnabled())) return { message: "Friday research is switched off, so nothing was done." };
    const today = new Date(`${ukIsoDate()}T00:00:00Z`).getUTCDay();
    if (today !== 5) return { message: "It isn't Friday in the UK, so nothing was done." };
  }

  const sql = await getResearchSql();
  const week = researchWeekStart();
  await sql`INSERT INTO research_weeks (week_start, environment) VALUES (${week}, ${env}) ON CONFLICT DO NOTHING`;
  const lock = randomUUID();
  const [row] = (await sql`
    UPDATE research_weeks
       SET job_lock_id = ${lock}, job_lock_until = now() + make_interval(secs => ${JOB_LOCK_SECONDS}),
           jobs_run = jobs_run + 1, first_job_at = COALESCE(first_job_at, now()), last_job_at = now()
     WHERE week_start = ${week} AND environment = ${env}
       AND (job_lock_until IS NULL OR job_lock_until < now())
     RETURNING *`) as ResearchWeek[];
  if (!row) {
    // Job times can drift within the hour, so two jobs can overlap. Only one works; an overlapping job does nothing,
    // except the last one, which waits for the other to finish so the summary is still sent.
    if (job !== FRIDAY_JOBS) return { message: "Another Friday job is still working, so this one did nothing." };
    for (let i = 0; i < 26 && lockedNow((await fridayWeek(week))?.job_lock_until ?? null); i++) await new Promise((r) => setTimeout(r, 10_000));
    const summary = await maybeSendSummary(week, { final: true });
    return { message: `The previous Friday job was still working, so this one only checked the summary. ${summary}`.trim() };
  }

  try {
    if (row.stop_reason) {
      log.push(`Nothing more this week: ${LIMIT_TEXT[row.stop_reason as LimitReason] ?? row.stop_reason}.`);
    } else {
      await work(week, deadline, test, log);
    }
    const summary = await maybeSendSummary(week, { final: job === FRIDAY_JOBS });
    if (summary) log.push(summary);
  } catch (error) {
    // Nothing is retried here: the next job simply carries on from the next unfinished step.
    log.push(`Stopped by an unexpected problem: ${error instanceof Error ? error.message.slice(0, 300) : String(error)}`);
  } finally {
    const note = `${test ? "Test job" : `Job ${job ?? "?"}`}: ${log.join(" ")}`.slice(0, 2000);
    await sql`
      UPDATE research_weeks SET job_lock_id = NULL, job_lock_until = NULL, last_job_note = ${note}
       WHERE week_start = ${week} AND environment = ${env} AND job_lock_id = ${lock}`.catch(() => {});
  }
  return { message: log.join(" ") || "Nothing to do." };
}

async function work(week: string, deadline: number, test: boolean, log: string[]) {
  const sql = await getResearchSql();
  const env = researchEnvironment();
  for (let round = 0; round < MAX_ROUNDS_PER_JOB; round++) {
    if (deadline - Date.now() < MIN_STEP_TIME_MS) {
      log.push("Out of time for this job; the next one carries on.");
      return;
    }
    const [open] = (await sql`SELECT * FROM research_runs WHERE status = 'running' ORDER BY started_at LIMIT 1`) as ResearchRun[];

    if (open) {
      const ours = open.trigger === "scheduled" && open.environment === env && !!open.plan;
      if (!ours) {
        // A paused manual (or other) run is stopped, keeping its findings. One with a step actually running is left alone.
        if (!open.plan || lockedNow(open.step_lock_until)) {
          log.push("Another research run has a step in progress, so this job waited; the next one will try again.");
          return;
        }
        const stopped = await stopResearchRun(open.id, "scheduled");
        log.push(`Stopped an open ${AREAS[open.area]?.label ?? open.area} run first (findings kept): ${stopped.message}`);
        continue;
      }
      const label = AREAS[open.area]?.label ?? open.area;
      // Only runs this Friday research started get the "try again next job" protection.
      const result = await advanceResearchRun(open.id, { deadline, retryLater: true });
      log.push(`${label}: ${result.message}`);
      if (result.limit) {
        await stopWeek(week, result.limit, result.message);
        return;
      }
      if (result.noTime || result.busy) return;
      if (result.postponed) return; // never tried again within the same job
      if (result.finished && test) return; // the test button does one area at a time
      continue;
    }

    const runs = await fridayAreaRuns(week);
    const next = FRIDAY_AREAS.find((a) => !runs[a]);
    if (!next) {
      log.push("All four areas are done for this week.");
      return;
    }
    const started = await startResearchRun(next, { scheduled: true });
    if (started.limit) {
      await stopWeek(week, started.limit, started.message);
      log.push(`${AREAS[next].label}: ${started.message}`);
      return;
    }
    if (!started.created) {
      log.push(`${AREAS[next].label}: ${started.message}`);
      return;
    }
    log.push(`${AREAS[next].label}: run started.`);
  }
  log.push("This job has done its share; the next one carries on.");
}

// ---------------------------------------------------------------------------------------------------------
// The summary email (once per research week and environment)

/**
 * Sends the summary when every area has finished, when a limit stopped the week, or on the last Friday job
 * (saying what didn't finish). `force` is the Research page's "send now" button. Never sends twice: the first
 * caller claims the week in the database before sending.
 */
export async function maybeSendSummary(week: string, { final = false, force = false } = {}) {
  const sql = await getResearchSql();
  const env = researchEnvironment();
  const runs = await fridayAreaRuns(week);
  const weekRow = await fridayWeek(week);
  const allDone = FRIDAY_AREAS.every((a) => runs[a] && runs[a]!.status !== "running");
  if (!(allDone || weekRow?.stop_reason || final || force)) return "";

  await sql`INSERT INTO research_weeks (week_start, environment) VALUES (${week}, ${env}) ON CONFLICT DO NOTHING`;
  const [claimed] = (await sql`
    UPDATE research_weeks SET summary_sent_at = now(), summary_error = NULL
     WHERE week_start = ${week} AND environment = ${env} AND summary_sent_at IS NULL
     RETURNING week_start`) as { week_start: string }[];
  if (!claimed) return force ? "This week's summary has already been sent." : "";

  try {
    const to = adminEmail();
    if (!to) throw new Error("ADMIN_EMAIL is not set in Vercel, so there's nowhere to send the summary.");
    const email = await buildSummary(week, runs, weekRow);
    await sendOne({ to, subject: email.subject, html: email.html, text: email.text });
    return `Summary email sent to the admin address.`;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : String(error);
    // Release the claim so a later job (or the "send now" button) can try again; email costs nothing.
    await sql`
      UPDATE research_weeks SET summary_sent_at = NULL, summary_error = ${message}
       WHERE week_start = ${week} AND environment = ${env}`;
    return `The summary email couldn't be sent: ${message}`;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const RUN_STATUS: Record<string, string> = {
  running: "Not finished (paused)",
  complete: "Complete",
  partial: "Partly complete",
  failed: "Failed",
  stopped_limit: "Stopped at a limit",
  interrupted: "Interrupted",
};

async function buildSummary(week: string, runs: Record<ResearchArea, ResearchRun | null>, weekRow: ResearchWeek | null) {
  const sql = await getResearchSql();
  const ids = FRIDAY_AREAS.map((a) => runs[a]?.id).filter((id): id is number => !!id);
  const findings = ids.length
    ? ((await sql`
        SELECT run_id, title, verification_status FROM research_findings WHERE run_id IN ${sql(ids)} ORDER BY id`) as {
        run_id: number;
        title: string;
        verification_status: string;
      }[])
    : [];
  const spend = await researchSpending();
  const verifiedTotal = findings.filter((f) => f.verification_status === "verified").length;
  const preview = researchEnvironment() === "preview" ? "[Preview] " : researchEnvironment() === "local" ? "[Local test] " : "";
  const subject = `${preview}Friday research: ${verifiedTotal} verified finding${verifiedTotal === 1 ? "" : "s"} ready for review`;
  const weekLabel = new Date(`${week}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  const blocks: { heading: string; lines: string[] }[] = FRIDAY_AREAS.map((area) => {
    const run = runs[area];
    const label = AREAS[area].label;
    if (!run) {
      const why = weekRow?.stop_reason ? ` (${LIMIT_TEXT[weekRow.stop_reason as LimitReason] ?? weekRow.stop_reason})` : "";
      return { heading: label, lines: [`Not started${why}.`] };
    }
    const mine = findings.filter((f) => f.run_id === run.id);
    const count = (s: string) => mine.filter((f) => f.verification_status === s).length;
    const lines = [
      `${RUN_STATUS[run.status] ?? run.status}: ${count("verified")} verified, ${count("partially_verified")} partially verified, ${count("unverified")} unverified (~$${Number(run.estimated_cost_usd).toFixed(2)}).`,
      ...mine.filter((f) => f.verification_status === "verified").map((f) => `Verified: ${f.title}`),
    ];
    const notChecked = (run.plan?.candidates ?? []).filter((c) => ["failed", "cut_off", "skipped", "pending", "in_progress"].includes(c.status));
    for (const c of notChecked) lines.push(`Not checked: ${c.title}${c.note ? ` (${c.note.replace(/^Not checked: /, "")})` : ""}`);
    if (run.error) lines.push(`Problem: ${run.error}`);
    if (run.status === "running") {
      lines.push("Not finished: press Continue on the Research page to carry on (unfinished runs close automatically after 24 hours).");
    }
    return { heading: label, lines };
  });

  const footer = [
    `Spending (estimates): this research week $${spend.week.toFixed(2)} of $${WEEKLY_CAP_USD.toFixed(2)}; this month $${spend.month.toFixed(2)} of $${MONTHLY_CAP_USD.toFixed(2)}. The Anthropic Console shows the exact figures.`,
    ...(weekRow?.stop_reason ? [`Friday research stopped early this week because ${LIMIT_TEXT[weekRow.stop_reason as LimitReason] ?? weekRow.stop_reason}.`] : []),
    `Review the findings and mark them Use or Don't use: ${siteUrl()}/admin/research`,
    "Nothing has been sent to subscribers, and nothing has been added to the newsletter.",
  ];
  const intro = `Friday research for the week starting ${weekLabel}. Sent ${ukLongDate()}.`;

  const text = [subject, "", intro, "", ...blocks.flatMap((b) => [b.heading, ...b.lines.map((l) => `- ${l}`), ""]), ...footer].join("\n");
  const html = `<!doctype html><html lang="en-GB"><body style="margin:0;padding:24px;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#243242;">
<div style="max-width:600px;margin:auto;background:#fffefa;border:1px solid #e3e5e8;border-radius:12px;padding:24px 28px;">
<p style="font-size:11px;letter-spacing:2px;color:#0a45df;font-weight:700;margin:0 0 8px;">EVERYDAY AI · RESEARCH</p>
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;color:#071526;margin:0 0 12px;">${esc(subject)}</h1>
<p style="font-size:15px;line-height:1.6;">${esc(intro)}</p>
${blocks
  .map(
    (b) => `<h2 style="font-family:Georgia,serif;font-weight:400;font-size:19px;color:#071526;margin:20px 0 6px;">${esc(b.heading)}</h2>
<ul style="margin:0 0 8px;padding-left:20px;font-size:14px;line-height:1.6;">${b.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`,
  )
  .join("\n")}
${footer.map((l) => `<p style="font-size:13px;line-height:1.6;color:#4a5563;margin:12px 0 0;">${esc(l)}</p>`).join("\n")}
</div></body></html>`;
  return { subject, html, text };
}
