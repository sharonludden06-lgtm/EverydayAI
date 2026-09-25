import { unsubscribeByToken } from "@/lib/unsubscribe";

// One-click unsubscribe used by Gmail/Outlook's "Unsubscribe" button
// (List-Unsubscribe-Post header). Emails link to /unsubscribe?token=… for people.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const ok = await unsubscribeByToken(token);
  return new Response(ok ? "Unsubscribed" : "Not found", { status: ok ? 200 : 404 });
}
