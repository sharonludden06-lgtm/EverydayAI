"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { runNextStep, startRun, stopRun } from "@/app/admin/research/actions";

type Active = {
  id: number;
  areaLabel: string;
  nextLabel: string; // what "Run next step" will do
  stepNumber: number;
  busy: boolean; // a step is running in another request (another tab, or from before a refresh)
  busyUntil: string; // UK time when a cut-off step's lock expires
};

/**
 * Buttons for research runs. Nothing runs on page load: every step starts only when a button is pressed,
 * and each step is a separate short request. Closing or refreshing the page simply pauses the run.
 */
export function ResearchRunner({ areas, active }: { areas: { key: string; label: string }[]; active: Active | null }) {
  const router = useRouter();
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [auto, setAuto] = useState(false);
  const autoRef = useRef(false);

  // Count the seconds while a step runs, so it's clear something is happening.
  useEffect(() => {
    if (!working) return;
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [working]);

  // If a step is running elsewhere, check again every 15 seconds (reading only; nothing is started).
  useEffect(() => {
    if (!active?.busy || working) return;
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [active?.busy, working, router]);

  async function call<T extends { message: string; finished: boolean }>(label: string, fn: () => Promise<T>) {
    setWorking(label);
    setMessage("");
    try {
      const result = await fn();
      // "Already running" is shown by the notice above instead, which clears itself once the step finishes.
      if (!/already running/.test(result.message)) setMessage(result.message);
      return result;
    } catch {
      setMessage(
        "The connection was lost while waiting for the answer. The step may still finish on the server. Refresh this page in a minute or two: it will show what was saved, and Continue picks up from the next unfinished step.",
      );
      autoRef.current = false;
      setAuto(false);
      return null;
    } finally {
      setWorking("");
      router.refresh();
    }
  }

  async function runSteps(id: number, keepGoing: boolean, firstLabel: string) {
    autoRef.current = keepGoing;
    setAuto(keepGoing);
    let label = firstLabel;
    for (let i = 0; i < 12; i++) {
      const result = await call(label, () => runNextStep(id));
      if (!result || result.finished || !autoRef.current || /already running/.test(result.message)) break;
      label = "Next step";
    }
    autoRef.current = false;
    setAuto(false);
  }

  if (!active) {
    return (
      <>
        <p>Choose an area to create a run. Nothing is spent until you then press “Run next step”.</p>
        <div className="research-buttons">
          {areas.map((a) => (
            <button
              key={a.key}
              className="button button-primary small"
              type="button"
              disabled={!!working}
              onClick={() => call(`Creating ${a.label} run`, () => startRun(a.key))}
            >
              {working === `Creating ${a.label} run` ? "Creating…" : a.label}
            </button>
          ))}
        </div>
        {message && <p className="issue-msg research-msg" role="status">{message}</p>}
      </>
    );
  }

  return (
    <>
      {active.busy && !working ? (
        <p className="research-working" role="status">
          A step is running (started in another tab, or before this page was refreshed). This page checks again every 15
          seconds. Nothing new will start until it has finished. If that step was cut off (for example by the server&apos;s
          5-minute limit), Continue becomes available again at {active.busyUntil} and moves on without repeating it.
        </p>
      ) : (
        <p>
          <strong>Next: step {active.stepNumber}.</strong> {active.nextLabel}
        </p>
      )}
      {working && (
        <p className="research-working" role="status">
          {working === "Stopping" ? "Stopping…" : `Running step… ${seconds}s.`} Usually under two minutes. Please keep this page open; if
          it closes, the run just pauses and Continue picks it up.
        </p>
      )}
      <div className="research-buttons">
        <button
          className="button button-primary small"
          type="button"
          disabled={!!working || active.busy}
          onClick={() => runSteps(active.id, false, "Step")}
        >
          {active.stepNumber === 1 ? "Run next step" : "Continue: run next step"}
        </button>
        <button
          className="button button-light small research-secondary"
          type="button"
          disabled={!!working || active.busy}
          onClick={() => runSteps(active.id, true, "Step")}
        >
          Run all remaining steps
        </button>
        {auto && (
          <button className="text-link" type="button" onClick={() => { autoRef.current = false; setAuto(false); }}>
            Pause after this step
          </button>
        )}
        <button
          className="text-link danger"
          type="button"
          disabled={!!working || active.busy}
          onClick={() => {
            if (confirm("Stop this run now? Findings already saved are kept; unchecked candidates are left out.")) {
              call("Stopping", () => stopRun(active.id));
            }
          }}
        >
          Stop and keep findings
        </button>
      </div>
      {message && <p className="issue-msg research-msg" role="status">{message}</p>}
    </>
  );
}
