import Link from "next/link";

export function AdminNav({ current }: { current: "subscribers" | "newsletter" | "enquiries" }) {
  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      <Link className={current === "subscribers" ? "active" : ""} href="/admin">Subscribers</Link>
      <Link className={current === "newsletter" ? "active" : ""} href="/admin/newsletter">Newsletter</Link>
      <Link className={current === "enquiries" ? "active" : ""} href="/admin/enquiries">Enquiries</Link>
    </nav>
  );
}

const LABELS: Record<string, string> = {
  draft: "Draft — needs review",
  approved: "Approved — sends Sunday",
  sending: "Sending…",
  sent: "Sent",
  failed: "Failed",
};

export function IssueStatus({ status }: { status: string }) {
  return <span className={`issue-status ${status}`}>{LABELS[status] ?? status}</span>;
}
