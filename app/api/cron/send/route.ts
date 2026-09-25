import { cronAuthorised } from "@/lib/config";
import { sendApproved } from "@/lib/newsletter";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Runs every Sunday morning (see vercel.json).
export async function GET(request: Request) {
  if (!cronAuthorised(request)) return new Response("Unauthorised", { status: 401 });
  try {
    return Response.json(await sendApproved());
  } catch (error) {
    console.error("Sunday send failed", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
