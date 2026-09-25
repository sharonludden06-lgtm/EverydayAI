import { getSql } from "@/db";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      email?: string;
      firstName?: string;
      source?: string;
      company?: string; // hidden honeypot field — real people leave it empty
    };
    if (payload.company) {
      return Response.json({ message: "You’re on the list." }, { status: 201 });
    }
    const email = payload.email?.trim().toLowerCase().slice(0, 254) || "";
    const firstName = payload.firstName?.trim().slice(0, 80) || "";
    const source = payload.source?.trim().slice(0, 80) || "website";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const sql = await getSql();
    await sql`
      INSERT INTO subscribers (email, first_name, source)
      VALUES (${email}, ${firstName}, ${source})
      ON CONFLICT (email) DO UPDATE
        SET first_name = EXCLUDED.first_name,
            source = EXCLUDED.source,
            status = 'subscribed',
            unsubscribed_at = NULL`;
    return Response.json(
      { message: "Your first calm, useful edit will be with you soon." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    return Response.json({ error: "We couldn’t save that just now. Please try again." }, { status: 500 });
  }
}
