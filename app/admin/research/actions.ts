"use server";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { advanceResearchRun, isArea, startResearchRun, stopResearchRun } from "@/lib/research";

// Called from the research controls on /admin/research. Each call does at most one step of work.

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

const failed = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 400);

export async function startRun(area: string) {
  await requireAdmin();
  if (!isArea(area)) return { message: "Unknown research area.", finished: true };
  try {
    return { ...(await startResearchRun(area)), finished: false };
  } catch (e) {
    return { message: `Research couldn't start: ${failed(e)}`, finished: true };
  }
}

export async function runNextStep(runId: number) {
  await requireAdmin();
  try {
    return await advanceResearchRun(Number(runId));
  } catch (e) {
    return { message: `Something went wrong running this step: ${failed(e)}. Nothing is repeated automatically; press Continue to carry on.`, finished: false };
  }
}

export async function stopRun(runId: number) {
  await requireAdmin();
  try {
    return { ...(await stopResearchRun(Number(runId))), finished: true };
  } catch (e) {
    return { message: `The run couldn't be stopped: ${failed(e)}`, finished: false };
  }
}
