import { getSql } from "@/db";
import { adminEmail, siteUrl } from "@/lib/config";
import { sendOne } from "@/lib/email";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(request: Request) {
  try {
    const p = (await request.json()) as Record<string, string | undefined>;
    if (p.company_website) return Response.json({ ok: true }); // spam trap
    const name = p.name?.trim().slice(0, 120) ?? "";
    const email = p.email?.trim().toLowerCase().slice(0, 254) ?? "";
    const organisation = p.organisation?.trim().slice(0, 160) ?? "";
    const kind = ["school", "business", "other"].includes(p.kind ?? "") ? p.kind! : "other";
    const message = p.message?.trim().slice(0, 4000) ?? "";
    if (!name || !message) return Response.json({ error: "Please add your name and a short message." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const sql = await getSql();
    await sql`INSERT INTO enquiries (name, email, organisation, kind, message)
              VALUES (${name}, ${email}, ${organisation}, ${kind}, ${message})`;

    const to = adminEmail();
    if (to) {
      const label = kind === "school" ? "School" : kind === "business" ? "Business" : "Enquiry";
      await sendOne({
        to,
        replyTo: email,
        subject: `New ${label.toLowerCase()} enquiry: ${organisation || name}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
<p><strong>${esc(name)}</strong> (${esc(email)})${organisation ? `<br>${esc(organisation)}` : ""}<br>${label}</p>
<p style="white-space:pre-wrap;background:#f4f6fa;padding:14px;border-radius:8px;">${esc(message)}</p>
<p>Just hit <strong>Reply</strong> to answer them. <a href="${siteUrl()}/admin/enquiries">All enquiries</a></p></div>`,
        text: `${name} <${email}>\n${organisation}\n${label}\n\n${message}\n\nReply to this email to answer them.`,
      }).catch((e) => console.error("Enquiry notice failed", e));
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Enquiry failed", error);
    return Response.json({ error: "Sorry, that didn't send. Please try again." }, { status: 500 });
  }
}
