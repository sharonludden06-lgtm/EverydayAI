import { cronAuthorised } from "@/lib/config";
import { FRIDAY_JOBS, runFridayJob } from "@/lib/research-schedule";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Friday research: six jobs an hour apart (see vercel.json). Each one does nothing unless the switch on the
// Research page is on. Not connected to the newsletter.
export async function GET(request: Request, { params }: { params: Promise<{ job: string }> }) {
  if (!cronAuthorised(request)) return new Response("Unauthorised", { status: 401 });
  const job = Number((await params).job);
  if (!Number.isInteger(job) || job < 1 || job > FRIDAY_JOBS) return new Response("Not found", { status: 404 });
  try {
    return Response.json(await runFridayJob({ job }));
  } catch (error) {
    console.error("Friday research job failed", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
