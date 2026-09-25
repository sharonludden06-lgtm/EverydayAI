"use client";
import { FormEvent, useState } from "react";
import { Check } from "lucide-react";

export function EnquiryForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return setState("done");
    const body = await res.json().catch(() => ({}));
    setError(body.error || "Something went wrong. Please try again.");
    setState("error");
  }

  if (state === "done") {
    return (
      <div className="form-success enquiry-done" role="status">
        <Check />
        <div>
          <strong>Thank you — that&apos;s with us.</strong>
          <span>We&apos;ll reply personally, usually within two working days, to arrange your free consultation.</span>
        </div>
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="enquiry-row">
        <label><span>Your name</span><input name="name" required autoComplete="name" /></label>
        <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
      </div>
      <div className="enquiry-row">
        <label><span>School or business name</span><input name="organisation" autoComplete="organization" /></label>
        <label>
          <span>I&apos;m enquiring for</span>
          <select name="kind" defaultValue="school">
            <option value="school">A school or trust</option>
            <option value="business">A small business</option>
            <option value="other">Something else</option>
          </select>
        </label>
      </div>
      <label>
        <span>What would you like help with?</span>
        <textarea name="message" rows={5} required placeholder="A sentence or two is plenty — e.g. 'We'd like an INSET session on using AI safely for planning and feedback.'" />
      </label>
      <label className="hp-field" aria-hidden="true"><span>Website</span><input name="company_website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-primary" type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Sending…" : "Request a free consultation"}
      </button>
      {state === "error" && <p className="form-error" role="alert">{error}</p>}
      <small>No obligation, no hard sell. Your details are only used to reply to you.</small>
    </form>
  );
}
