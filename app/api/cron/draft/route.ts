import { cronAuthorised } from "@/lib/config";
import { createDraft } from "@/lib/newsletter";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Runs every Saturday morning (see vercel.json).
export async function GET(request: Request) {
  if (!cronAuthorised(request)) return new Response("Unauthorised", { status: 401 });
  try {
    return Response.json(await createDraft());
  } catch (error) {
    console.error("Saturday draft failed", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
